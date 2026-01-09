from fastapi import APIRouter, Query, HTTPException, Depends
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest

from database import get_db
from models import SiteData, AfterData

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
        if isinstance(v, float) and (np.isnan(v) or np.isinf(v)):
            return None
        return v
    elif isinstance(obj, float):
        return None if np.isnan(obj) or np.isinf(obj) else obj
    return obj


# ===============================
# 圖表資料產生器（不再計算 correlation）
# ===============================
def build_plots(
    df: pd.DataFrame,
    outlier_mask: pd.Series | None = None,
    *,
    remove_outliers: bool = False,
    correlation_heatmap: dict | None = None,
    correlation_heatmap_full: dict | None = None,
):
    if outlier_mask is None:
        outlier_mask = pd.Series(False, index=df.index)
    outlier_mask = outlier_mask.reindex(df.index, fill_value=False)

    variables = ["EAC", "GI", "TM"]
    hist = {}

    # ---------- Histogram ----------
    for v in variables:
        s = df[v].dropna()
        if len(s) < 5:
            hist[v] = {"bins": [], "counts": []}
            continue
        counts, bins = np.histogram(s, bins=10)
        hist[v] = {
            "bins": bins.tolist(),
            "counts": counts.tolist(),
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
                "is_outlier": outlier_mask.loc[sub.index].tolist(),
            }

    # ---------- Boxplot ----------
    def build_box(group_col: str, show_outliers: bool = True):
        result = {}
        for g, sub in df.groupby(group_col):
            v = sub["EAC"].dropna()

            # 沒資料才跳過
            if len(v) == 0:
                continue

            q1 = v.quantile(0.25)
            q3 = v.quantile(0.75)
            iqr = q3 - q1

            # 避免 iqr = 0 時 whisker = NaN
            if iqr == 0:
                lower = upper = v.median()
            else:
                lower = q1 - 1.5 * iqr
                upper = q3 + 1.5 * iqr

            inside = v[(v >= lower) & (v <= upper)]
            whisker_min = inside.min() if not inside.empty else v.min()
            whisker_max = inside.max() if not inside.empty else v.max()

            outliers = v[(v < lower) | (v > upper)].tolist()

            result[str(g)] = {
                "min": float(v.min()),
                "q1": float(q1),
                "median": float(v.median()),
                "q3": float(q3),
                "max": float(v.max()),
                "whisker_min": float(whisker_min),
                "whisker_max": float(whisker_max),
                "outliers": outliers if show_outliers else [],
            }
        return result


    show_outliers = not remove_outliers

    return {
        "scatter_matrix": {
            "variables": variables,
            "pairs": pairs,
            "hist": hist,
        },
        "boxplot_by_month": build_box("month", show_outliers=show_outliers),
        "boxplot_by_day": build_box("day", show_outliers=show_outliers),
        "boxplot_by_hour": build_box("hour", show_outliers=show_outliers),
        "boxplot_by_batch": {},

        # 這兩個直接用呼叫者算好的結果
        "correlation_heatmap": correlation_heatmap,
        "correlation_heatmap_full": correlation_heatmap_full,
    }


