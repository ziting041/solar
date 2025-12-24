# schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any

# ===== Auth =====

class RegisterUser(BaseModel):
    user_name: str
    user_email: EmailStr
    user_pw: str

class LoginUser(BaseModel):
    user_email: EmailStr
    user_pw: str


# ===== Site =====

class CreateSite(BaseModel):
    site_code: str
    site_name: str
    location: str
    user_id: int


# ===== Data Process =====

class ProcessRequest(BaseModel):
    data_id: int
    method: str                 # 'iqr' | 'zscore' | 'isolation_forest' | 'default'
    params: Optional[Dict[str, Any]] = None


# ===== Update =====

class UpdateSite(BaseModel):
    site_code: str | None = None
    site_name: str | None = None
    location: str | None = None
