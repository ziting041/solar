from fastapi import FastAPI, UploadFile, File, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import json
import pandas as pd
import numpy as np
from datetime import datetime

# =========================================================
# FastAPI APP
# =========================================================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
VIZ_CACHE_DIR = os.path.join(UPLOAD_DIR, "viz_cache")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(VIZ_CACHE_DIR, exist_ok=True)

# =========================================================
# PostgreSQL + SQLAlchemy
# =========================================================
from sqlalchemy import (
    create_engine, Column, Integer, String, Float,
    Date, DateTime, ForeignKey
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from pydantic import BaseModel
from passlib.context import CryptContext

DATABASE_URL = "postgresql://postgres:050401@localhost:5432/solar"

engine = create_engine(DATABASE_URL)
Base = declarative_base()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

# =========================================================
# Models
# =========================================================

class User(Base):
    __tablename__ = "user"

    user_id = Column(Integer, primary_key=True, index=True)
    user_name = Column(String, nullable=False)
    user_account = Column(String, unique=True, nullable=False)
    user_pw = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    sites = relationship("Site", back_populates="owner")


class Site(Base):
    __tablename__ = "site"

    site_id = Column(Integer, primary_key=True, index=True)
    site_code = Column(String, nullable=False)
    site_name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user_id = Column(Integer, ForeignKey("user.user_id"), nullable=False)
    owner = relationship("User", back_populates="sites")

    site_data = relationship("SiteData", back_populates="site")


class SiteData(Base):
    __tablename__ = "site_data"

    data_id = Column(Integer, primary_key=True, index=True)

    site_id = Column(Integer, ForeignKey("site.site_id"), nullable=False)

    the_date = Column(Date, nullable=True)     # 建議 date 型態
    the_hour = Column(Integer, nullable=True)

    gi = Column(Float, nullable=True)          # 小寫！
    tm = Column(Float, nullable=True)          # 小寫！
    eac = Column(Float, nullable=True)         # 小寫！

    data_name = Column(String, nullable=True)
    outlier_method = Column(String, nullable=True)
    missing_method = Column(String, nullable=True)

    original_rows = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    site = relationship("Site", back_populates="site_data")



Base.metadata.create_all(bind=engine)

# =========================================================
# Schemas
# =========================================================

class RegisterUser(BaseModel):
    user_name: str
    user_account: str
    user_pw: str


class LoginUser(BaseModel):
    user_account: str
    user_pw: str


class CreateSite(BaseModel):
    site_code: str
    site_name: str
    location: str
    user_id: int


# =========================================================
# Auth
# =========================================================

@app.post("/auth/register")
def register(user: RegisterUser):
    db = SessionLocal()

    exists = db.query(User).filter(User.user_account == user.user_account).first()
    if exists:
        raise HTTPException(status_code=400, detail="此帳號已被註冊")

    hashed = pwd_context.hash(user.user_pw)

    new_user = User(
        user_name=user.user_name,
        user_account=user.user_account,
        user_pw=hashed,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "註冊成功", "user_id": new_user.user_id}


@app.post("/auth/login")
def login(user: LoginUser):
    db = SessionLocal()

    u = db.query(User).filter(User.user_account == user.user_account).first()
    if not u or not pwd_context.verify(user.user_pw, u.user_pw):
        raise HTTPException(status_code=400, detail="帳號或密碼錯誤")

    return {
        "message": "登入成功",
        "user_id": u.user_id,
        "user_name": u.user_name,
        "user_account": u.user_account
    }


# =========================================================
# Site
# =========================================================

@app.post("/site/create")
def create_site(site: CreateSite):
    db = SessionLocal()

    user = db.query(User).filter(User.user_id == site.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="指定的 user_id 不存在")

    new_site = Site(
        site_code=site.site_code,
        site_name=site.site_name,
        location=site.location,
        user_id=site.user_id
    )

    db.add(new_site)
    db.commit()
    db.refresh(new_site)

    return {"message": "案場建立成功", "site_id": new_site.site_id}


@app.get("/site/list")
def get_sites(user_id: int):
    db = SessionLocal()

    sites = db.query(Site).filter(Site.user_id == user_id).order_by(Site.created_at.desc()).all()

    return [
        {
            "site_id": s.site_id,
            "site_code": s.site_code,
            "site_name": s.site_name,
            "location": s.location,
            "created_at": s.created_at.isoformat(),
            "user_id": s.user_id
        }
        for s in sites
    ]


# =========================================================
# Upload + Write site_data
# =========================================================

@app.post("/site/upload-data")
async def upload_site_data(
    site_id: int = Query(...),
    file: UploadFile = File(...)
):
    db = SessionLocal()

    try:
        site = db.query(Site).filter(Site.site_id == site_id).first()
        if not site:
            raise HTTPException(status_code=400, detail="site_id 不存在")

        # =======================
        # 儲存檔案
        # =======================
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)

        with open(file_path, "wb") as f:
            f.write(await file.read())

        # =======================
        # 讀取 CSV / Excel
        # =======================
        try:
            df = pd.read_csv(file_path) if filename.lower().endswith(".csv") else pd.read_excel(file_path)
            original_rows = len(df)
            columns = list(df.columns)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"無法解析資料檔案: {str(e)}")

        # =======================
        # 欄位 mapping function
        # =======================
        def normalize(name):
            return str(name).lower().replace("_", "").replace(" ", "").strip()

        col_dict = {normalize(c): c for c in df.columns}

        def find_col(candidates):
            for key in col_dict:
                if key in candidates:
                    return col_dict[key]
            return None

        # =======================
        # 自動匹配欄位
        # =======================
        date_col = find_col(["thedate", "date", "日期", "日付"])
        hour_col = find_col(["thehour", "hour", "時", "小時"])
        gi_col = find_col(["gi", "irradiance", "日射量"])
        tm_col = find_col(["tm", "temp", "temperature", "溫度"])
        eac_col = find_col(["eac", "energy", "發電量"])

        # =======================
        # 檢查是否缺少必要欄位
        # =======================
        required = {
            "the_date": date_col,
            "the_hour": hour_col,
            "gi": gi_col,
            "tm": tm_col,
            "eac": eac_col,
        }

        missing = [k for k, v in required.items() if v is None]
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"上傳失敗：檔案缺少必要欄位 → {', '.join(missing)}"
            )

        # =======================
        # 取第一列資料（或後續你要改成逐筆也可以）
        # =======================
        the_date = df[date_col].iloc[0]
        the_hour = df[hour_col].iloc[0]
        gi = df[gi_col].iloc[0]
        tm = df[tm_col].iloc[0]
        eac = df[eac_col].iloc[0]

        # =======================
        # 寫入資料庫（全部 NOT NULL）
        # =======================
        new_data = SiteData(
            site_id=site_id,
            data_name=filename,
            original_rows=original_rows,
            the_date=the_date,
            the_hour=int(the_hour),
            gi=float(gi),
            tm=float(tm),
            eac=float(eac),
        )

        db.add(new_data)
        db.commit()
        db.refresh(new_data)

        return {
            "message": "上傳成功，資料已寫入資料庫",
            "file_name": filename,
            "rows": original_rows,
            "features": columns,
            "data_id": new_data.data_id,
        }

    except Exception as e:
        print("❌ 上傳錯誤：", e)
        raise HTTPException(status_code=500, detail=str(e))

