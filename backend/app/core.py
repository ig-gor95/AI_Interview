"""Core application initialization"""
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
        google_cloud_tts_service = GoogleCloudTTSService(
            credentials_path=settings.google_cloud_credentials_path,
            voice_name=settings.google_cloud_voice_name,
            language_code=settings.google_cloud_voice_language
        )
        print(f"[Core] Google Cloud TTS service initialized with voice: {settings.google_cloud_voice_name}")
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

