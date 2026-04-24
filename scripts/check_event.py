import requests
from test_auth import get_token  # ou sua função de auth

event_id = "sb_secret_rMqCGWHfB1O_EVENT_ID"

access_token = get_token()

url = f"https://graph.microsoft.com/v1.0/me/events/{event_id}"

headers = {
    "Authorization": f"Bearer {access_token}"
}

response = requests.get(url, headers=headers)

print("STATUS:", response.status_code)
print(response.json())