# =========================================================
# 保留原始 upload-dataset
# =========================================================

@app.post("/upload-dataset/")
async def upload_dataset(file: UploadFile = File(...)):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}_{file.filename}"

    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as f:
        f.write(await file.read())

    try:
        df = pd.read_csv(file_path) if filename.lower().endswith(".csv") else pd.read_excel(file_path)
        columns = list(df.columns)
    except Exception as e:
        return {
            "message": "上傳成功，但無法解析欄位",
            "error": str(e),
            "file_name": filename
        }

    return {
        "message": "上傳成功",
        "file_name": filename,
        "file_path": file_path,
        "features": columns,
        "rows": int(len(df)),
    }


# =========================================================
# Helpers
# =========================================================

def sanitize(obj):
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if isinstance(obj, (np.ndarray,)):
        return [sanitize(x) for x in obj.tolist()]
    if isinstance(obj, (pd.Timestamp,)):
        return obj.isoformat()
    if isinstance(obj, dict):
        return {k: sanitize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [sanitize(x) for x in obj]
    return obj


def load_file(file_name: str):
    path = os.path.join(UPLOAD_DIR, file_name)
    if not os.path.exists(path):
        raise FileNotFoundError(f"{file_name} 不存在 uploads/")
    return pd.read_csv(path) if file_name.lower().endswith(".csv") else pd.read_excel(path)


# =========================================================
# visualize-data
# =========================================================

@app.get("/visualize-data/")
def visualize_data(file_name: str = Query(...), remove_outliers: bool = Query(False)):
    cache_path = os.path.join(VIZ_CACHE_DIR, f"{file_name}.json")

    if not remove_outliers and os.path.exists(cache_path):
        with open(cache_path, "r", encoding="utf-8") as f:
            return json.load(f)

    df = load_file(file_name)
    columns = df.columns.tolist()
    stats = df.describe(include="all").replace({np.nan: None}).to_dict()
    sample = df.head(5).replace({np.nan: None}).to_dict(orient="records")

    payload = {
        "columns": columns,
        "stats": sanitize(stats),
        "sample": sanitize(sample),
    }

    if not remove_outliers:
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False)

    return payload
