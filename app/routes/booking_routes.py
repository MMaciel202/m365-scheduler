from fastapi import APIRouter, Form, HTTPException
from app.services.booking_service import create_booking, cancel_booking

router = APIRouter(tags=["Bookings"])


@router.post("/book")
def book_appointment(
    name: str = Form(...),
    email: str = Form(...),
    appointment_date: str = Form(...),
    start_time: str = Form(...),
    end_time: str = Form(...),
):
    try:
        result = create_booking(
            name=name,
            email=email,
            date=appointment_date,
            start_time=start_time,
            end_time=end_time,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/cancel")
def cancel_appointment(cancel_token: str = Form(...)):
    try:
        result = cancel_booking(cancel_token)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))