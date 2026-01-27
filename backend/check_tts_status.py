#!/usr/bin/env python3
"""Check TTS status for running backend"""

import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

try:
    from app.config import settings
    print("=== TTS Configuration ===")
    print(f"TTS Service: {settings.tts_service}")
    print(f"Credentials Path: {settings.google_cloud_credentials_path}")
    print(f"Voice Name: {settings.google_cloud_voice_name}")
    print(f"Language: {settings.google_cloud_voice_language}")

    # Check credentials file
    creds_path = settings.google_cloud_credentials_path
    if not os.path.isabs(creds_path):
        creds_path = os.path.join(os.path.dirname(__file__), creds_path)

    print("\n=== Credentials Check ===")
    if os.path.exists(creds_path):
        print(f"✅ Credentials file exists: {creds_path}")
        print(f"   Size: {os.path.getsize(creds_path)} bytes")
    else:
        print(f"❌ Credentials file missing: {creds_path}")

    # Test TTS service initialization
    print("\n=== TTS Service Test ===")
    try:
        from app.services.google_cloud_tts_service import GoogleCloudTTSService
        print("✅ GoogleCloudTTSService import successful")

        # Try to initialize
        if os.path.exists(creds_path):
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = creds_path
            tts_service = GoogleCloudTTSService(
                credentials_path=creds_path,
                voice_name=settings.google_cloud_voice_name,
                language_code=settings.google_cloud_voice_language
            )
            print("✅ TTS service initialized successfully")
        else:
            print("❌ Cannot test TTS service - credentials missing")

    except Exception as e:
        print(f"❌ TTS service initialization failed: {e}")

    # Test core TTS service getter
    print("\n=== Core TTS Service ===")
    try:
        from app.core import get_tts_service
        tts_svc = get_tts_service()
        if tts_svc:
            print(f"✅ Core TTS service available: {type(tts_svc).__name__}")
        else:
            print("❌ Core TTS service is None")
    except Exception as e:
        print(f"❌ Core TTS service check failed: {e}")

except Exception as e:
    print(f"❌ Configuration check failed: {e}")
    import traceback
    traceback.print_exc()

print("\n=== Recommendations ===")
print("1. Restart the backend server to pick up TTS configuration changes")
print("2. Check backend logs for TTS initialization messages")
print("3. Ensure the backend has internet access for Google Cloud TTS")
print("4. Verify Google Cloud credentials have TTS permissions")