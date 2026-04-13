"""
ClickLess AI – Auth endpoints
POST /auth/google   — Google OAuth2 access-token → JWT
POST /auth/login    — email + password → JWT
POST /auth/signup   — email + password + name → JWT
"""
import logging

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.security import create_token, hash_password, verify_password
from app.models.user import CreateUserRequest
from app.services import user_service

logger = logging.getLogger(__name__)
router = APIRouter(tags=["auth"])


# ── Request / response schemas ────────────────────────────────────────────────

class GoogleLoginRequest(BaseModel):
    token: str  # Google OAuth2 access token from the frontend


class EmailLoginRequest(BaseModel):
    email: str
    password: str
    rememberMe: bool = False


class SignupRequest(BaseModel):
    email: str
    password: str
    name: str


class AuthResponse(BaseModel):
    token: str
    user: dict


# ── Google OAuth ──────────────────────────────────────────────────────────────

@router.post("/auth/google", response_model=AuthResponse)
async def google_login(body: GoogleLoginRequest):
    # Verify token against Google userinfo
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {body.token}"},
            timeout=10,
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    info = resp.json()
    email: str = info.get("email", "")
    name: str = info.get("name", email.split("@")[0])
    picture: str = info.get("picture", "")

    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email")

    # Get or create user — fall back to a transient record when MongoDB is down
    user_id: str
    try:
        existing = await user_service.get_user_by_email(email)
        if existing:
            user_id = existing.user_id
        else:
            user_doc = await user_service.create_user(
                CreateUserRequest(email=email, display_name=name)
            )
            user_id = user_doc.user_id
    except Exception as exc:
        logger.warning("DB unavailable during Google login, issuing transient token: %s", exc)
        import hashlib
        user_id = "g-" + hashlib.sha256(email.encode()).hexdigest()[:16]

    token = create_token(user_id, email)
    return AuthResponse(
        token=token,
        user={"id": user_id, "email": email, "name": name, "image": picture},
    )


# ── Email / password login ────────────────────────────────────────────────────

@router.post("/auth/login", response_model=AuthResponse)
async def email_login(body: EmailLoginRequest):
    user_doc = await user_service.get_user_by_email(body.email)
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    stored_hash = getattr(user_doc, "password_hash", None)
    if not stored_hash or not verify_password(body.password, stored_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(user_doc.user_id, body.email)
    return AuthResponse(
        token=token,
        user={"id": user_doc.user_id, "email": body.email, "name": user_doc.display_name},
    )


# ── Signup ────────────────────────────────────────────────────────────────────

@router.post("/auth/signup", response_model=AuthResponse)
async def signup(body: SignupRequest):
    existing = await user_service.get_user_by_email(body.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already in use")

    user_doc = await user_service.create_user(
        CreateUserRequest(email=body.email, display_name=body.name)
    )
    # Store hashed password
    await user_service.set_password(user_doc.user_id, hash_password(body.password))

    token = create_token(user_doc.user_id, body.email)
    return AuthResponse(
        token=token,
        user={"id": user_doc.user_id, "email": body.email, "name": body.name},
    )
