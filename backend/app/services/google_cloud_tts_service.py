"""Google Cloud Text-to-Speech service for natural Russian speech"""

import os
import random
from typing import Optional
from google.cloud import texttospeech


class GoogleCloudTTSService:
    """Service for Google Cloud Text-to-Speech with Russian voices"""

    @staticmethod
    def _normalize_language_code_static(language_code: str) -> str:
        """
        Normalize language code to BCP-47 format required by Google Cloud TTS
        
        Args:
            language_code: Language code (e.g., "ru", "en", "ru-RU")
            
        Returns:
            Normalized language code (e.g., "ru-RU", "en-US")
        """
        if not language_code:
            return language_code
        
        language_code = language_code.strip()
        
        # If already in full format (contains hyphen), return as is
        if "-" in language_code:
            return language_code
        
        # Map short codes to full BCP-47 format
        language_map = {
            "ru": "ru-RU",
            "en": "en-US",
            "de": "de-DE",
            "fr": "fr-FR",
            "es": "es-ES",
            "it": "it-IT",
            "ja": "ja-JP",
            "ko": "ko-KR",
            "zh": "zh-CN",
        }
        
        normalized = language_map.get(language_code.lower(), language_code)
        if normalized != language_code:
            print(f"[GoogleCloudTTS] Normalized language code '{language_code}' -> '{normalized}'")
        
        return normalized

    def __init__(self, credentials_path: Optional[str] = None, voice_name: str = "ru-RU-Chirp3-HD-Fenrir", language_code: str = "ru-RU", speaking_rate: float = 1.0, pitch: float = 0.0):
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
        # Normalize language code to BCP-47 format (e.g., "ru" -> "ru-RU")
        self.language_code = self._normalize_language_code_static(language_code)
        self.speaking_rate = max(0.25, min(4.0, speaking_rate))  # Clamp to valid range 0.25-4.0
        self.pitch = max(-20.0, min(20.0, pitch))  # Clamp to valid range -20.0 to +20.0 semitones
        
        # Check available voices for the specified language (do it synchronously but don't block on errors)
        self._check_voice_availability()
    
    def _check_voice_availability(self):
        """Check if the configured voice is available and log available voices"""
        try:
            import asyncio
            # Try to get available voices synchronously
            response = self.client.list_voices()
            
            # Filter by language
            available_voices = [
                voice for voice in response.voices
                if voice.language_codes and self.language_code in voice.language_codes
            ]
            
            if available_voices:
                print(f"[GoogleCloudTTS] Found {len(available_voices)} available voices for {self.language_code}:")
                voice_names = [v.name for v in available_voices]
                
                # Show first 15 voices
                for voice_name_item in voice_names[:15]:
                    marker = " <-- CONFIGURED" if voice_name_item == self.voice_name else ""
                    print(f"  - {voice_name_item}{marker}")
                if len(voice_names) > 15:
                    print(f"  ... and {len(voice_names) - 15} more")
                
                # Check if configured voice is available
                if self.voice_name not in voice_names:
                    print(f"[GoogleCloudTTS] ⚠️  WARNING: Configured voice '{self.voice_name}' is NOT in the list of available voices!")
                    print(f"[GoogleCloudTTS] Available Chirp3 HD voices for {self.language_code}:")
                    chirp3_voices = [v for v in voice_names if "Chirp3" in v or "chirp" in v.lower()]
                    if chirp3_voices:
                        for v in chirp3_voices:
                            print(f"    - {v}")
                    else:
                        print(f"    (none found)")
                    print(f"[GoogleCloudTTS] Will fallback to ru-RU-Wavenet-A if voice fails")
                else:
                    print(f"[GoogleCloudTTS] ✅ Configured voice '{self.voice_name}' is available")
            else:
                print(f"[GoogleCloudTTS] ⚠️  WARNING: No voices found for language {self.language_code}")
        except Exception as e:
            print(f"[GoogleCloudTTS] Could not check voice availability: {e}")
            print(f"[GoogleCloudTTS] Will proceed with configured voice: {self.voice_name}")

    def _normalize_language_code(self, language_code: str) -> str:
        """
        Normalize language code to BCP-47 format required by Google Cloud TTS
        
        Args:
            language_code: Language code (e.g., "ru", "en", "ru-RU")
            
        Returns:
            Normalized language code (e.g., "ru-RU", "en-US")
        """
        if not language_code:
            return self.language_code
        
        return self._normalize_language_code_static(language_code)

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
            language_code: Language code (e.g., "ru-RU" or "ru" - will be normalized)

        Returns:
            Audio bytes in MP3 format
        """
        try:
            # If no voice_name specified, randomly choose between Kore and Aoede
            if voice_name is None:
                available_voices = ["ru-RU-Chirp3-HD-Kore", "ru-RU-Chirp3-HD-Aoede"]
                voice_name = random.choice(available_voices)
                print(f"[GoogleCloudTTS] Randomly selected voice: {voice_name}")
            else:
                voice_name = voice_name  # Use explicitly provided voice
            
            language_code = language_code or self.language_code
            # Normalize language code to BCP-47 format (e.g., "ru" -> "ru-RU")
            language_code = self._normalize_language_code(language_code)

            # Determine gender based on voice name (Leda is female)
            ssml_gender = texttospeech.SsmlVoiceGender.FEMALE if "Leda" in voice_name or "Aoede" in voice_name or "Kore" in voice_name or "Zephyr" in voice_name else texttospeech.SsmlVoiceGender.NEUTRAL

            # Chirp3 HD voices do not support pitch parameter - use 0.0 for them
            is_chirp3_hd = "Chirp3" in voice_name or "chirp3" in voice_name.lower()
            effective_pitch = 0.0 if is_chirp3_hd else self.pitch

            print(f"[GoogleCloudTTS] Request details:")
            print(f"  Voice: {voice_name}")
            print(f"  Language: {language_code}")
            print(f"  Gender: {ssml_gender.name}")
            print(f"  Speaking rate: {self.speaking_rate}")
            print(f"  Pitch: {effective_pitch} semitones {'(Chirp3 HD does not support pitch)' if is_chirp3_hd else ''}")
            print(f"  Text length: {len(text)} chars")

            # Set the text input
            synthesis_input = texttospeech.SynthesisInput(text=text)

            # Build the voice request (Leda — Chirp3 HD female voice)
            voice = texttospeech.VoiceSelectionParams(
                language_code=language_code,
                name=voice_name,
                ssml_gender=ssml_gender,
            )

            # Select the audio file type and configuration
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=self.speaking_rate,  # Use configured speaking rate
                pitch=effective_pitch  # Use 0.0 for Chirp3 HD, configured pitch for others
            )

            # Perform the text-to-speech request
            response = self.client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )

            audio_bytes = response.audio_content
            print(f"[GoogleCloudTTS] ✅ Audio generated successfully:")
            print(f"  Size: {len(audio_bytes)} bytes")
            print(f"  Voice used: {voice_name}")
            print(f"  Pitch: {effective_pitch} semitones")

            if len(audio_bytes) == 0:
                raise Exception("Google Cloud TTS returned empty audio data")

            return audio_bytes

        except Exception as e:
            error_msg = str(e)
            print(f"[GoogleCloudTTS] ERROR with voice '{voice_name}': {error_msg}")
            import traceback
            print(f"[GoogleCloudTTS] Full error traceback:")
            traceback.print_exc()
            
            # Check if error is related to voice not found, pitch not supported, or language mismatch
            is_pitch_error = "pitch" in error_msg.lower() and "does not support" in error_msg.lower()
            is_language_error = "language code" in error_msg.lower() and "doesn't match" in error_msg.lower()
            is_voice_error = "not found" in error_msg.lower() or ("invalid" in error_msg.lower() and not is_pitch_error and not is_language_error) or "not available" in error_msg.lower()
            
            # Handle language code mismatch - try to extract correct language from error or voice name
            if is_language_error:
                print(f"[GoogleCloudTTS] Language code mismatch detected. Extracting correct language from voice name...")
                # Try to extract language code from voice name (e.g., "ru-RU-Chirp3-HD-Fenrir" -> "ru-RU")
                if voice_name and "-" in voice_name:
                    parts = voice_name.split("-")
                    if len(parts) >= 2:
                        extracted_lang = f"{parts[0]}-{parts[1]}"
                        print(f"[GoogleCloudTTS] Extracted language '{extracted_lang}' from voice name '{voice_name}'")
                        try:
                            # Retry with extracted language code
                            voice = texttospeech.VoiceSelectionParams(
                                language_code=extracted_lang,
                                name=voice_name,
                                ssml_gender=ssml_gender,
                            )
                            response = self.client.synthesize_speech(
                                input=synthesis_input,
                                voice=voice,
                                audio_config=audio_config
                            )
                            audio_bytes = response.audio_content
                            if audio_bytes:
                                print(f"[GoogleCloudTTS] ✅ Audio generated successfully with corrected language '{extracted_lang}':")
                                print(f"  Size: {len(audio_bytes)} bytes")
                                print(f"  Voice used: {voice_name}")
                                return audio_bytes
                        except Exception as e2:
                            print(f"[GoogleCloudTTS] Retry with extracted language also failed: {e2}")
            
            if is_pitch_error:
                print(f"[GoogleCloudTTS] Voice '{voice_name}' does not support pitch parameter. Retrying with pitch=0.0...")
                try:
                    # Retry with pitch=0.0 for Chirp3 HD voices
                    audio_config_no_pitch = texttospeech.AudioConfig(
                        audio_encoding=texttospeech.AudioEncoding.MP3,
                        speaking_rate=self.speaking_rate,
                        pitch=0.0  # Chirp3 HD doesn't support pitch
                    )
                    response = self.client.synthesize_speech(
                        input=synthesis_input,
                        voice=voice,
                        audio_config=audio_config_no_pitch
                    )
                    audio_bytes = response.audio_content
                    if audio_bytes:
                        print(f"[GoogleCloudTTS] ✅ Audio generated successfully with pitch=0.0:")
                        print(f"  Size: {len(audio_bytes)} bytes")
                        print(f"  Voice used: {voice_name}")
                        return audio_bytes
                except Exception as e2:
                    print(f"[GoogleCloudTTS] Retry with pitch=0.0 also failed: {e2}")
            
            if is_voice_error:
                print(f"[GoogleCloudTTS] Voice '{voice_name}' appears to be unavailable. Trying fallback...")
            
            if voice_name and voice_name != "ru-RU-Wavenet-A":
                print(f"[GoogleCloudTTS] Retrying with fallback voice: ru-RU-Wavenet-A...")
                try:
                    # Wavenet voices support pitch, so use configured pitch
                    # Use normalized language code for fallback too
                    fallback_language = self._normalize_language_code_static(language_code or "ru-RU")
                    voice = texttospeech.VoiceSelectionParams(
                        language_code=fallback_language,
                        name="ru-RU-Wavenet-A",
                        ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL,
                    )
                    response = self.client.synthesize_speech(
                        input=texttospeech.SynthesisInput(text=text),
                        voice=voice,
                        audio_config=texttospeech.AudioConfig(
                            audio_encoding=texttospeech.AudioEncoding.MP3,
                            speaking_rate=self.speaking_rate,  # Use same speaking rate
                            pitch=self.pitch,  # Wavenet supports pitch, use configured value
                        ),
                    )
                    audio_bytes = response.audio_content
                    if audio_bytes:
                        print(f"[GoogleCloudTTS] Audio generated successfully with fallback voice ru-RU-Wavenet-A")
                        return audio_bytes
                except Exception as e2:
                    print(f"[GoogleCloudTTS] Fallback also failed: {e2}")
                    traceback.print_exc()
            raise Exception(f"Error converting text to speech with Google Cloud: {error_msg}")

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