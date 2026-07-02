"""
GitHub OAuth2 SSO routes — login redirect and callback.
========================================================
Flow:
  1. GET  /login  → returns GitHub authorization URL
  2. POST /callback → exchanges auth code for token, fetches user info, upserts user, returns JWT
"""
import urllib.parse
from datetime import datetime

from fastapi import APIRouter, HTTPException, status, Request
from src.core.http import get_http_client
from jose import jwt, JWTError

from src.core.config import settings
from src.core.security import create_access_token
from src.core.constants import COLLECTION_USERS
from src.core.logger import get_logger
from src.database.mongodb.connection import get_database

logger = get_logger(__name__)
router = APIRouter()

GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"
GITHUB_EMAILS_URL = "https://api.github.com/user/emails"


def _users():
    return get_database()[COLLECTION_USERS]


@router.get("/login")
async def github_login(request: Request):
    """
    Returns the GitHub OAuth2 authorization URL.
    The frontend should redirect the user to this URL.
    """
    if not settings.GITHUB_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GitHub OAuth is not configured (GITHUB_CLIENT_ID missing)",
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
        "provider": "github",
        "redirect_uri": redirect_uri,
        "exp": datetime.utcnow() + timedelta(minutes=15),
        "nonce": os.urandom(16).hex(),
    }
    signed_state = jwt.encode(state_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    params = {
        "client_id": settings.GITHUB_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "scope": "read:user user:email",
        "state": signed_state,  # Signed state token used by callback and frontend
    }
    url = f"{GITHUB_AUTH_URL}?{urllib.parse.urlencode(params)}"
    return {"authorization_url": url}


@router.post("/callback")
async def github_callback(payload: dict):
    """
    Exchanges the authorization code for an access token, fetches user info
    from GitHub API, upserts the user in MongoDB, and returns a JWT.
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
        if decoded_state.get("provider") != "github":
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
        "client_id": settings.GITHUB_CLIENT_ID,
        "client_secret": settings.GITHUB_CLIENT_SECRET,
        "code": code,
        "redirect_uri": redirect_uri,
    }

    client = get_http_client()
    token_response = await client.post(
        GITHUB_TOKEN_URL,
        data=token_data,
        headers={"Accept": "application/json"},
    )

    if token_response.status_code != 200:
        logger.error(f"GitHub token exchange failed: {token_response.text}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to exchange authorization code with GitHub",
        )

    tokens = token_response.json()
    access_token = tokens.get("access_token")

    if not access_token:
        error_desc = tokens.get("error_description", "Unknown error")
        logger.error(f"GitHub token exchange error: {error_desc}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"GitHub OAuth error: {error_desc}",
        )

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
    }

    import asyncio
    user_task = client.get(GITHUB_USER_URL, headers=headers)
    emails_task = client.get(GITHUB_EMAILS_URL, headers=headers)

    user_response, emails_response = await asyncio.gather(user_task, emails_task)

    if user_response.status_code != 200:
        logger.error(f"GitHub user info fetch failed: {user_response.text}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to fetch user info from GitHub",
        )

    github_user = user_response.json()

    email = None
    if emails_response.status_code == 200:
        emails = emails_response.json()
        for e in emails:
            if e.get("primary") and e.get("verified"):
                email = e["email"]
                break
        if not email:
            for e in emails:
                if e.get("verified"):
                    email = e["email"]
                    break

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not retrieve a verified email from GitHub. Please verify your email address on GitHub.",
        )

    github_id = str(github_user.get("id", ""))
    username = github_user.get("login", "")
    name = github_user.get("name", "")
    avatar_url = github_user.get("avatar_url", "")

    name_parts = name.split(" ", 1) if name else ["", ""]
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    existing_user = await _users().find_one({"email": email})

    if existing_user:
        update_fields = {"updated_at": datetime.utcnow()}
        if not existing_user.get("github_id"):
            update_fields["github_id"] = github_id
        if not existing_user.get("avatar_url") and avatar_url:
            update_fields["avatar_url"] = avatar_url
        if not existing_user.get("auth_provider"):
            update_fields["auth_provider"] = "github"

        await _users().update_one(
            {"_id": existing_user["_id"]},
            {"$set": update_fields},
        )
        logger.info(f"GitHub SSO: existing user logged in — {email}")
    else:
        new_user = {
            "email": email,
            "username": username or email.split("@")[0],
            "first_name": first_name,
            "last_name": last_name,
            "github_id": github_id,
            "avatar_url": avatar_url,
            "auth_provider": "github",
            "created_at": datetime.utcnow(),
        }
        await _users().insert_one(new_user)
        logger.info(f"GitHub SSO: new user created — {email}")

    jwt_token = create_access_token(data={"sub": email})
    return {"access_token": jwt_token, "token_type": "bearer"}
