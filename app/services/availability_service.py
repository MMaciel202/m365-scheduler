import requests
from datetime import datetime
from app.services.booking_service import get_headers, get_calendar_id
from app.database.supabase_client import supabase

START_HOUR = 10
END_HOUR = 16


def get_outlook_events(date: str):
    headers = get_headers()
    calendar_id = get_calendar_id()

    start = f"{date}T00:00:00"
    end = f"{date}T23:59:59"

    url = f"https://graph.microsoft.com/v1.0/me/calendars('{calendar_id}')/calendarView"
    params = {
        "startDateTime": start,
        "endDateTime": end,
    }

    response = requests.get(url, headers=headers, params=params, timeout=30)

    if response.status_code != 200:
        raise Exception(response.text)

    return response.json().get("value", [])


def get_active_db_bookings(date: str):
    response = (
        supabase.table("bookings")
        .select("start_time,end_time,status")
        .eq("appointment_date", date)
        .eq("status", "active")
        .execute()
    )

    return response.data or []


def get_available_slots(date: str):
    selected_date = datetime.strptime(date, "%Y-%m-%d")

    # 0 = Monday, 5 = Saturday, 6 = Sunday
    if selected_date.weekday() >= 5:
        return {
            "date": date,
            "available_slots": [],
            "message": "No availability on weekends."
        }

    busy = []

    # Outlook
    outlook_events = get_outlook_events(date)
    for event in outlook_events:
        start = event["start"]["dateTime"][11:16]
        end = event["end"]["dateTime"][11:16]
        busy.append((start, end))

    # Supabase
    db_bookings = get_active_db_bookings(date)
    for booking in db_bookings:
        start = str(booking["start_time"])[:5]
        end = str(booking["end_time"])[:5]
        busy.append((start, end))

    busy = list(set(busy))

    slots = []

    for hour in range(START_HOUR, END_HOUR):
        slot_start = f"{hour:02d}:00"
        slot_end = f"{hour+1:02d}:00"

        overlap = False
        for busy_start, busy_end in busy:
            if not (slot_end <= busy_start or slot_start >= busy_end):
                overlap = True
                break

        if not overlap:
            slots.append({
                "start": slot_start,
                "end": slot_end
            })

    return {
        "date": date,
        "available_slots": slots
    }