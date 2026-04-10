from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "clickless_ai"
    postgres_url: str = "postgresql+asyncpg://user:password@localhost:5432/clickless_orders"
    redis_url: str = "redis://localhost:6379/0"
    app_env: str = "development"
    app_secret_key: str = "changeme"
    session_encryption_key: str = "changeme_32_bytes_key_padded_here"
    purchase_threshold_amount: float = 500.00
    confirmation_ttl_seconds: int = 900
    app_version: str = "0.1.0"

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
