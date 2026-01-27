#!/usr/bin/env python3
"""Standalone test for Google Cloud TTS without app dependencies"""

import os
import asyncio
from google.cloud import texttospeech

async def test_google_standalone():
    """Test Google Cloud TTS without app dependencies"""

    # Hardcoded path to credentials (change if needed)
    credentials_path = "/Users/igorlapin/PycharmProjects/AI_Interview/backend/majestic-camp-315514-943a8d82b2b5.json"

    if not os.path.exists(credentials_path):
        print(f"❌ Credentials file not found: {credentials_path}")
        print("Please update the path in this script")
        return

    # Set credentials
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path

    try:
        print("🔧 Initializing Google Cloud TTS client...")
        client = texttospeech.TextToSpeechClient()
        print("✅ Google Cloud TTS client initialized successfully")

        # Test Russian text
        test_texts = [
            "Привет! Я голосовой помощник для проведения интервью.",
            "Расскажите о вашем опыте работы в этой области.",
            "Каковы ваши сильные стороны?"
        ]

        for i, text in enumerate(test_texts, 1):
            print(f"\n🎤 Test {i}: Generating speech for '{text[:50]}...'")

            # Set up synthesis input
            synthesis_input = texttospeech.SynthesisInput(text=text)

            # Configure voice - try different Russian voices
            voices_to_test = [
                "ru-RU-Wavenet-A",          # Good quality Wavenet
                "ru-RU-Neural2-A",          # Neural2 if available
                "ru-RU-Standard-A"          # Standard quality
            ]

            for voice_name in voices_to_test:
                try:
                    print(f"  🎵 Testing voice: {voice_name}")

                    voice = texttospeech.VoiceSelectionParams(
                        language_code="ru-RU",
                        name=voice_name,
                        ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
                    )

                    # Configure audio
                    audio_config = texttospeech.AudioConfig(
                        audio_encoding=texttospeech.AudioEncoding.MP3,
                        speaking_rate=1.0,
                        pitch=0.0
                    )

                    # Generate speech
                    response = client.synthesize_speech(
                        input=synthesis_input,
                        voice=voice,
                        audio_config=audio_config
                    )

                    # Save audio
                    output_file = f"test_russian_{i}_{voice_name.split('-')[-1]}.mp3"
                    with open(output_file, "wb") as out:
                        out.write(response.audio_content)

                    print(f"    ✅ Success: {len(response.audio_content)} bytes saved to {output_file}")

                except Exception as voice_error:
                    print(f"    ❌ Voice {voice_name} failed: {voice_error}")

        print("
🎯 Test completed!"        print("📁 Generated audio files:")
        for file in os.listdir('.'):
            if file.startswith('test_russian_') and file.endswith('.mp3'):
                print(f"   - {file}")

        # Get available voices
        print("
🔍 Getting available Russian voices..."        voices_response = client.list_voices()
        russian_voices = [
            voice for voice in voices_response.voices
            if voice.language_codes and "ru-RU" in voice.language_codes
        ]

        print(f"📋 Found {len(russian_voices)} Russian voices:")
        for voice in russian_voices[:10]:  # Show first 10
            print(f"   - {voice.name} ({voice.ssml_gender.name})")

        if len(russian_voices) > 10:
            print(f"   ... and {len(russian_voices) - 10} more")

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_google_standalone())