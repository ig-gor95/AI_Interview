"""Audio merging service for combining interview audio chunks"""

import os
import io
import asyncio
from typing import List, Optional
from pathlib import Path
from app.config import settings
from app.services.audio_service import AudioService


class AudioMergeService:
    """Service for merging multiple audio files into a single recording"""

    def __init__(self):
        self.audio_service = AudioService()

    async def merge_interview_audio(self, session_id: str) -> Optional[str]:
        """
        Merge all audio chunks for an interview session into a single file

        Args:
            session_id: The interview session ID

        Returns:
            Path to the merged audio file, or None if merging failed
        """
        try:
            print(f"[AudioMerge] Starting audio merge for session {session_id}")

            # Get all audio chunks for this session
            audio_chunks = await self._get_session_audio_chunks(session_id)

            if not audio_chunks:
                print(f"[AudioMerge] No audio chunks found for session {session_id}")
                return None

            print(f"[AudioMerge] Found {len(audio_chunks)} audio chunks")

            # Sort chunks by timestamp/order_index to maintain chronological order
            audio_chunks.sort(key=lambda x: x.get('order_index', 0))

            # Merge the audio files
            merged_audio = await self._merge_audio_files(audio_chunks)

            if merged_audio:
                # Save the merged audio with session ID as filename
                merged_path = await self.audio_service.save_audio(
                    interview_id=session_id,
                    audio_data=merged_audio,
                    filename=f"{session_id}_complete.mp3"
                )

                print(f"[AudioMerge] Successfully merged audio: {merged_path}")
                return merged_path

            return None

        except Exception as e:
            print(f"[AudioMerge] Error merging audio for session {session_id}: {e}")
            import traceback
            traceback.print_exc()
            return None

    async def _get_session_audio_chunks(self, session_id: str) -> List[dict]:
        """
        Get all audio chunks for a session from the database

        Args:
            session_id: The session ID

        Returns:
            List of audio chunk records with file paths
        """
        try:
            from app.database import AsyncSessionLocal
            from app.models.session import SessionTranscript
            from sqlalchemy import select

            async with AsyncSessionLocal() as db:
                # Get all transcripts with audio URLs for this session
                result = await db.execute(
                    select(SessionTranscript)
                    .where(SessionTranscript.session_id == session_id)
                    .where(SessionTranscript.audio_chunk_url.isnot(None))
                    .order_by(SessionTranscript.order_index)
                )

                transcripts = result.scalars().all()

                audio_chunks = []
                for transcript in transcripts:
                    if transcript.audio_chunk_url:
                        # Extract filename from URL
                        # URL format: /api/results/audio/{session_id}/{filename}
                        url_parts = transcript.audio_chunk_url.split('/')
                        if len(url_parts) >= 2:
                            filename = url_parts[-1]  # Last part is filename

                            # Build full path
                            session_dir = self.audio_service.storage_path / session_id
                            file_path = session_dir / filename

                            if file_path.exists():
                                audio_chunks.append({
                                    'file_path': str(file_path),
                                    'order_index': transcript.order_index,
                                    'role': transcript.role,
                                    'timestamp': transcript.timestamp
                                })

                return audio_chunks

        except Exception as e:
            print(f"[AudioMerge] Error getting audio chunks: {e}")
            return []

    async def _merge_audio_files(self, audio_chunks: List[dict]) -> Optional[bytes]:
        """
        Merge multiple audio files into one

        Args:
            audio_chunks: List of audio chunk info with file paths

        Returns:
            Merged audio data as bytes, or None if failed
        """
        if not audio_chunks:
            return None

        try:
            # Import pydub here to avoid import errors if not installed
            from pydub import AudioSegment

            print(f"[AudioMerge] Merging {len(audio_chunks)} audio files")

            # Load all audio files
            audio_segments = []
            for chunk in audio_chunks:
                try:
                    audio = AudioSegment.from_file(chunk['file_path'])
                    audio_segments.append(audio)
                    print(f"[AudioMerge] Loaded audio chunk: {chunk['file_path']} ({len(audio)}ms)")
                except Exception as e:
                    print(f"[AudioMerge] Failed to load audio chunk {chunk['file_path']}: {e}")
                    continue

            if not audio_segments:
                print("[AudioMerge] No valid audio segments to merge")
                return None

            # Concatenate all audio segments
            merged_audio = audio_segments[0]
            for segment in audio_segments[1:]:
                merged_audio += segment

            # Export as MP3
            output_buffer = io.BytesIO()
            merged_audio.export(output_buffer, format='mp3', bitrate='128k')
            merged_data = output_buffer.getvalue()

            print(f"[AudioMerge] Successfully merged audio: {len(merged_data)} bytes, {len(merged_audio)}ms")

            return merged_data

        except ImportError:
            print("[AudioMerge] pydub not installed. Install with: pip install pydub")
            return None
        except Exception as e:
            print(f"[AudioMerge] Error merging audio files: {e}")
            import traceback
            traceback.print_exc()
            return None


# Global instance
audio_merge_service = AudioMergeService()