#!/usr/bin/env python3
"""Test Google Cloud TTS with Russian voices"""

import asyncio
import os
from app.services.google_cloud_tts_service import GoogleCloudTTSService

async def test_google_tts():
    """Test Google Cloud TTS functionality"""

    # Set up credentials path
    credentials_path = os.path.join(os.getcwd(), 'majestic-camp-315514-943a8d82b2b5.json')
    if not os.path.exists(credentials_path):
        print(f"❌ Credentials file not found: {credentials_path}")
        print("Make sure the service account JSON file is in the backend directory")
        return

    try:
        service = GoogleCloudTTSService(credentials_path=credentials_path)
        print("✅ Google Cloud TTS service initialized")

        # Test Russian voice
        test_text = "Привет! Я голосовой помощник для проведения интервью."
        print(f"🎤 Testing with text: '{test_text}'")

        audio_bytes = await service.text_to_speech(
            text=test_text,
            voice_name="ru-RU-Wavenet-A",
            language_code="ru-RU"
        )

        print(f"✅ Audio generated successfully: {len(audio_bytes)} bytes")

        # Save test audio file
        output_file = "test_russian_tts.mp3"
        with open(output_file, "wb") as f:
            f.write(audio_bytes)

        print(f"💾 Test audio saved to: {output_file}")
        print("🎧 Play this file to test voice quality")

        # List available Russian voices
        print("\n🔍 Available Russian voices:")
        voices = await service.get_available_voices("ru-RU")

        for i, voice in enumerate(voices[:10]):  # Show first 10
            print(f"  {i+1}. {voice.name}")

        if len(voices) > 10:
            print(f"  ... and {len(voices) - 10} more")

        # Find best Russian voice
        best_voice = await service.find_best_russian_voice()
        if best_voice:
            print(f"\n🎯 Recommended Russian voice: {best_voice}")
            print("You can use this voice by updating the service initialization")
        else:
            print("\n🎯 Default Russian voice: ru-RU-Chirp3-HD-Audio-001 (Chirp3 HD)")

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_google_tts())