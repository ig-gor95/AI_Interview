"""Results API routes"""
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.database import get_db
from app.models.user import User
from app.services.audio_service import AudioService
from app.utils.auth import get_current_organizer, get_current_user

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


@router.get("/audio/{interview_id}/{filename}")
async def get_audio_file(
    interview_id: str,
    filename: str,
    audio_service: AudioService = Depends(lambda: AudioService())
):
    """Get audio file by interview ID and filename"""
    try:
        audio_data = await audio_service.get_audio(interview_id, filename)
        if audio_data is None:
            raise HTTPException(status_code=404, detail="Audio file not found")

        return Response(
            content=audio_data,
            media_type="audio/mpeg",
            headers={"Content-Disposition": f"inline; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error serving audio file: {str(e)}")
