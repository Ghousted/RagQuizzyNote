from datetime import datetime, timedelta, timezone
import jwt
from app.core.config import get_settings


def create_access_token(user_id: str) -> str:
    s = get_settings()
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=s.jwt_access_ttl_minutes),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, s.jwt_secret, algorithm="HS256")


def decode_access_token(token: str) -> str:
    s = get_settings()
    payload = jwt.decode(token, s.jwt_secret, algorithms=["HS256"])
    return payload["sub"]
