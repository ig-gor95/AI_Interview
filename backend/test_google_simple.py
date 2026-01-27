#!/usr/bin/env python3
"""Simple test for Google Cloud TTS without full app config"""

import os
import asyncio
from google.cloud import texttospeech

async def test_google_simple():
    """Simple test of Google Cloud TTS"""

    # Set credentials path
    credentials_path = "/Users/igorlapin/PycharmProjects/AI_Interview/backend/majestic-camp-315514-943a8d82b2b5.json"

    if not os.path.exists(credentials_path):
        print(f"❌ Credentials file not found: {credentials_path}")
        return

    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path

    try:
        # Initialize client
        client = texttospeech.TextToSpeechClient()
        print("✅ Google Cloud TTS client initialized")

        # Test text
        text = "Привет! Это тест русской речи от Google Cloud Text-to-Speech."

        # Set up synthesis input
        synthesis_input = texttospeech.SynthesisInput(text=text)

        # Configure voice
        voice = texttospeech.VoiceSelectionParams(
            language_code="ru-RU",
            name="ru-RU-Chirp3-HD-Audio-001",
            ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
        )

        # Configure audio
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )

        # Generate speech
        print("🎤 Generating speech...")
        response = client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config
        )

        # Save audio
        output_file = "test_russian_simple.mp3"
        with open(output_file, "wb") as out:
            out.write(response.audio_content)
            print(f"💾 Audio saved to: {output_file} ({len(response.audio_content)} bytes)")

        print("✅ Test completed successfully!")

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_google_simple())