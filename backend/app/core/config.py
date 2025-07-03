from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import validator


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/pythia_chat?schema=public"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6330"
    
    # JWT
    JWT_SECRET_KEY: str = "your-super-secret-jwt-key-change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Pythia Conversations"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            # Try to parse as JSON first
            try:
                import json
                return json.loads(v)
            except (json.JSONDecodeError, ValueError):
                # If JSON parsing fails, treat as comma-separated string
                return [i.strip() for i in v.split(",") if i.strip()]
        return v
    
    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6330/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6330/0"
    
    # Environment
    ENVIRONMENT: str = "development"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings() 