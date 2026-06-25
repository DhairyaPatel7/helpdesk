from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://tickets:tickets@localhost:5432/tickets"
    frontend_origin: str = "http://localhost:3000"
    jwt_secret: str = "dev-only-insecure-secret-change-in-prod"
    access_token_expire_minutes: int = 60 * 24 * 7

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origin.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
