"""Application configuration"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings"""
    
    # Database
    database_url: str
    postgres_user: str
    postgres_password: str
    postgres_db: str
    
    # OpenAI
    openai_api_key: str
    
    # Security
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # CORS
    cors_origins: str = "http://localhost:5173"
    
    # Environment
    environment: str = "development"
    debug: bool = True
    
    # File Storage
    audio_storage_path: str = "/app/audio_files"
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
        env_file = ".env"
        case_sensitive = False


settings = Settings()