# ===============================
# 主 API
# ===============================
@router.get("/visualize-data/")
def visualize_data(
    file_name: str = Query(...),
    apply_gi_tm: bool = Query(True),
    outlier_method: str = Query("none"),
    iqr_factor: float = Query(1.5),
    z_threshold: float = Query(3.0),
    isolation_contamination: float = Query(0.1),
    remove_outliers: bool = Query(False),
    db: Session = Depends(get_db),
):
    # ---------- 撈資料 ----------
    entries = (
        db.query(SiteData)
        .filter(SiteData.data_name == file_name)
        .order_by(SiteData.the_date, SiteData.the_hour)
        .all()
    )
    if not entries:
        raise HTTPException(status_code=404, detail="找不到資料")

    # ---------- correlation 專用：完全原始 df_corr_doc ----------
    df_corr_doc = pd.DataFrame(
        [
            {
                "EAC": e.eac,
                "GI": e.gi,
                "TM": e.tm,
                "the_date": e.the_date,
                "hour": e.the_hour,
            }
            for e in entries
        ]
    )
    df_corr_doc["the_date"] = pd.to_datetime(df_corr_doc["the_date"])
    df_corr_doc["month"] = df_corr_doc["the_date"].dt.month
    df_corr_doc["day"] = df_corr_doc["the_date"].dt.day

    corr_vars = ["EAC", "GI", "TM", "day", "hour", "month"]

    # 只在這裡算一次相關係數，後面三個 stage 都共用
    corr_base = df_corr_doc[corr_vars].dropna()

    corr_heatmap = {
        "variables": ["EAC", "GI", "TM"],
        "matrix": corr_base[["EAC", "GI", "TM"]].corr().values.tolist(),
    }
    corr_heatmap_full = {
        "variables": corr_vars,
        "matrix": corr_base.corr().values.tolist(),
    }

    # ---------- 主流程用 df（可清理） ----------
    df = pd.DataFrame(
        [
            {
                "EAC": e.eac,
                "GI": e.gi,
                "TM": e.tm,
                "the_date": e.the_date,
                "hour": e.the_hour,
            }
            for e in entries
        ]
    )
    df = df.drop_duplicates(subset=["the_date", "hour"], keep="first")
    df["the_date"] = pd.to_datetime(df["the_date"])
    df["month"] = df["the_date"].dt.month
    df["day"] = df["the_date"].dt.day

    # ---------- Stage 1 資料：GI / TM 清理（和 notebook 同步） ----------
    df1 = df.copy()
    if apply_gi_tm:
        # 只留 GI > 0 的日照時段
        df1 = df1[df1["GI"] > 0].copy()
        # 不合理的 TM 先設為 NaN 再插值
        df1.loc[df1["TM"] <= 0, "TM"] = np.nan
        df1 = df1.sort_values(["the_date", "hour"])
        if df1["TM"].notna().sum() >= 2:
            df1["TM"] = df1["TM"].interpolate("linear", limit_direction="both")

    # ---------- 相關係數：用和 notebook 一樣的資料來算 ----------
    # 若有套 GI/TM 清理，相關係數就用 df1；否則用原始 df
    corr_data = df1 if apply_gi_tm else df
    corr_vars = ["EAC", "GI", "TM", "day", "hour", "month"]

    corr_base = corr_data[corr_vars].dropna()
    if len(corr_base) >= 2:
        corr_heatmap = {
            "variables": ["EAC", "GI", "TM"],
            "matrix": corr_base[["EAC", "GI", "TM"]].corr().values.tolist(),
        }
        corr_heatmap_full = {
            "variables": corr_vars,
            "matrix": corr_base.corr().values.tolist(),
        }
    else:
        # 資料太少就回傳空，前端自己處理
        corr_heatmap = {"variables": ["EAC", "GI", "TM"], "matrix": []}
        corr_heatmap_full = {"variables": corr_vars, "matrix": []}

    # ---------- Stage 0：原始 ----------
    outlier_mask_raw = pd.Series(False, index=df.index)
    plots_raw = build_plots(
        df,
        outlier_mask=outlier_mask_raw,
        remove_outliers=remove_outliers,
        correlation_heatmap=corr_heatmap,
        correlation_heatmap_full=corr_heatmap_full,
    )

    # ---------- Stage 1：GI / TM 清理後（已在前面算好 df1） ----------
    outlier_mask_stage1 = pd.Series(False, index=df1.index)

    # ---------- Stage 2：離群值 ----------
    df2 = df1.copy()
    outlier_mask_stage2 = pd.Series(False, index=df2.index)

    cols = ["EAC", "GI", "TM"]
    if outlier_method == "iqr_single":
        cols = ["EAC"]

    if outlier_method != "none":
        # IQR
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

        # Z-score
        elif outlier_method == "zscore":
            for col in cols:
                s = df2[col].dropna()
                if len(s) == 0 or s.std() == 0:
                    continue
                z = np.abs((df2[col] - s.mean()) / s.std())
                outlier_mask_stage2 |= z > z_threshold

        # Isolation Forest
        elif outlier_method == "isolation_forest":
            sub = df2[cols].dropna()
            if len(sub) > 20:
                iso = IsolationForest(
                    contamination=isolation_contamination, random_state=42
                )
                pred = iso.fit_predict(sub)
                mask = pd.Series(pred == -1, index=sub.index)
                outlier_mask_stage2.loc[mask.index] = mask

        # Stage0 / Stage1 的 outlier 標記（只用來畫圖）
        outlier_mask_raw = outlier_mask_stage2.reindex(df.index, fill_value=False)
        outlier_mask_stage1 = outlier_mask_stage2.reindex(df1.index, fill_value=False)

        plots_raw = build_plots(
            df,
            outlier_mask=outlier_mask_raw,
            remove_outliers=remove_outliers,
            correlation_heatmap=corr_heatmap,
            correlation_heatmap_full=corr_heatmap_full,
        )
        plots_stage1 = build_plots(
            df1,
            outlier_mask=outlier_mask_stage1,
            remove_outliers=remove_outliers,
            correlation_heatmap=corr_heatmap,
            correlation_heatmap_full=corr_heatmap_full,
        )

        # Stage2：真的移除 + 補值 或 只標記
        if remove_outliers:
            df2.loc[outlier_mask_stage2, cols] = np.nan
            df2 = df2.sort_values(["the_date", "hour"])
            df2[cols] = df2[cols].interpolate("linear", limit_direction="both")
            plots_stage2 = build_plots(
                df2,
                outlier_mask=pd.Series(False, index=df2.index),
                remove_outliers=remove_outliers,
                correlation_heatmap=corr_heatmap,
                correlation_heatmap_full=corr_heatmap_full,
            )
        else:
            plots_stage2 = build_plots(
                df2,
                outlier_mask=outlier_mask_stage2,
                remove_outliers=remove_outliers,
                correlation_heatmap=corr_heatmap,
                correlation_heatmap_full=corr_heatmap_full,
            )
    else:
        # 沒做離群值：Stage1 / Stage2 就是同一份 df1
        plots_stage1 = build_plots(
            df1,
            outlier_mask=outlier_mask_stage1,
            remove_outliers=remove_outliers,
            correlation_heatmap=corr_heatmap,
            correlation_heatmap_full=corr_heatmap_full,
        )
        plots_stage2 = build_plots(
            df1,
            outlier_mask=outlier_mask_stage1,
            remove_outliers=remove_outliers,
            correlation_heatmap=corr_heatmap,
            correlation_heatmap_full=corr_heatmap_full,
        )

    return safe_json(
        {
            "stages": {
                "raw": plots_raw,
                "after_gi_tm": plots_stage1,
                "after_outlier": plots_stage2,
            }
        }
    )

