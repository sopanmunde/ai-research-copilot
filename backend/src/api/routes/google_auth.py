"""
Google OAuth2 SSO routes — login redirect and callback.
========================================================
Flow:
  1. GET  /login  → returns Google authorization URL
  2. POST /callback → exchanges auth code for tokens, upserts user, returns JWT
"""
import urllib.parse
import time
from datetime import datetime

from fastapi import APIRouter, HTTPException, status, Request
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from jose import jwt, JWTError

from src.core.config import settings
from src.core.security import create_access_token
from src.core.constants import COLLECTION_USERS
from src.core.logger import get_logger
from src.database.mongodb.connection import get_database
from src.core.http import get_http_client

logger = get_logger(__name__)
router = APIRouter()


class CachedGoogleRequest(google_requests.Request):
    def __init__(self, cache_timeout=86400):
        super().__init__()
        self._cache = {}
        self._cache_timeout = cache_timeout

    def __call__(self, url, method="GET", body=None, headers=None, timeout=None, **kwargs):
        if method == "GET" and "oauth2/v3/certs" in url:
            now = time.time()
            if url in self._cache:
                cached_time, response = self._cache[url]
                if now - cached_time < self._cache_timeout:
                    return response
            
            response = super().__call__(url, method, body, headers, timeout, **kwargs)
            self._cache[url] = (now, response)
            return response
            
        return super().__call__(url, method, body, headers, timeout, **kwargs)


cached_google_request = CachedGoogleRequest()

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"


def _users():
    return get_database()[COLLECTION_USERS]


@router.get("/login")
async def google_login(request: Request):
    """
    Returns the Google OAuth2 authorization URL.
    The frontend should redirect the user to this URL.
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured (GOOGLE_CLIENT_ID missing)",
        )

    redirect_uri = settings.REDIRECT_URI
    referer = request.headers.get("referer")
    if referer:
        try:
            parsed = urllib.parse.urlparse(referer)
            if parsed.netloc:
                redirect_uri = f"{parsed.scheme}://{parsed.netloc}/login"
        except Exception:
            pass

    from datetime import timedelta
    import os
    state_payload = {
        "provider": "google",
        "redirect_uri": redirect_uri,
        "exp": datetime.utcnow() + timedelta(minutes=15),
        "nonce": os.urandom(16).hex(),
    }
    signed_state = jwt.encode(state_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
        "state": signed_state,
    }
    url = f"{GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}"
    return {"authorization_url": url}



@router.post("/callback")
async def google_callback(payload: dict):
    """
    Exchanges the authorization code for tokens, verifies the ID token,
    upserts the user in MongoDB, and returns a JWT.
    """
    code = payload.get("code")
    state = payload.get("state")
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authorization code is required",
        )
    if not state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="State parameter is required to prevent CSRF",
        )

    try:
        decoded_state = jwt.decode(state, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if decoded_state.get("provider") != "google":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid state provider",
            )
        redirect_uri = decoded_state.get("redirect_uri", settings.REDIRECT_URI)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OAuth state parameter (anti-CSRF failure)",
        )

    token_data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }

    client = get_http_client()
    token_response = await client.post(GOOGLE_TOKEN_URL, data=token_data)

    if token_response.status_code != 200:
        logger.error(f"Google token exchange failed: {token_response.text}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to exchange authorization code with Google",
        )

    tokens = token_response.json()
    id_token_str = tokens.get("id_token")

    if not id_token_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No ID token received from Google",
        )

    try:
        import asyncio
        loop = asyncio.get_running_loop()
        id_info = await loop.run_in_executor(
            None,
            lambda: id_token.verify_oauth2_token(
                id_token_str,
                cached_google_request,
                settings.GOOGLE_CLIENT_ID,
            )
        )
    except Exception as e:
        logger.error(f"Google ID token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google ID token",
        )

    email = id_info.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email not provided by Google",
        )

    if not id_info.get("email_verified"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account email is not verified",
        )

    google_id = id_info.get("sub")
    first_name = id_info.get("given_name", "")
    last_name = id_info.get("family_name", "")
    avatar_url = id_info.get("picture", "")

    existing_user = await _users().find_one({"email": email})

    if existing_user:
        update_fields = {"updated_at": datetime.utcnow()}
        if not existing_user.get("google_id"):
            update_fields["google_id"] = google_id
        if not existing_user.get("avatar_url") and avatar_url:
            update_fields["avatar_url"] = avatar_url
        if not existing_user.get("auth_provider"):
            update_fields["auth_provider"] = "google"

        await _users().update_one(
            {"_id": existing_user["_id"]},
            {"$set": update_fields},
        )
        logger.info(f"Google SSO: existing user logged in — {email}")
    else:
        new_user = {
            "email": email,
            "username": email.split("@")[0],
            "first_name": first_name,
            "last_name": last_name,
            "google_id": google_id,
            "avatar_url": avatar_url,
            "auth_provider": "google",
            "created_at": datetime.utcnow(),
        }
        await _users().insert_one(new_user)
        logger.info(f"Google SSO: new user created — {email}")

    access_token = create_access_token(data={"sub": email})
    return {"access_token": access_token, "token_type": "bearer"}
