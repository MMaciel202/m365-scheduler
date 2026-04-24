import json
import os
from dotenv import load_dotenv
from msal import PublicClientApplication

load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
TENANT_ID = os.getenv("TENANT_ID")
AUTHORITY = f"https://login.microsoftonline.com/{TENANT_ID}"
SCOPES = ["User.Read", "Calendars.Read", "Calendars.ReadWrite"]

app = PublicClientApplication(
    client_id=CLIENT_ID,
    authority=AUTHORITY,
)

accounts = app.get_accounts()
result = None

if accounts:
    result = app.acquire_token_silent(SCOPES, account=accounts[0])

if not result:
    print("Abrindo login no navegador...")
    result = app.acquire_token_interactive(scopes=SCOPES)

if "access_token" in result:
    print("Login OK")
    print(result["access_token"][:80] + "...")
else:
    print("Erro de autenticação:")
    print(json.dumps(result, indent=2))