"""
Data profiler module for DataGPT.
Understands dataset shapes, column types, statistical summaries, date ranges, and frequencies.
"""

from typing import Any, Dict, List
import pandas as pd
import numpy as np

def profile_dataset(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Generate complete dataset profile.
    Detects numerical, categorical, and date columns, and calculates comprehensive statistics.
    """
    rows, cols = df.shape
    
    numerical_cols = []
    categorical_cols = []
    date_cols = []
    
    # Column classifications
    for col in df.columns:
        # Check if already datetime
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            date_cols.append(col)
        elif pd.api.types.is_numeric_dtype(df[col]):
            # If low unique integer or boolean-like, still treat as numeric for stats
            numerical_cols.append(col)
        else:
            # Try to test if string column represents dates
            sample = df[col].dropna().head(20)
            is_date = False
            if len(sample) > 0:
                try:
                    pd.to_datetime(sample, errors="raise")
                    is_date = True
                except Exception:
                    is_date = False
            
            if is_date:
                date_cols.append(col)
            else:
                categorical_cols.append(col)
                
    # Numerical summaries
    num_summary = {}
    for col in numerical_cols:
        series = df[col].dropna()
        if not series.empty:
            num_summary[col] = {
                "count": int(series.count()),
                "min": float(series.min()),
                "max": float(series.max()),
                "mean": float(series.mean()),
                "median": float(series.median()),
                "std": float(series.std()) if len(series) > 1 else 0.0,
                "unique": int(series.nunique())
            }
            
    # Categorical summaries
    cat_summary = {}
    for col in categorical_cols:
        series = df[col].dropna()
        val_counts = series.value_counts().head(5).to_dict()
        cat_summary[col] = {
            "unique": int(series.nunique()),
            "top_value": str(series.mode().iloc[0]) if not series.empty else "N/A",
            "top_counts": {str(k): int(v) for k, v in val_counts.items()}
        }
        
    # Date summaries
    date_summary = {}
    for col in date_cols:
        try:
            converted = pd.to_datetime(df[col], errors="coerce").dropna()
            if not converted.empty:
                min_d = converted.min()
                max_d = converted.max()
                date_summary[col] = {
                    "min_date": str(min_d.date()),
                    "max_date": str(max_d.date()),
                    "days_span": int((max_d - min_d).days)
                }
        except Exception:
            pass

    return {
        "rows": rows,
        "columns": cols,
        "column_names": list(df.columns),
        "numerical_columns": numerical_cols,
        "categorical_columns": categorical_cols,
        "date_columns": date_cols,
        "numerical_summary": num_summary,
        "categorical_summary": cat_summary,
        "date_summary": date_summary
    }
