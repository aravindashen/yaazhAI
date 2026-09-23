import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    APP_NAME: str = "YAAZH AI - Classical Tamil Knowledge Platform"
    APP_VERSION: str = "2.0.0"
    ENVIRONMENT: str = "production"
    
    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Security & Auth
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "yaazh-classical-tamil-super-secret-key-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database (SQLite with FTS5 initially, PostgreSQL + pgvector ready)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./yaazh_corpus.db")
    
    # AI Providers
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2")
    
    # OCR Settings
    TESSERACT_CMD: str = os.getenv("TESSERACT_CMD", "tesseract")
    MAX_UPLOAD_SIZE_MB: int = 15
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp", "image/tiff", "application/pdf"]
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 120
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173", "*"]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
