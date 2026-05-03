from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.services.auth.auth_service import create_user, get_user_by_email, verify_password
from app.services.auth.jwt_service import create_access_token
from app.core.rate_limit import auth_limiter

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(body: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    # Rate-limit by IP to slow down account creation abuse
    auth_limiter.check(request.client.host if request.client else "unknown")
    if get_user_by_email(db, body.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = create_user(db, body.email, body.password)
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    # Rate-limit by IP + email to slow down credential stuffing
    client_ip = request.client.host if request.client else "unknown"
    auth_limiter.check(client_ip)
    auth_limiter.check(f"email:{body.email.lower()}")
    user = get_user_by_email(db, body.email)
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return TokenResponse(access_token=create_access_token(str(user.id)))
