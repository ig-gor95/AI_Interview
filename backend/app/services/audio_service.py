"""Audio storage and management service"""
import aiofiles
import os
from typing import Optional
from pathlib import Path
from app.config import settings


class AudioService:
    """Service for managing audio files"""
    
    def __init__(self):
        self.storage_path = Path(settings.audio_storage_path)
        self.max_size_mb = settings.max_audio_size_mb
        self.max_size_bytes = self.max_size_mb * 1024 * 1024
        
        # Create storage directory if it doesn't exist
        self.storage_path.mkdir(parents=True, exist_ok=True)
    
    async def save_audio(
        self,
        interview_id: str,
        audio_data: bytes,
        filename: Optional[str] = None
    ) -> str:
        """
        Save audio file to storage
        
        Args:
            interview_id: Interview ID
            audio_data: Audio bytes
            filename: Optional filename (default: interview_id.mp3)
            
        Returns:
            Path to saved file
        """
        # Validate size
        if len(audio_data) > self.max_size_bytes:
            raise ValueError(f"Audio file too large. Max size: {self.max_size_mb}MB")
        
        # Create directory for interview
        interview_dir = self.storage_path / interview_id
        interview_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate filename
        if not filename:
            filename = f"{interview_id}.mp3"
        
        file_path = interview_dir / filename
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(audio_data)
        
        return str(file_path)
    
    async def get_audio(self, interview_id: str, filename: Optional[str] = None) -> Optional[bytes]:
        """
        Get audio file from storage
        
        Args:
            interview_id: Interview ID
            filename: Optional filename
            
        Returns:
            Audio bytes or None if not found
        """
        interview_dir = self.storage_path / interview_id
        
        if not filename:
            filename = f"{interview_id}.mp3"
        
        file_path = interview_dir / filename
        
        if not file_path.exists():
            return None
        
        async with aiofiles.open(file_path, 'rb') as f:
            return await f.read()
    
    async def delete_audio(self, interview_id: str, filename: Optional[str] = None) -> bool:
        """
        Delete audio file
        
        Args:
            interview_id: Interview ID
            filename: Optional filename
            
        Returns:
            True if deleted, False if not found
        """
        interview_dir = self.storage_path / interview_id
        
        if not filename:
            filename = f"{interview_id}.mp3"
        
        file_path = interview_dir / filename
        
        if file_path.exists():
            file_path.unlink()
            return True
        
        return False

