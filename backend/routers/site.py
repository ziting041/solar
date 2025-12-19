# routers/site.py
from fastapi import APIRouter, UploadFile, File, Query, HTTPException, Depends
from sqlalchemy.orm import Session
from io import BytesIO
import pandas as pd
from datetime import datetime, date

from database import get_db
from models import Site, SiteData, User
from schemas import CreateSite, UpdateSite

router = APIRouter(prefix="/site", tags=["Site"])


# =========================
#  案場列表
# =========================
@router.get("/list")
def list_sites(user_id: int, db: Session = Depends(get_db)):
    sites = (
        db.query(Site)
        .filter(Site.user_id == user_id)
        .order_by(Site.created_at.desc())
        .all()
    )

    return [
        {
            "site_id": s.site_id,
            "site_code": s.site_code,
            "site_name": s.site_name,
            "location": s.location,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "user_id": s.user_id,
        }
        for s in sites
    ]


# =========================
#  建立案場
# =========================
@router.post("/create")
def create_site(payload: CreateSite, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="指定的 user_id 不存在")

    new_site = Site(
        site_code=payload.site_code,
        site_name=payload.site_name,
        location=payload.location,
        user_id=payload.user_id,
    )
    db.add(new_site)
    db.commit()
    db.refresh(new_site)

    return {"message": "案場建立成功", "site_id": new_site.site_id}


# =========================
#  上傳資料（重點）
# =========================
@router.post("/upload-data")
async def upload_site_data(
    site_id: int = Query(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # 1️⃣ 檢查 site 是否存在
    site = db.query(Site).filter(Site.site_id == site_id).first()
    if not site:
        raise HTTPException(status_code=400, detail="site_id 不存在")

    # 2️⃣ 讀檔
    content = await file.read()
    bio = BytesIO(content)

    try:
        df = (
            pd.read_csv(bio)
            if file.filename.lower().endswith(".csv")
            else pd.read_excel(bio)
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"檔案解析失敗: {e}")

    # 3️⃣ 欄位正規化（避免大小寫 / 空白）
    df.columns = [c.strip().lower() for c in df.columns]

    # 4️⃣ 欄位對應
    column_map = {
        # date
        "date": "the_date",
        "thedate": "the_date",
        "the_date": "the_date",

        # hour
        "hour": "the_hour",
        "thehour": "the_hour",
        "the_hour": "the_hour",

        # values
        "gi": "gi",
        "tm": "tm",
        "eac": "eac",
    }

    df = df.rename(columns=column_map)

    # 5️⃣ 必要欄位檢查
    required = {"the_date", "the_hour", "gi", "tm", "eac"}
    if not required.issubset(df.columns):
        raise HTTPException(
            status_code=400,
            detail={
                "error": "欄位錯誤",
                "required": list(required),
                "your_columns": list(df.columns),
            }
        )

    # 6️⃣ 🔥 日期型別一次處理（關鍵）
    try:
        df["the_date"] = pd.to_datetime(df["the_date"], errors="raise").dt.date
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="the_date 欄位無法轉換為日期格式 (YYYY-MM-DD)",
        )

    # 7️⃣ 建立 ORM 物件（不要在這裡轉型 date）
    entries = []

    for _, row in df.iterrows():
        entry = SiteData(
            site_id=site_id,
            the_date=row["the_date"],              # datetime.date ✅
            the_hour=int(row["the_hour"]),
            gi=float(row["gi"]),
            tm=float(row["tm"]),
            eac=float(row["eac"]),
            data_name=file.filename,

            # ✅ 關鍵：DB NOT NULL，一定要給
            outlier_method="raw",
            missing_method="raw",

            original_rows=len(df),
        )
    entries.append(entry)

    # 8️⃣ 一次寫入（穩定、不會被降型）
    db.add_all(entries)
    db.commit()

    return {
        "message": "上傳成功",
        "rows": len(df),
        "site_id": site_id,
        "data_id": entries[0].data_id,   # 給前端用
        "file_name": file.filename,
        "features": list(df.columns),
    }


# =========================
#  更新案場
# =========================
@router.put("/{site_id}")
def update_site(site_id: int, payload: UpdateSite, db: Session = Depends(get_db)):
    site = db.query(Site).filter(Site.site_id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="site not found")

    site.site_code = payload.site_code
    site.site_name = payload.site_name
    site.location = payload.location

    db.commit()
    db.refresh(site)

    return {"message": "site updated", "site_id": site.site_id}


# =========================
#  刪除案場
# =========================
@router.delete("/{site_id}")
def delete_site(site_id: int, db: Session = Depends(get_db)):
    site = db.query(Site).filter(Site.site_id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="site not found")

    db.query(SiteData).filter(SiteData.site_id == site_id).delete()
    db.delete(site)
    db.commit()

    return {"message": "site deleted", "site_id": site_id}
