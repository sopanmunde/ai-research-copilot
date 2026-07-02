import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
import hashlib
from src.core.config import settings
from src.database.mongodb.connection import get_database
from src.core.constants import COLLECTION_USERS
from src.schemas.user import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")


_LOGIN_ATTEMPTS: dict = {}
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15


def _get_attempt_info(email: str) -> dict:
    return _LOGIN_ATTEMPTS.setdefault(email, {"count": 0, "locked_until": None})


def _is_locked(email: str) -> tuple[bool, int]:
    """Returns (is_locked, seconds_remaining)."""
    info = _get_attempt_info(email)
    if info["locked_until"] and datetime.utcnow() < info["locked_until"]:
        remaining = int((info["locked_until"] - datetime.utcnow()).total_seconds())
        return True, remaining
    if info["locked_until"] and datetime.utcnow() >= info["locked_until"]:
        _LOGIN_ATTEMPTS[email] = {"count": 0, "locked_until": None}
    return False, 0


def _record_failed_attempt(email: str) -> int:
    """Increments fail counter. Returns remaining attempts before lockout."""
    info = _get_attempt_info(email)
    info["count"] += 1
    if info["count"] >= MAX_FAILED_ATTEMPTS:
        info["locked_until"] = datetime.utcnow() + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
    return max(0, MAX_FAILED_ATTEMPTS - info["count"])


def _reset_attempts(email: str):
    """Clear counters on successful login."""
    _LOGIN_ATTEMPTS.pop(email, None)



def _users():
    return get_database()[COLLECTION_USERS]


async def get_password_hash(password: str) -> str:
    import asyncio
    def _hash():
        salt = bcrypt.gensalt(rounds=10)
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    return await asyncio.to_thread(_hash)


async def verify_password(plain_password: str, hashed_password: str) -> bool:
    import asyncio
    def _verify():
        try:
            if bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8')):
                return True
            plain_password_hash = hashlib.sha256(plain_password.encode()).hexdigest()
            return bcrypt.checkpw(plain_password_hash.encode('utf-8'), hashed_password.encode('utf-8'))
        except ValueError:
            return False
    return await asyncio.to_thread(_verify)


async def get_user(email: str):
    import asyncio
    from pymongo.errors import PyMongoError
    try:
        return await _users().find_one({"email": email})
    except PyMongoError as e:
        if type(e).__name__ == "_OperationCancelled":
            raise asyncio.CancelledError() from e
        raise


async def authenticate_user(email: str, password: str):
    """Authenticate with lockout protection.

    Raises HTTPException (423) when the account is locked.
    Returns False on wrong credentials (caller raises 401).
    Returns the user document on success.
    """
    locked, seconds_left = _is_locked(email)
    if locked:
        minutes_left = max(1, seconds_left // 60)
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=(
                f"Account temporarily locked after {MAX_FAILED_ATTEMPTS} failed attempts. "
                f"Try again in {minutes_left} minute(s)."
            ),
        )

    user = await get_user(email)
    if not user or not await verify_password(password, user["hashed_password"]):
        remaining = _record_failed_attempt(email)
        if remaining == 0:
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=(
                    f"Too many failed attempts. Account locked for "
                    f"{LOCKOUT_DURATION_MINUTES} minute(s)."
                ),
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Incorrect email or password. {remaining} attempt(s) remaining.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    _reset_attempts(email)
    return user


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception

    user = await get_user(email=token_data.email)
    if user is None:
        raise credentials_exception
    return user
