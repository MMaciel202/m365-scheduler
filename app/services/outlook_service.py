import json
import os
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
from msal import PublicClientApplication

load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
AUTHORITY = os.getenv("AUTHORITY")
SCOPES = os.getenv("SCOPES", "").split()

CALENDAR_NAME = "Appointments"


def get_token():
    app = PublicClientApplication(
        client_id=CLIENT_ID,
        authority=AUTHORITY,
    )

    accounts = app.get_accounts()
    result = None

    if accounts:
        result = app.acquire_token_silent(SCOPES, account=accounts[0])

    if not result:
        print("Login...")
        result = app.acquire_token_interactive(scopes=SCOPES)

    if "access_token" not in result:
        print("Erro:")
        print(json.dumps(result, indent=2))
        raise SystemExit(1)

    return result["access_token"]


def get_calendar_id(headers):
    response = requests.get(
        "https://graph.microsoft.com/v1.0/me/calendars",
        headers=headers,
    )

    calendars = response.json().get("value", [])

    for cal in calendars:
        if cal["name"] == CALENDAR_NAME:
            return cal["id"]

    raise Exception("Calendário não encontrado")


def create_event(headers, calendar_id):
    start_time = datetime.now().replace(hour=11, minute=0, second=0, microsecond=0)
    end_time = start_time + timedelta(hours=1)

    url = f"https://graph.microsoft.com/v1.0/me/calendars('{calendar_id}')/events"

    body = {
        "subject": "Consulta Teste",
        "start": {
            "dateTime": start_time.isoformat(),
            "timeZone": "Eastern Standard Time"
        },
        "end": {
            "dateTime": end_time.isoformat(),
            "timeZone": "Eastern Standard Time"
        }
    }

    response = requests.post(url, headers=headers, json=body)

    print("STATUS:", response.status_code)
    print(response.text)


if __name__ == "__main__":
    token = get_token()

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    calendar_id = get_calendar_id(headers)
    create_event(headers, calendar_id)