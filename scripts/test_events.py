import json
import os
import requests
from dotenv import load_dotenv
from msal import PublicClientApplication

load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
AUTHORITY = os.getenv("AUTHORITY")
SCOPES = os.getenv("SCOPES", "").split()
CALENDAR_NAME = "Appointments"

app = PublicClientApplication(
    client_id=CLIENT_ID,
    authority=AUTHORITY,
)

# limpa contas antigas para evitar sessão errada
for acc in app.get_accounts():
    app.remove_account(acc)

print("Login...")
result = app.acquire_token_interactive(scopes=SCOPES)

if "access_token" not in result:
    print("Erro de autenticação:")
    print(json.dumps(result, indent=2))
    raise SystemExit(1)

headers = {
    "Authorization": f"Bearer {result['access_token']}",
    "Accept": "application/json",
}

# 1) listar calendários
cal_response = requests.get(
    "https://graph.microsoft.com/v1.0/me/calendars",
    headers=headers,
    timeout=30,
)

print("Calendars status:", cal_response.status_code)

if cal_response.status_code != 200:
    print(cal_response.text)
    raise SystemExit(1)

cal_data = cal_response.json()
calendars = cal_data.get("value", [])

calendar_id = None

for cal in calendars:
    if cal.get("name") == CALENDAR_NAME:
        calendar_id = cal.get("id")
        break

if not calendar_id:
    print(f'Calendário "{CALENDAR_NAME}" não encontrado.')
    raise SystemExit(1)

print("Calendar found:")
print("Name:", CALENDAR_NAME)
print("ID:", calendar_id)

# 2) usar o endpoint por path entre aspas simples
events_url = f"https://graph.microsoft.com/v1.0/me/calendars('{calendar_id}')/events"

events_response = requests.get(
    events_url,
    headers=headers,
    timeout=30,
)

print("\nEvents status:", events_response.status_code)
print(events_response.text)

if events_response.status_code == 200:
    events_data = events_response.json()
    print("\nJSON formatado:")
    print(json.dumps(events_data, indent=2, ensure_ascii=False))