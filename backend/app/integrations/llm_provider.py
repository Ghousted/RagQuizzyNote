from typing import Protocol
from groq import Groq
from app.core.config import get_settings
from app.core.logging import get_logger

_log = get_logger("quizzynote.llm")


class LLMProvider(Protocol):
    def chat(self, messages: list[dict], response_format: dict | None = None) -> str: ...


class GroqProvider:
    def __init__(self, api_key: str, model: str):
        self._client = Groq(api_key=api_key)
        self._model = model

    def chat(self, messages: list[dict], response_format: dict | None = None) -> str:
        kwargs: dict = {"model": self._model, "messages": messages}
        if response_format:
            kwargs["response_format"] = response_format
        resp = self._client.chat.completions.create(**kwargs)
        if resp.usage:
            _log.info("llm_call", extra={"ctx": {
                "model": self._model,
                "tokens_in": resp.usage.prompt_tokens,
                "tokens_out": resp.usage.completion_tokens,
                "total_tokens": resp.usage.total_tokens,
            }})
        return resp.choices[0].message.content or ""


def get_llm() -> LLMProvider:
    s = get_settings()
    if s.llm_provider == "groq":
        return GroqProvider(s.groq_api_key, s.groq_model)
    raise ValueError(f"Unsupported LLM provider: {s.llm_provider}")
