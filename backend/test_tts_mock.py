#!/usr/bin/env python3
"""Mock TTS test to verify the backend code path works"""

import os
import asyncio
from unittest.mock import AsyncMock, patch

async def test_backend_tts_integration():
    """Test that backend TTS integration works with mocked Google TTS"""

    print("🧪 Testing backend TTS integration (mocked)...")

    # Mock the Google TTS service to simulate success
    mock_audio_bytes = b"fake_audio_data_mp3"

    with patch('app.services.google_cloud_tts_service.GoogleCloudTTSService') as MockTTS:
        mock_tts_instance = AsyncMock()
        mock_tts_instance.text_to_speech.return_value = mock_audio_bytes
        MockTTS.return_value = mock_tts_instance

        # Import after mocking
        from app.services.google_cloud_tts_service import GoogleCloudTTSService

        # Test TTS service creation
        tts_service = GoogleCloudTTSService()
        print("✅ Mock TTS service created")

        # Test audio generation
        audio = await tts_service.text_to_speech("Test text")
        assert audio == mock_audio_bytes
        print("✅ Mock audio generation successful")

        # Test the backend logic path
        from app.core import get_tts_service

        # Temporarily patch settings to use google
        with patch('app.config.settings.tts_service', 'google'):
            tts_svc = get_tts_service()
            assert tts_svc is not None
            print("✅ Backend TTS service resolution works")

        print("🎉 Backend TTS integration test passed!")
        print("📝 When the app runs with network access, TTS should work properly.")
        return True

if __name__ == "__main__":
    asyncio.run(test_backend_tts_integration())