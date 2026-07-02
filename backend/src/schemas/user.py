import re
from pydantic import BaseModel, EmailStr, model_validator, field_validator
from typing import Optional
from datetime import datetime
from bson import ObjectId


PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 12
PASSWORD_RULES = [
    (r"[A-Z]", "at least one uppercase letter (A-Z)"),
    (r"[a-z]", "at least one lowercase letter (a-z)"),
    (r"[0-9]", "at least one number (0-9)"),
    (r"[!@#$%^&*(),.?\":{}|<>_\-+=/\\[\]~`';]", "at least one special character (!@#$%^&*…)"),
]


def validate_password_strength(password: str) -> str:
    """Raise ValueError with a descriptive message if password is too weak."""
    errors = []
    if len(password) < PASSWORD_MIN_LENGTH:
        errors.append(f"minimum {PASSWORD_MIN_LENGTH} characters")
    if len(password) > PASSWORD_MAX_LENGTH:
        errors.append(f"maximum {PASSWORD_MAX_LENGTH} characters")
    for pattern, label in PASSWORD_RULES:
        if not re.search(pattern, password):
            errors.append(label)
    if errors:
        raise ValueError("Password must contain: " + ", ".join(errors) + ".")
    return password


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")


class UserCreate(BaseModel):
    email: EmailStr
    username: str
    first_name: str
    last_name: str
    password: str
    confirm_password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        return validate_password_strength(v)

    @model_validator(mode="after")
    def check_passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None
