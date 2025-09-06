from pydantic import BaseSettings, AnyHttpUrl, validator
from typing import List, Optional
import os


class Settings(BaseSettings):
    environment: str = os.getenv("ENVIRONMENT", os.getenv("NODE_ENV", "development"))
    ai_allowed_origins: List[AnyHttpUrl] = []
    ai_allow_credentials: bool = True
    ai_allow_methods: List[str] = ["GET", "POST", "OPTIONS"]
    ai_allow_headers: List[str] = ["*"]
    port: int = int(os.getenv("PORT", "8000"))

    @validator("ai_allowed_origins", pre=True)
    def split_origins(cls, v):
        if v is None or v == "":
            return []
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v

    class Config:
        env_prefix = ""
        case_sensitive = False


def get_settings() -> Settings:
    try:
        return Settings(
            ai_allowed_origins=os.getenv("AI_ALLOWED_ORIGINS"),
        )
    except Exception as e:
        # Fail fast with a clear message
        raise RuntimeError(f"Invalid environment configuration: {e}")


