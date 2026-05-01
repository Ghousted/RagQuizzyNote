from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Postgres
    postgres_user: str = "quizzynote"
    postgres_password: str = "devpassword"
    postgres_db: str = "quizzynote"
    postgres_host: str = "localhost"
    postgres_port: int = 5432

    # JWT
    jwt_secret: str = ""
    jwt_access_ttl_minutes: int = 15
    jwt_refresh_ttl_days: int = 30

    # LLM
    llm_provider: str = "groq"
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    # Embeddings
    hf_token: str = ""
    hf_embed_model: str = "BAAI/bge-small-en-v1.5"
    hf_embed_dim: int = 384

    # Pinecone
    pinecone_api_key: str = ""
    pinecone_index: str = "quizzynote-dev"
    pinecone_cloud: str = "aws"
    pinecone_region: str = "us-east-1"

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+psycopg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
