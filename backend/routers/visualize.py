# backend/routers/visualize.py
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np
from database import get_db
from models import SiteData

router = APIRouter(prefix="/visualize", tags=["Visualize"])


@router.get("/site-data")
def visualize_site_data(
    data_id: int = Query(...),
    remove_outliers: bool = Query(False),
    db: Session = Depends(get_db)
):
    entry = db.query(SiteData).filter(SiteData.data_id == data_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="data_id 不存在")

    if not entry.json_data:
        raise HTTPException(status_code=400, detail="此資料沒有 json data")

    # 讀取 dataframe
    df = pd.DataFrame(entry.json_data)

    # ----- 你資料一定有 datetime 或 time 欄位，所以統一修正 -----
    time_col = None
    for c in df.columns:
        if "time" in c.lower():
            time_col = c
            df[c] = pd.to_datetime(df[c], errors="coerce")
            break

    if time_col:
        df["month"] = df[time_col].dt.month
        df["day"] = df[time_col].dt.day
        df["hour"] = df[time_col].dt.hour

    # ======（可選）去除異常值 ======
    if remove_outliers:
        for col in df.select_dtypes(include=[np.number]).columns:
            q1 = df[col].quantile(0.25)
            q3 = df[col].quantile(0.75)
            iqr = q3 - q1
            df = df[(df[col] >= q1 - 1.5 * iqr) & (df[col] <= q3 + 1.5 * iqr)]

    # ====== 統計量 ======
    stats = df.describe(include="all").to_dict()

    # ====== 取前 20 筆 sample ======
    sample = df.head(20).to_dict(orient="records")

    # ====== 散佈矩陣 (EAC, GI, TM) ======
    scatter_cols = ["EAC", "GI", "TM"]
    pairs = {}

    for x in scatter_cols:
        for y in scatter_cols:
            if x == y:
                continue
            if x in df.columns and y in df.columns:
                pairs[f"{x}__{y}"] = {
                    "x": df[x].fillna(0).tolist(),
                    "y": df[y].fillna(0).tolist(),
                }

    scatter_matrix = {"pairs": pairs}

    # ====== Boxplot by month/day/hour ======
    def compute_box(df, group_col):
        result = {}
        if group_col not in df.columns or "EAC" not in df.columns:
            return {}

        for g, sub in df.groupby(group_col):
            q1 = sub["EAC"].quantile(0.25)
            q3 = sub["EAC"].quantile(0.75)
            result[str(g)] = {
                "min": float(sub["EAC"].min()),
                "q1": float(q1),
                "median": float(sub["EAC"].median()),
                "q3": float(q3),
                "max": float(sub["EAC"].max()),
            }
        return result

    boxplot_by_month = compute_box(df, "month")
    boxplot_by_day = compute_box(df, "day")
    boxplot_by_hour = compute_box(df, "hour")

    # ====== 回傳給前端 ======
    return {
        "columns": df.columns.tolist(),
        "stats": stats,
        "sample": sample,
        "scatter_matrix": scatter_matrix,
        "boxplot_by_month": boxplot_by_month,
        "boxplot_by_day": boxplot_by_day,
        "boxplot_by_hour": boxplot_by_hour,
    }
