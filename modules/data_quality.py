"""
Data quality check and cleaning module for DataGPT.
Calculates Data Quality Score (0-100), detects issues, and produces non-destructive cleaning actions.
"""

from typing import Any, Dict, List
import pandas as pd
import numpy as np

def check_data_quality(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Perform thorough data quality analysis.
    Returns metric counts, score (0-100), and specific itemized findings.
    """
    total_rows = len(df)
    total_cells = df.size if total_rows > 0 else 1
    
    # 1. Missing values
    missing_by_col = df.isnull().sum().to_dict()
    total_missing_cells = int(df.isnull().sum().sum())
    cols_with_missing = {k: int(v) for k, v in missing_by_col.items() if v > 0}
    
    # 2. Duplicate rows
    duplicate_rows = int(df.duplicated().sum())
    
    # 3. Empty columns
    empty_cols = [col for col in df.columns if df[col].isnull().all()]
    
    # 4. Constant columns (single unique value)
    constant_cols = [col for col in df.columns if df[col].nunique(dropna=True) <= 1 and not df[col].isnull().all()]
    
    # 5. Potential outliers (using IQR on numerical columns)
    outlier_counts = {}
    total_outliers = 0
    num_cols = df.select_dtypes(include=[np.number]).columns
    for col in num_cols:
        series = df[col].dropna()
        if len(series) >= 4:
            q1 = series.quantile(0.25)
            q3 = series.quantile(0.75)
            iqr = q3 - q1
            if iqr > 0:
                lower = q1 - 1.5 * iqr
                upper = q3 + 1.5 * iqr
                count = int(((series < lower) | (series > upper)).sum())
                if count > 0:
                    outlier_counts[col] = count
                    total_outliers += count
                    
    # Calculate Data Quality Score (100 base, with bounded penalties)
    score = 100.0
    
    # Missing cell penalty (max -30)
    missing_ratio = total_missing_cells / total_cells
    score -= min(30.0, missing_ratio * 150)
    
    # Duplicate row penalty (max -20)
    dup_ratio = duplicate_rows / max(1, total_rows)
    score -= min(20.0, dup_ratio * 100)
    
    # Empty column penalty (-10 per empty col, max -20)
    score -= min(20.0, len(empty_cols) * 10)
    
    # Constant column penalty (-5 per constant col, max -15)
    score -= min(15.0, len(constant_cols) * 5)
    
    # Outlier penalty (max -15)
    if total_rows > 0:
        outlier_ratio = total_outliers / (total_rows * max(1, len(num_cols)))
        score -= min(15.0, outlier_ratio * 100)
        
    quality_score = max(0, min(100, int(round(score))))
    
    # Suggested cleaning actions
    suggestions = []
    if duplicate_rows > 0:
        suggestions.append({
            "type": "duplicates",
            "issue": f"{duplicate_rows} duplicate rows detected",
            "recommendation": "Remove duplicate rows to avoid double-counting transactions or entries."
        })
    if cols_with_missing:
        for c, count in cols_with_missing.items():
            pct = (count / total_rows) * 100
            strategy = "mode (most frequent value)" if df[c].dtype == 'object' else "median or mean"
            suggestions.append({
                "type": "missing",
                "issue": f"Column '{c}' has {count} missing values ({pct:.1f}%)",
                "recommendation": f"Impute missing values using {strategy}, or drop rows where '{c}' is required."
            })
    if empty_cols:
        suggestions.append({
            "type": "empty_columns",
            "issue": f"{len(empty_cols)} completely empty columns: {', '.join(empty_cols)}",
            "recommendation": "Drop unpopulated columns to simplify queries and schema."
        })
    if constant_cols:
        suggestions.append({
            "type": "constant_columns",
            "issue": f"{len(constant_cols)} zero-variance columns: {', '.join(constant_cols)}",
            "recommendation": "Remove constant columns as they provide no discriminative analytical power."
        })
    if total_outliers > 0:
        suggestions.append({
            "type": "outliers",
            "issue": f"{total_outliers} potential statistical outliers detected across {len(outlier_counts)} columns",
            "recommendation": "Review high-magnitude values. Validate if they are legitimate enterprise transactions or data-entry errors."
        })
        
    return {
        "score": quality_score,
        "total_missing_cells": total_missing_cells,
        "cols_with_missing": cols_with_missing,
        "duplicate_rows": duplicate_rows,
        "empty_cols": empty_cols,
        "constant_cols": constant_cols,
        "total_outliers": total_outliers,
        "outlier_counts": outlier_counts,
        "suggestions": suggestions
    }

def create_cleaned_dataset(df: pd.DataFrame, drop_duplicates: bool = True, fill_na_strategy: str = "median") -> pd.DataFrame:
    """
    Produce a cleaned copy of the DataFrame without modifying the original.
    """
    cleaned = df.copy()
    
    # 1. Drop duplicates
    if drop_duplicates:
        cleaned = cleaned.drop_duplicates()
        
    # 2. Drop empty columns
    cleaned = cleaned.dropna(axis=1, how="all")
    
    # 3. Fill missing values
    if fill_na_strategy == "median":
        for col in cleaned.select_dtypes(include=[np.number]).columns:
            if cleaned[col].isnull().any():
                cleaned[col] = cleaned[col].fillna(cleaned[col].median())
        for col in cleaned.select_dtypes(include=['object']).columns:
            if cleaned[col].isnull().any():
                mode = cleaned[col].mode()
                if not mode.empty:
                    cleaned[col] = cleaned[col].fillna(mode[0])
    elif fill_na_strategy == "drop":
        cleaned = cleaned.dropna()
        
    return cleaned
