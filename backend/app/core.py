"""Core application initialization"""
import random
from app.analyzers import create_analyzer_registry, AnalyzerRegistry
from app.services.evaluation_service import EvaluationService
from app.services.openai_service import AIService
try:
    from app.services.google_cloud_tts_service import GoogleCloudTTSService
except ImportError:
    GoogleCloudTTSService = None
from app.config import settings

# AI-сервис — только DeepSeek
openai_service = AIService()

# Initialize Google Cloud TTS service
google_cloud_tts_service = None
if settings.google_cloud_credentials_path or settings.tts_service == "google":
    try:
        # Randomly select between Kore and Aoede voices
        available_voices = ["ru-RU-Chirp3-HD-Kore", "ru-RU-Chirp3-HD-Aoede"]
        selected_voice = random.choice(available_voices)
        
        google_cloud_tts_service = GoogleCloudTTSService(
            credentials_path=settings.google_cloud_credentials_path,
            voice_name=selected_voice,  # Use randomly selected voice
            language_code=settings.google_cloud_voice_language,
            speaking_rate=settings.google_cloud_speaking_rate,
            pitch=settings.google_cloud_pitch
        )
        print(f"[Core] Google Cloud TTS service initialized:")
        print(f"  Voice: {selected_voice} (randomly selected from {available_voices})")
        print(f"  Speaking rate: {settings.google_cloud_speaking_rate}")
        print(f"  Pitch: {settings.google_cloud_pitch} semitones")
    except Exception as e:
        print(f"[Core] Failed to initialize Google Cloud TTS service: {e}")
        google_cloud_tts_service = None

# Create TTS service based on configuration
def get_tts_service():
    """Возвращает TTS-сервис: только Google или None."""
    if settings.tts_service == "google" and google_cloud_tts_service:
        return google_cloud_tts_service
    return None

tts_service = get_tts_service()
if tts_service:
    print(f"[Core] Using TTS service: Google Cloud")
else:
    print(f"[Core] TTS disabled (service: {settings.tts_service})")

# Create analyzer registry
analyzer_registry: AnalyzerRegistry = create_analyzer_registry(openai_client=openai_service)

# Create evaluation service
evaluation_service = EvaluationService(analyzer_registry)

