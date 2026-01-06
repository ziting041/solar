from fastapi import APIRouter, Query, HTTPException, Depends
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest

from database import get_db
from models import SiteData

router = APIRouter(tags=["Visualize"])


# ===============================
# JSON 安全處理
# ===============================
def safe_json(obj):
    if isinstance(obj, dict):
        return {k: safe_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [safe_json(v) for v in obj]
    elif isinstance(obj, (np.integer, np.floating)):
        v = obj.item()
        return None if (isinstance(v, float) and (np.isnan(v) or np.isinf(v))) else v
    elif isinstance(obj, float):
        return None if np.isnan(obj) or np.isinf(obj) else obj
    return obj


# ===============================
# 圖表資料產生器
# ===============================
BIN_CONFIG = {
    "EAC": np.array([0, 20, 40, 60, 80]),
    "GI":  np.array([0, 250, 500, 750, 1000]),
    "TM":  np.array([0, 20, 40, 60]),
}

def build_plots(df: pd.DataFrame, outlier_mask=None):
    if outlier_mask is None:
        outlier_mask = pd.Series(False, index=df.index)
    outlier_mask = outlier_mask.reindex(df.index, fill_value=False)

    variables = ["EAC", "GI", "TM"]
    hist = {}

    # 直方圖：顯示所有資料（包含離群值），只 dropna
    for v in variables:
        s = df[v].dropna()

        if len(s) < 5:
            hist[v] = {"bins": [], "counts": []}
            continue

        counts, bins = np.histogram(s, bins=10)
        hist[v] = {
            "bins": bins.tolist(),
            "counts": counts.tolist()
        }

    # ---------- Scatter ----------
    pairs = {}
    for x in variables:
        for y in variables:
            if x == y:
                continue

            sub = df[[x, y]].dropna()

            pairs[f"{x}__{y}"] = {
                "x": sub[x].tolist(),
                "y": sub[y].tolist(),
                "is_outlier": (
                    outlier_mask.loc[sub.index].tolist()
                    if outlier_mask is not None
                    else [False] * len(sub)
                )
            }

    # ---------- Boxplot（保留離群點） ----------
    def build_box(group_col):
        result = {}
        for g, sub in df.groupby(group_col):
            v = sub["EAC"].dropna()
            if len(v) < 5:
                continue

            q1 = v.quantile(0.25)
            q3 = v.quantile(0.75)
            iqr = q3 - q1
            lower = q1 - 1.5 * iqr
            upper = q3 + 1.5 * iqr

            result[str(g)] = {
                "min": float(v.min()),
                "q1": float(q1),
                "median": float(v.median()),
                "q3": float(q3),
                "max": float(v.max()),
                "outliers": v[(v < lower) | (v > upper)].tolist()
            }
        return result

    return {
        "scatter_matrix": {
            "variables": variables,
            "pairs": pairs,
            "hist": hist
        },
        "boxplot_by_month": build_box("month"),
        "boxplot_by_day": build_box("day_of_year"),
        "boxplot_by_hour": build_box("hour"),
        "boxplot_by_batch": {},
        "correlation_heatmap": {
            "variables": variables,
            "matrix": df[variables].corr().values.tolist()
        }
    }

# ===============================
# 主 API
# ===============================
@router.get("/visualize-data/")
def visualize_data(
    file_name: str = Query(...),
    outlier_method: str = Query("none"),
    iqr_factor: float = Query(1.5),
    z_threshold: float = Query(3.0),
    isolation_contamination: float = Query(0.1),
    remove_outliers: bool = Query(False),  # 新增參數
    db: Session = Depends(get_db),
):

    entries = (
        db.query(SiteData)
        .filter(SiteData.data_name == file_name)
        .order_by(SiteData.the_date, SiteData.the_hour)
        .all()
    )

    if not entries:
        raise HTTPException(status_code=404, detail="找不到資料")

    df = pd.DataFrame([{
        "EAC": e.eac,
        "GI": e.gi,
        "TM": e.tm,
        "the_date": e.the_date,
        "hour": e.the_hour,
    } for e in entries])
    df = df.drop_duplicates(subset=["the_date", "hour"], keep="first")
    df["the_date"] = pd.to_datetime(df["the_date"])
    df["month"] = df["the_date"].dt.month
    df["day_of_year"] = df["the_date"].dt.dayofyear

    # ===============================
    # Stage 0：原始
    # ===============================
    plots_raw = build_plots(df)

    # ===============================
    # Stage 1：GI / TM 清理
    # ===============================
    df1 = df[df["GI"] > 0].copy()
    df1.loc[df1["TM"] == 0, "TM"] = np.nan
    df1 = df1.sort_values(["the_date", "hour"])
    df1["TM"] = df1["TM"].interpolate("linear", limit_direction="both")

    plots_stage1 = build_plots(df1)

   # ===============================
    # Stage 2：離群值（標記 + 可選移除）
    # ===============================
    df2 = df1.copy()

    # 預設不標記
    outlier_mask_raw = pd.Series(False, index=df.index)      # 用於 raw stage
    outlier_mask_stage1 = pd.Series(False, index=df1.index)  # 用於 stage1
    outlier_mask_stage2 = pd.Series(False, index=df2.index)  # 用於 stage2（預設 false）

    cols = ["EAC", "GI", "TM"]
    if outlier_method == "iqr_single":
        cols = ["EAC"]

    if outlier_method != "none":
        # 在 df2 上計算離群值 mask（因為離群檢測是在 GI/TM 清理後進行）
        if outlier_method.startswith("iqr"):
            for col in cols:
                s = df2[col].dropna()
                if len(s) < 10:
                    continue
                q1, q3 = s.quantile([0.25, 0.75])
                iqr = q3 - q1
                if iqr == 0:
                    continue
                lower = q1 - iqr_factor * iqr
                upper = q3 + iqr_factor * iqr
                outlier_mask_stage2 |= (df2[col] < lower) | (df2[col] > upper)

        elif outlier_method == "zscore":
            for col in cols:
                s = df2[col].dropna()
                if len(s) == 0 or s.std() == 0:
                    continue
                z = np.abs((df2[col] - s.mean()) / s.std())
                outlier_mask_stage2 |= z > z_threshold

        elif outlier_method == "isolation_forest":
            sub = df2[cols].dropna()
            if len(sub) > 20:
                iso = IsolationForest(contamination=isolation_contamination, random_state=42)
                pred = iso.fit_predict(sub)
                mask = pd.Series(pred == -1, index=sub.index)
                outlier_mask_stage2.loc[mask.index] = mask

        # 將 df2 的 mask 重新對齊到 df 和 df1 的 index（補 False）
        outlier_mask_raw = outlier_mask_stage2.reindex(df.index, fill_value=False)
        outlier_mask_stage1 = outlier_mask_stage2.reindex(df1.index, fill_value=False)

        # 傳給各 stage 的 mask
        plots_raw = build_plots(df, outlier_mask_raw)
        plots_stage1 = build_plots(df1, outlier_mask_stage1)

        if remove_outliers:
            # 真正移除並插補
            df2.loc[outlier_mask_stage2, cols] = np.nan
            df2 = df2.sort_values(["the_date", "hour"])
            df2[cols] = df2[cols].interpolate("linear", limit_direction="both")
            plots_stage2 = build_plots(df2, pd.Series(False, index=df2.index))  # 清理後無離群
        else:
            plots_stage2 = build_plots(df2, outlier_mask_stage2)  # 只標示

    else:
        # 沒開離群檢測
        plots_raw = build_plots(df)
        plots_stage1 = build_plots(df1)
        plots_stage2 = build_plots(df1)

    return safe_json({
        "stages": {
            "raw": plots_raw,
            "after_gi_tm": plots_stage1,
            "after_outlier": plots_stage2
        }
    })