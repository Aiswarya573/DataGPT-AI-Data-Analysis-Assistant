"""
Insight Engine module for DataGPT.
Derives verifiable, data-grounded business insights directly from mathematical aggregations.
Prevents generic hallucinations by synthesizing strictly computed observations.
"""

from typing import Any, Dict, List
import pandas as pd
import numpy as np

def generate_business_insights(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Perform deep mathematical profiling to discover verified business facts.
    """
    insights = []
    top_performers = {}
    trends = []
    
    num_cols = list(df.select_dtypes(include=[np.number]).columns)
    cat_cols = [c for c in df.columns if c not in num_cols]
    
    # 1. Total Metrics
    metrics_summary = {}
    for col in num_cols:
        series = df[col].dropna()
        metrics_summary[col] = {
            "total": float(series.sum()),
            "mean": float(series.mean()),
            "median": float(series.median()),
            "max": float(series.max())
        }
        
    # 2. Key Dimensions Top Performers
    for cat in cat_cols[:4]:
        for num in num_cols[:2]:
            try:
                grouped = df.groupby(cat)[num].sum().sort_values(ascending=False)
                if not grouped.empty and len(grouped) > 1:
                    top_name = str(grouped.index[0])
                    top_val = float(grouped.iloc[0])
                    total_val = float(grouped.sum())
                    share = (top_val / total_val * 100) if total_val != 0 else 0
                    
                    key = f"{cat} by {num}"
                    top_performers[key] = {
                        "category": cat,
                        "metric": num,
                        "top_item": top_name,
                        "value": top_val,
                        "total": total_val,
                        "share_percentage": round(share, 1),
                        "top_5": {str(k): float(v) for k, v in grouped.head(5).items()}
                    }
                    
                    insights.append(
                        f"**{cat} Concentration:** '{top_name}' leads {num} at **{top_val:,.2f}**, representing **{share:.1f}%** of all total {num}."
                    )
            except Exception:
                continue

    # 3. Temporal Trend Insights (if date column exists)
    date_candidates = []
    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            date_candidates.append(col)
        else:
            sample = df[col].dropna().head(10)
            try:
                pd.to_datetime(sample)
                date_candidates.append(col)
            except Exception:
                pass
                
    if date_candidates and num_cols:
        d_col = date_candidates[0]
        n_col = num_cols[0]
        try:
            df_temp = df.copy()
            df_temp['__parsed_date__'] = pd.to_datetime(df_temp[d_col], errors='coerce')
            df_temp = df_temp.dropna(subset=['__parsed_date__'])
            
            # Group by Month
            df_temp['__month__'] = df_temp['__parsed_date__'].dt.to_period('M')
            monthly = df_temp.groupby('__month__')[n_col].sum()
            
            if len(monthly) >= 2:
                first_period = str(monthly.index[0])
                last_period = str(monthly.index[-1])
                change_pct = ((monthly.iloc[-1] - monthly.iloc[0]) / abs(monthly.iloc[0])) * 100 if monthly.iloc[0] != 0 else 0
                direction = "grew" if change_pct >= 0 else "declined"
                
                trend_msg = (
                    f"**Temporal Trend:** From {first_period} to {last_period}, monthly {n_col} {direction} by "
                    f"**{abs(change_pct):.1f}%** (from {monthly.iloc[0]:,.2f} to {monthly.iloc[-1]:,.2f})."
                )
                trends.append(trend_msg)
                insights.append(trend_msg)
        except Exception:
            pass

    return {
        "metrics_summary": metrics_summary,
        "top_performers": top_performers,
        "trends": trends,
        "insights": insights
    }
