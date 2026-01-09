# unit_adjustment.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import SiteData

router = APIRouter(tags=["UnitAdjustment"])

# 後端內建的單位換算表（跟前端邏輯一致）
UNIT_FACTORS = {
    "kWh/m²": 1.0,          # 已是 kWh
    "MJ/m²": 1.0 / 3.6,     # 1 MJ/m² ≈ 0.2778 kWh/m²
    "Wh/m²": 1.0 / 1000.0,  # 1000 Wh/m² = 1 kWh/m²
}

@router.post("/units/irradiance/convert")
def convert_irradiance_unit(payload: dict, db: Session = Depends(get_db)):
    """
    回傳：
    - factor_to_kwh: 這個 from_unit 轉成 kWh/m² 要乘上的倍率
    - preview_original: 指定資料檔的第一筆 GI 數據（原始值）
    - preview_converted: 上面那個數值換算成 kWh/m² 之後的值
    """
    from_unit = payload.get("from_unit")
    file_name = payload.get("file_name")

    if not from_unit:
        raise HTTPException(status_code=400, detail="缺少 from_unit")
    if from_unit not in UNIT_FACTORS:
        raise HTTPException(status_code=400, detail=f"不支援的日照單位: {from_unit}")

    factor = UNIT_FACTORS[from_unit]

    preview_original = None
    preview_converted = None

    if file_name:
        # 取這個檔案的第一筆資料（依日期 + 小時排序）
        first_row = (
            db.query(SiteData)
            .filter(SiteData.data_name == file_name)
            .order_by(SiteData.the_date, SiteData.the_hour)
            .first()
        )
        if first_row and first_row.gi is not None:
            preview_original = float(first_row.gi)
            preview_converted = preview_original * factor

    return {
        "from_unit": from_unit,
        "to_unit": "kWh/m²",
        "factor_to_kwh": factor,
        "preview_original": preview_original,
        "preview_converted": preview_converted,
    }