"""Google Cloud Text-to-Speech service for natural Russian speech"""

import os
from typing import Optional
from google.cloud import texttospeech


class GoogleCloudTTSService:
    """Service for Google Cloud Text-to-Speech with Russian voices"""

    def __init__(self, credentials_path: Optional[str] = None, voice_name: str = "ru-RU-Wavenet-A", language_code: str = "ru-RU"):
        # Set credentials path if provided
        if credentials_path:
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path
        elif 'GOOGLE_APPLICATION_CREDENTIALS' not in os.environ:
            # Try to find credentials in current directory
            default_path = os.path.join(os.getcwd(), 'majestic-camp-315514-943a8d82b2b5.json')
            if os.path.exists(default_path):
                os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = default_path

        try:
            self.client = texttospeech.TextToSpeechClient()
            print("[GoogleCloudTTS] Service initialized successfully")
        except Exception as e:
            print(f"[GoogleCloudTTS] Failed to initialize: {e}")
            raise

        # Voice settings
        self.voice_name = voice_name
        self.language_code = language_code

    async def text_to_speech(
        self,
        text: str,
        voice_name: Optional[str] = None,
        language_code: Optional[str] = None
    ) -> bytes:
        """
        Convert text to speech using Google Cloud TTS

        Args:
            text: Text to convert
            voice_name: Voice name (e.g., "ru-RU-Chirp3-HD-Audio-001")
            language_code: Language code (e.g., "ru-RU")

        Returns:
            Audio bytes in MP3 format
        """
        try:
            voice_name = voice_name or self.voice_name
            language_code = language_code or self.language_code

            print(f"[GoogleCloudTTS] Generating audio for text (length: {len(text)}), voice: {voice_name}, language: {language_code}")

            # Set the text input
            synthesis_input = texttospeech.SynthesisInput(text=text)

            # Build the voice request
            voice = texttospeech.VoiceSelectionParams(
                language_code=language_code,
                name=voice_name,
                ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
            )

            # Select the audio file type and configuration
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=1.0,  # Normal speed
                pitch=0.0  # Normal pitch
            )

            # Perform the text-to-speech request
            response = self.client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )

            audio_bytes = response.audio_content
            print(f"[GoogleCloudTTS] Audio generated, size: {len(audio_bytes)} bytes")

            if len(audio_bytes) == 0:
                raise Exception("Google Cloud TTS returned empty audio data")

            print("[GoogleCloudTTS] Audio generation completed successfully")
            return audio_bytes

        except Exception as e:
            print(f"[GoogleCloudTTS] ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
            raise Exception(f"Error converting text to speech with Google Cloud: {str(e)}")

    async def get_available_voices(self, language_code: Optional[str] = None):
        """
        Get available voices, optionally filtered by language

        Args:
            language_code: Language code to filter voices (e.g., "ru-RU")

        Returns:
            List of available voices
        """
        try:
            # List all available voices
            response = self.client.list_voices()

            if language_code:
                # Filter voices by language
                filtered_voices = [
                    voice for voice in response.voices
                    if voice.language_codes and language_code in voice.language_codes
                ]
                return filtered_voices
            else:
                return response.voices

        except Exception as e:
            print(f"[GoogleCloudTTS] ERROR getting voices: {str(e)}")
            return []

    async def find_best_russian_voice(self):
        """
        Find the best Russian voice available

        Returns:
            Voice name string, or None if not found
        """
        try:
            voices = await self.get_available_voices("ru-RU")

            if not voices:
                return None

            # Print available voices for debugging
            print(f"[GoogleCloudTTS] Available Russian voices:")
            for voice in voices[:10]:  # Show first 10
                print(f"  - {voice.name}")

            # Prefer higher quality voices in this order:
            # 1. Wavenet (good quality)
            # 2. Neural2 (good quality)
            # 3. Standard (basic quality)

            preferred_patterns = ["Wavenet", "Neural2", "Standard"]

            for pattern in preferred_patterns:
                matching_voices = [
                    voice for voice in voices
                    if pattern in voice.name
                ]
                if matching_voices:
                    return matching_voices[0].name

            # Fallback to first available voice
            return voices[0].name

        except Exception as e:
            print(f"[GoogleCloudTTS] ERROR finding Russian voice: {str(e)}")
            return "ru-RU-Wavenet-A"  # Safe fallback