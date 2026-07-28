import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Safex Security Analyzer"
    API_V1_STR: str = "/api"
    PORT: int = 4001
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/safex")
    CORS_ORIGIN: str = os.getenv("CORS_ORIGIN", "http://localhost:3000,http://localhost:5173")
    
    # AI Settings
    AI_API_KEY: str = os.getenv("AI_API_KEY", "")
    AI_BASE_URL: str = os.getenv("AI_BASE_URL", "https://openrouter.ai/api/v1")
    AI_MODEL: str = os.getenv("AI_MODEL", "")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
