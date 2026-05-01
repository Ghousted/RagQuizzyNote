from huggingface_hub import InferenceClient

from app.core.config import get_settings


class HFEmbedder:
    def __init__(self, token: str, model: str, dim: int):
        self._client = InferenceClient(model=model, token=token)
        self._dim = dim

    @property
    def dim(self) -> int:
        return self._dim

    def embed(self, texts: list[str]) -> list[list[float]]:
        out = self._client.feature_extraction(texts)
        if hasattr(out, "tolist"):
            out = out.tolist()
        if out and not isinstance(out[0], list):
            out = [out]
        return out


def get_embedder() -> HFEmbedder:
    s = get_settings()
    return HFEmbedder(s.hf_token, s.hf_embed_model, s.hf_embed_dim)
