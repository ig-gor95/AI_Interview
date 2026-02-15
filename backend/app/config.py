"""Application configuration"""
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List

# Путь к backend/.env — не зависит от текущей директории при запуске
_BACKEND_DIR = Path(__file__).resolve().parent.parent
_ENV_FILE = _BACKEND_DIR / ".env"


class Settings(BaseSettings):
    """Application settings"""
    
    # Database — defaults для Docker, переопределяется через переменные окружения
    database_url: str = "postgresql+asyncpg://aihr_user:changeme@postgres:5432/ai_hr_db"
    postgres_user: str = "aihr_user"
    postgres_password: str = "changeme"
    postgres_db: str = "ai_hr_db"

    # AI Service — только DeepSeek (переопределяется через DEEPSEEK_API_KEY в .env)
    deepseek_api_key: str = ""

    # TTS — только Google или отключено
    tts_service: str = "google"  # "google" или "none"
    google_application_credentials: str = "/app/gcp-credentials.json"  # Path to service account JSON file in Docker
    google_cloud_voice_name: str = "ru-RU-Chirp3-HD-Leda"  # Leda - женский голос (Chirp3 HD), можно переопределить через GOOGLE_CLOUD_VOICE_NAME в .env
    google_cloud_voice_language: str = "ru-RU"
    google_cloud_speaking_rate: float = 1.0  # Скорость речи (0.25-4.0), можно переопределить через GOOGLE_CLOUD_SPEAKING_RATE в .env
    google_cloud_pitch: float = 0.0  # Высота тона в семитонах (-20.0 до +20.0), можно переопределить через GOOGLE_CLOUD_PITCH в .env
    
    # Security
    secret_key: str = "test-secret-key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # CORS
    cors_origins: str = "http://localhost:5173"
    # Environment
    environment: str = "development"
    debug: bool = True
    
    # File Storage
    audio_storage_path: str = "./audio_files"
    max_audio_size_mb: int = 50
    
    # Analyzers
    enabled_analyzers: str = "gpt_content_analyzer,clarity_analyzer"
    pronunciation_weight: float = 0.2
    clarity_weight: float = 0.15
    gpt_content_weight: float = 0.5
    stress_handling_weight: float = 0.15
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Convert CORS origins string to list"""
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    @property
    def enabled_analyzers_list(self) -> List[str]:
        """Convert enabled analyzers string to list"""
        return [analyzer.strip() for analyzer in self.enabled_analyzers.split(",")]
    
    class Config:
        # Всегда грузим backend/.env по абсолютному пути
        env_file = str(_ENV_FILE)
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"  # игнорировать лишние переменные из .env (напр. OPENAI_API_KEY)


settings = Settings()
# Pydantic автоматически читает переменные окружения из .env и Docker

