import hashlib
import base64
import os
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

from starlette.status import HTTP_401_UNAUTHORIZED

from app.database import get_db
from app.models import User
from app.schemas import RegisterRequest, RegisterResponse, LoginRequest, LoginResponse

load_dotenv()

# JWT config — secret loaded from .env, HS256 algo, 60-min expiry
SECRET_KEY           = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY is not set in the .env file")
ALGORITHM            = "HS256"
TOKEN_EXPIRE_MINUTES = 60

# bcrypt context for password hashing
pwd_context   = CryptContext(schemes=["bcrypt"], deprecated="auto")
# Tells FastAPI where clients send credentials to get a token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# SHA-256 pre-hash keeps the input under bcrypt's 72-byte limit
def _prehash(password: str) -> str:
    digest = hashlib.sha256(password.encode("utf-8")).digest()
    return base64.b64encode(digest).decode("utf-8")

def hash_password(password: str) -> str:
    return pwd_context.hash(_prehash(password))

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(_prehash(plain), hashed)

# Creates a signed JWT with "sub" = user email and an expiry claim
def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# Decodes token and returns the email stored in "sub", or None on failure
def decode_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None

# FastAPI dependency — validates the token and returns the logged-in User object
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    email = decode_token(token)
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid or expired token")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="user not found")
    return user

router = APIRouter(prefix="/auth", tags=["authentication"])

# POST /auth/register — creates a new user with a hashed password
@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="email already registered")

    user = User(
        fullname=payload.fullname,
        email=payload.email,
        password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

# POST /auth/login — validates credentials and returns a JWT
@router.post("/login", response_model=LoginResponse)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, str(user.password)):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid credentials")

    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}

# POST /auth/logout — stateless logout (client should discard the token)
@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {"message": f"user '{current_user.email}' logged out successfully"}

# GET /auth/me — returns the currently authenticated user's profile
@router.get("/me", response_model=RegisterResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