# ===============================
# 儲存清理後資料（原本的即可）
# ===============================
@router.post("/save-cleaned-data/")
def save_cleaned_data(payload: dict, db: Session = Depends(get_db)):
    file_name = payload.get("file_name")
    apply_gi_tm = payload.get("apply_gi_tm", True)
    outlier_method = payload.get("outlier_method", "none")
    remove_outliers = payload.get("remove_outliers", True)

    if not file_name:
        raise HTTPException(status_code=400, detail="缺少 file_name")

    entries = db.query(SiteData).filter(SiteData.data_name == file_name).all()
    if not entries:
        raise HTTPException(status_code=404, detail="找不到原始資料")

    data_id = entries[0].data_id

    df_raw = pd.DataFrame(
        [
            {
                "EAC": e.eac,
                "GI": e.gi,
                "TM": e.tm,
                "the_date": e.the_date,
                "hour": e.the_hour,
            }
            for e in entries
        ]
    ).drop_duplicates(subset=["the_date", "hour"], keep="first")

    before_rows = len(df_raw)

    df = df_raw.copy()
    if apply_gi_tm:
        df = df[df["GI"] > 0].copy()
        df.loc[df["TM"] <= 0, "TM"] = np.nan
        df = df.sort_values(["the_date", "hour"])
        if df["TM"].notna().sum() >= 2:
            df["TM"] = df["TM"].interpolate("linear", limit_direction="both")

    if outlier_method != "none" and remove_outliers:
        df = df.dropna()

    after_rows = len(df)

    outlier_params = None
    if outlier_method.startswith("iqr"):
        outlier_params = {"iqr_factor": payload.get("iqr_factor")}
    elif outlier_method == "zscore":
        outlier_params = {"z_threshold": payload.get("z_threshold")}
    elif outlier_method == "isolation_forest":
        outlier_params = {
            "contamination": payload.get("isolation_contamination")
        }

    after = AfterData(
        data_id=data_id,
        after_name=f"{file_name}_cleaned",
        before_rows=before_rows,
        after_rows=after_rows,
        removed_ratio=(before_rows - after_rows) / before_rows if before_rows > 0 else 0,
        outlier_method=outlier_method if outlier_method != "none" else None,
        gi_tm_applied=apply_gi_tm,
        outlier_params=outlier_params,
    )

    db.add(after)
    db.commit()
    db.refresh(after)

    return {
        "message": "清理完成",
        "before_rows": before_rows,
        "after_rows": after_rows,
        "removed_ratio": round(
            (before_rows - after_rows) / before_rows if before_rows > 0 else 0, 3
        ),
        "after_id": after.after_id,
    }