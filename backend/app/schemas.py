from pydantic import BaseModel, EmailStr, field_serializer
from datetime import datetime, timezone

# --- Auth schemas ---

# Input for /auth/register
class RegisterRequest(BaseModel):
    fullname: str
    email:    EmailStr
    password: str

# Output for /auth/register and /auth/me — never exposes the password
class RegisterResponse(BaseModel):
    id:         int
    fullname:   str
    email:      EmailStr
    created_at: datetime

    model_config = {"from_attributes": True}  # allows building from ORM objects

    # Serialize datetime as ISO 8601 string with UTC offset
    @field_serializer("created_at")
    def serialize_dt(self, dt: datetime) -> str:
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()

# Input for /auth/login
class LoginRequest(BaseModel):
    email:    EmailStr
    password: str

# Output for /auth/login — returns the JWT bearer token
class LoginResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"

# --- Post schemas ---

# Output shape for any post endpoint
class PostResponse(BaseModel):
    id:         int
    media_url:  str
    media_type: str
    caption:    str | None
    author_id:  int
    created_at: datetime

    model_config = {"from_attributes": True}

    # Same UTC ISO 8601 serialization as RegisterResponse
    @field_serializer("created_at")
    def serialize_dt(self, dt: datetime) -> str:
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()

# Input for PUT /posts/{id} — only caption can be changed via JSON body
class EditPostRequest(BaseModel):
    caption: str | None = None
