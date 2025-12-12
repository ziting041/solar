# routers/auth.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from database import get_db
from models import User
from schemas import RegisterUser, LoginUser

router = APIRouter(prefix="/auth", tags=["Auth"])
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

@router.post("/register")
def register(user: RegisterUser, db: Session = Depends(get_db)):
    exists = db.query(User).filter(User.user_account == user.user_account).first()
    if exists:
        raise HTTPException(status_code=400, detail="此帳號已被註冊")
    hashed = pwd_context.hash(user.user_pw)
    new_user = User(user_name=user.user_name, user_account=user.user_account, user_pw=hashed)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "註冊成功", "user_id": new_user.user_id}

@router.post("/login")
def login(user: LoginUser, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.user_account == user.user_account).first()
    if not u or not pwd_context.verify(user.user_pw, u.user_pw):
        raise HTTPException(status_code=400, detail="帳號或密碼錯誤")
    return {"message": "登入成功", "user_id": u.user_id, "user_name": u.user_name, "user_account": u.user_account}
