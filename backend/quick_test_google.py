#!/usr/bin/env python3
"""Quick test for Google Cloud TTS - minimal dependencies"""

import os
import asyncio
from google.cloud import texttospeech

async def quick_test():
    """Minimal test of Google Cloud TTS"""

    # Set credentials
    credentials_path = os.path.join(os.path.dirname(__file__), 'majestic-camp-315514-943a8d82b2b5.json')

    if not os.path.exists(credentials_path):
        print("❌ Credentials file not found")
        print(f"Expected: {credentials_path}")
        return

    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path

    try:
        print("🔧 Connecting to Google Cloud...")
        client = texttospeech.TextToSpeechClient()
        print("✅ Connected successfully!")

        # Simple test
        text = "Привет, это тест русской речи."
        print(f"🎤 Generating: '{text}'")

        response = client.synthesize_speech(
            input=texttospeech.SynthesisInput(text=text),
            voice=texttospeech.VoiceSelectionParams(
                language_code="ru-RU",
                name="ru-RU-Wavenet-A"  # Use a known working Russian voice
            ),
            audio_config=texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3
            )
        )

        # Save result
        with open("quick_test.mp3", "wb") as f:
            f.write(response.audio_content)

        print(f"✅ Success! Audio saved: quick_test.mp3 ({len(response.audio_content)} bytes)")
        print("🎧 Play the file to test voice quality")

    except Exception as e:
        print(f"❌ Failed: {e}")

if __name__ == "__main__":
    asyncio.run(quick_test())