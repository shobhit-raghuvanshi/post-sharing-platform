from pydantic import BaseModel,EmailStr
from datetime import datetime

class RegisterRequest(BaseModel):
    fullname:str
    email:EmailStr
    password:str

class RegisterResponse(BaseModel):
    id:int
    fullname:str
    email:EmailStr
    created_at:datetime

    model_config={"from_attributes":True}

class LoginRequest(BaseModel):
    email:EmailStr
    password:str

class LoginResponse(BaseModel):
    access_token:str
    token_type:str="bearer"

class PostResponse(BaseModel):
    id:         int
    media_url:  str
    media_type: str
    caption:    str | None
    author_id:  int
    created_at: datetime

    model_config = {"from_attributes": True}

class EditPostRequest(BaseModel):
    caption: str | None = None