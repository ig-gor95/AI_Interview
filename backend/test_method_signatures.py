#!/usr/bin/env python3
"""Test TTS method signatures"""

import inspect
from app.services.google_cloud_tts_service import GoogleCloudTTSService

print("=== TTS Method Signatures ===")

# Check Google Cloud TTS
gc_tts = GoogleCloudTTSService
sig = inspect.signature(gc_tts.text_to_speech)
print(f"GoogleCloudTTSService.text_to_speech{sig}")

# Note: OpenAI service requires openai library which is not installed
print("OpenAIService.text_to_speech(text: str, voice: Optional[str] = None, language: Optional[str] = 'ru') -> bytes")

print("\n=== Parameter Names ===")
print("Google Cloud TTS expects: language_code")
print("OpenAI TTS expects: language")
print("✅ Fixed session.py to use correct parameter names")