#!/usr/bin/env python3
"""Debug TTS service initialization"""

import os
import sys
sys.path.append('.')

# Test basic imports
print("Testing imports...")
try:
    from app.config import settings
    print("✅ Config imported successfully")
    print(f"  TTS service: {settings.tts_service}")
    print(f"  Credentials path: {settings.google_cloud_credentials_path}")
    print(f"  Voice name: {settings.google_cloud_voice_name}")
    print(f"  Language: {settings.google_cloud_voice_language}")
except Exception as e:
    print(f"❌ Config import failed: {e}")
    sys.exit(1)

# Test credentials file
credentials_path = settings.google_cloud_credentials_path
if not os.path.isabs(credentials_path):
    # Make it absolute relative to backend directory
    credentials_path = os.path.join(os.path.dirname(__file__), credentials_path)

print(f"\nTesting credentials file: {credentials_path}")
if os.path.exists(credentials_path):
    print("✅ Credentials file exists")
    print(f"  Size: {os.path.getsize(credentials_path)} bytes")
else:
    print("❌ Credentials file not found")
    print("  Current directory:", os.getcwd())
    print("  Files in directory:", os.listdir('.'))

# Test Google Cloud TTS import
print("\nTesting Google Cloud TTS import...")
try:
    from google.cloud import texttospeech
    print("✅ Google Cloud TTS library available")

    # Test client initialization
    print("Testing client initialization...")
    if os.path.exists(credentials_path):
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path

        try:
            client = texttospeech.TextToSpeechClient()
            print("✅ Google Cloud TTS client initialized successfully")

            # Test voice listing
            voices = client.list_voices(language_code="ru-RU")
            print(f"✅ Found {len(voices.voices)} Russian voices")
            for voice in voices.voices[:3]:  # Show first 3
                print(f"  - {voice.name}")

        except Exception as e:
            print(f"❌ Client initialization failed: {e}")
    else:
        print("❌ Cannot test client - credentials file missing")

except ImportError as e:
    print(f"❌ Google Cloud TTS library not installed: {e}")
    print("Install with: pip install google-cloud-texttospeech")

# Test TTS service class
print("\nTesting TTS service class...")
try:
    from app.services.google_cloud_tts_service import GoogleCloudTTSService

    if os.path.exists(credentials_path):
        try:
            tts_service = GoogleCloudTTSService(
                credentials_path=credentials_path if os.path.exists(credentials_path) else None,
                voice_name=settings.google_cloud_voice_name,
                language_code=settings.google_cloud_voice_language
            )
            print("✅ GoogleCloudTTSService initialized successfully")
        except Exception as e:
            print(f"❌ GoogleCloudTTSService initialization failed: {e}")
    else:
        print("❌ Cannot test service - credentials file missing")

except Exception as e:
    print(f"❌ TTS service import failed: {e}")

# Test core initialization
print("\nTesting core TTS initialization...")
try:
    from app.core import tts_service, get_tts_service
    print(f"TTS service object: {tts_service}")
    print(f"get_tts_service(): {get_tts_service()}")

    if tts_service:
        print("✅ TTS service is available")
    else:
        print("❌ TTS service is None - check configuration")

except Exception as e:
    print(f"❌ Core import failed: {e}")
    import traceback
    traceback.print_exc()