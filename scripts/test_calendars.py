import json
import os
import requests
from dotenv import load_dotenv
from msal import PublicClientApplication

load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
AUTHORITY = os.getenv("AUTHORITY")
SCOPES = os.getenv("SCOPES", "").split()

app = PublicClientApplication(
    client_id=CLIENT_ID,
    authority=AUTHORITY,
)

#accounts = app.get_accounts()
#result = None
accounts = app.get_accounts()
for account in accounts:
    app.remove_account(account)

result = app.acquire_token_interactive(scopes=SCOPES)

if accounts:
    result = app.acquire_token_silent(SCOPES, account=accounts[0])

if not result:
    print("Abrindo login no navegador...")
    result = app.acquire_token_interactive(scopes=SCOPES)

if "access_token" not in result:
    print("Erro de autenticação:")
    print(json.dumps(result, indent=2))
    raise SystemExit(1)

print("TOKEN SCOPES:")
print(result.get("scope"))
print("-" * 60)

headers = {
    "Authorization": f"Bearer {result['access_token']}",
    "Accept": "application/json",
}

url = "https://graph.microsoft.com/v1.0/me/calendars"
response = requests.get(url, headers=headers, timeout=30)

print("STATUS CODE:", response.status_code)
print("CONTENT-TYPE:", response.headers.get("Content-Type"))
print("RAW TEXT:")
print(repr(response.text))
print("-" * 60)

if response.text.strip():
    try:
        data = response.json()
        print(json.dumps(data, indent=2, ensure_ascii=False))
    except Exception as e:
        print("Falha ao converter JSON:")
        print(e)
else:
    print("A resposta veio vazia.")