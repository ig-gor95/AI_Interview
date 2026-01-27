#!/usr/bin/env python3
"""Simple TTS test without full app dependencies"""

import os
import asyncio
from app.services.google_cloud_tts_service import GoogleCloudTTSService

async def test_tts_generation():
    """Test TTS audio generation"""
    print("🧪 Testing TTS audio generation...")

    # Set credentials
    credentials_path = os.path.join(os.path.dirname(__file__), 'majestic-camp-315514-943a8d82b2b5.json')

    if not os.path.exists(credentials_path):
        print(f"❌ Credentials file not found: {credentials_path}")
        return False

    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path

    try:
        # Initialize TTS service
        tts_service = GoogleCloudTTSService(
            credentials_path=credentials_path,
            voice_name="ru-RU-Wavenet-A",
            language_code="ru-RU"
        )
        print("✅ TTS service initialized")

        # Test text generation
        test_text = "Привет! Это тест озвучки для собеседования."
        print(f"🎤 Generating audio for: '{test_text}'")

        audio_bytes = await tts_service.text_to_speech(test_text)
        print(f"✅ Audio generated successfully: {len(audio_bytes)} bytes")

        # Save test audio
        output_file = "test_tts_output.mp3"
        with open(output_file, "wb") as f:
            f.write(audio_bytes)
        print(f"💾 Test audio saved to: {output_file}")

        return True

    except Exception as e:
        print(f"❌ TTS test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_tts_generation())
    if success:
        print("\n🎉 TTS is working! The backend should now generate audio URLs.")
    else:
        print("\n💥 TTS test failed. Check credentials and network connection.")