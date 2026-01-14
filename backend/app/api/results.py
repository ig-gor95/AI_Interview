"""Results API routes"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.database import get_db
from app.models.user import User
from app.utils.auth import get_current_organizer

router = APIRouter()


@router.get("/{result_id}")
async def get_result(
    result_id: str,
    current_user: User = Depends(get_current_organizer),
    db: AsyncSession = Depends(get_db)
):
    """Get result by ID"""
    # TODO: Implement when evaluation models are used
    return {"message": f"Result {result_id} - to be implemented"}


@router.get("/{result_id}/audio")
async def get_result_audio(
    result_id: str,
    current_user: User = Depends(get_current_organizer),
    db: AsyncSession = Depends(get_db)
):
    """Get audio file for result"""
    # TODO: Implement audio file serving
    return {"message": f"Audio for result {result_id} - to be implemented"}
