from fastapi import APIRouter, HTTPException
from app.services.availability_service import get_available_slots

router = APIRouter(tags=["Availability"])

@router.get("/available-slots")
def available_slots(date: str):
    try:
        return get_available_slots(date)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))