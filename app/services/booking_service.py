import os
import secrets
from datetime import datetime
from typing import Optional

import requests
from dotenv import load_dotenv
from msal import PublicClientApplication
from app.database.supabase_client import supabase

load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
AUTHORITY = os.getenv("AUTHORITY")
SCOPES = os.getenv("SCOPES", "").split()

CALENDAR_NAME = "Appointments"
OUTLOOK_TIMEZONE = "Eastern Standard Time"


# =========================
# AUTH
# =========================
def get_access_token() -> str:
    app = PublicClientApplication(CLIENT_ID, authority=AUTHORITY)

    accounts = app.get_accounts()
    result = None

    if accounts:
        result = app.acquire_token_silent(SCOPES, account=accounts[0])

    if not result:
        result = app.acquire_token_interactive(scopes=SCOPES)

    if "access_token" not in result:
        raise Exception("Failed to obtain Microsoft access token.")

    return result["access_token"]


def get_headers() -> dict:
    token = get_access_token()
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


# =========================
# OUTLOOK
# =========================
def get_calendar_id() -> str:
    headers = get_headers()

    response = requests.get(
        "https://graph.microsoft.com/v1.0/me/calendars",
        headers=headers,
        timeout=30,
    )

    if response.status_code != 200:
        raise Exception(f"Failed to load calendars: {response.text}")

    calendars = response.json().get("value", [])
    for cal in calendars:
        if cal.get("name") == CALENDAR_NAME:
            return cal["id"]

    raise Exception("Appointments calendar not found.")


def get_calendar_events_for_day(calendar_id: str, date: str) -> list:
    headers = get_headers()

    start = f"{date}T00:00:00"
    end = f"{date}T23:59:59"

    url = f"https://graph.microsoft.com/v1.0/me/calendars('{calendar_id}')/calendarView"
    params = {
        "startDateTime": start,
        "endDateTime": end,
    }

    response = requests.get(url, headers=headers, params=params, timeout=30)

    if response.status_code != 200:
        raise Exception(f"Failed to load day events: {response.text}")

    return response.json().get("value", [])


def slot_has_outlook_conflict(date: str, start_time: str, end_time: str) -> bool:
    calendar_id = get_calendar_id()
    events = get_calendar_events_for_day(calendar_id, date)

    requested_start = datetime.fromisoformat(f"{date}T{start_time}:00")
    requested_end = datetime.fromisoformat(f"{date}T{end_time}:00")

    for event in events:
        event_start = datetime.fromisoformat(event["start"]["dateTime"][:19])
        event_end = datetime.fromisoformat(event["end"]["dateTime"][:19])

        overlap = requested_start < event_end and requested_end > event_start
        if overlap:
            return True

    return False


def create_outlook_event(name: str, email: str, date: str, start_time: str, end_time: str) -> dict:
    headers = get_headers()
    calendar_id = get_calendar_id()

    body = {
        "subject": f"Appointment - {name}",
        "start": {
            "dateTime": f"{date}T{start_time}:00",
            "timeZone": OUTLOOK_TIMEZONE,
        },
        "end": {
            "dateTime": f"{date}T{end_time}:00",
            "timeZone": OUTLOOK_TIMEZONE,
        },
        "attendees": [
            {
                "emailAddress": {
                    "address": email,
                    "name": name,
                },
                "type": "required",
            }
        ],
    }

    url = f"https://graph.microsoft.com/v1.0/me/calendars('{calendar_id}')/events"
    response = requests.post(url, headers=headers, json=body, timeout=30)

    if response.status_code != 201:
        raise Exception(f"Failed to create Outlook event: {response.text}")

    return response.json()


def delete_outlook_event(event_id: str) -> bool:
    headers = get_headers()
    url = f"https://graph.microsoft.com/v1.0/me/events/{event_id}"
    response = requests.delete(url, headers=headers, timeout=30)
    return response.status_code == 204


# =========================
# SUPABASE
# =========================
def slot_has_db_conflict(date: str, start_time: str, end_time: str) -> bool:
    response = (
        supabase.table("bookings")
        .select("id")
        .eq("appointment_date", date)
        .eq("start_time", start_time)
        .eq("end_time", end_time)
        .eq("status", "active")
        .limit(1)
        .execute()
    )

    return bool(response.data)


def save_booking(name: str, email: str, date: str, start_time: str, end_time: str, event_id: str) -> dict:
    cancel_token = secrets.token_urlsafe(32)

    data = {
        "name": name,
        "email": email,
        "appointment_date": date,
        "start_time": start_time,
        "end_time": end_time,
        "outlook_event_id": event_id,
        "cancel_token": cancel_token,
        "status": "active",
        # se você criar o campo booleano, descomente:
        "is_active": True,
    }

    response = supabase.table("bookings").insert(data).execute()

    if not response.data:
        raise Exception("Failed to save booking in Supabase.")

    return response.data[0]


def get_booking(cancel_token: str) -> Optional[dict]:
    response = (
        supabase.table("bookings")
        .select("*")
        .eq("cancel_token", cancel_token)
        .eq("status", "active")
        .limit(1)
        .execute()
    )

    if not response.data:
        return None

    return response.data[0]


def update_booking_status(booking_id: str) -> None:
    payload = {
        "status": "cancelled",
        # se você criar o campo booleano, descomente:
        "is_active": False,
    }

    supabase.table("bookings").update(payload).eq("id", booking_id).execute()


# =========================
# MAIN FUNCTIONS
# =========================
def create_booking(name: str, email: str, date: str, start_time: str, end_time: str) -> dict:
    # 1. valida no banco
    if slot_has_db_conflict(date, start_time, end_time):
        raise Exception("This time slot is already booked.")

    # 2. valida no Outlook
    if slot_has_outlook_conflict(date, start_time, end_time):
        raise Exception("This time slot is no longer available.")

    # 3. cria evento no Outlook
    event = create_outlook_event(name, email, date, start_time, end_time)

    try:
        # 4. salva no banco
        booking = save_booking(
            name=name,
            email=email,
            date=date,
            start_time=start_time,
            end_time=end_time,
            event_id=event["id"],
        )
    except Exception:
        # rollback: se falhar no banco, remove o evento criado no Outlook
        delete_outlook_event(event["id"])
        raise

    return {
        "message": "Booking created successfully",
        "cancel_token": booking["cancel_token"],
        "event_id": event["id"],
    }


def cancel_booking(cancel_token: str) -> dict:
    booking = get_booking(cancel_token)

    if not booking:
        raise Exception("Booking not found or already cancelled.")

    success = delete_outlook_event(booking["outlook_event_id"])
    if not success:
        raise Exception("Failed to delete Outlook event.")

    update_booking_status(booking["id"])

    return {
        "message": "Booking cancelled successfully"
    }