from database import supabase
import secrets

data = {
    "name": "Monica",
    "email": "monica.test@email.com",
    "appointment_date": "2026-04-21",
    "start_time": "10:00",
    "end_time": "11:00",
    "outlook_event_id": "test-event-001",
    "cancel_token": secrets.token_urlsafe(24),
    "status": "active",
}

response = supabase.table("bookings").insert(data).execute()
print(response)