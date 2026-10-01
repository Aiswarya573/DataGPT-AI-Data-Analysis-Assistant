"""
Anomaly detection module for DataGPT.
Detects potential statistical anomalies using IQR and Z-Score techniques.
Labels all findings clearly as 'Potential Anomaly' rather than guaranteed errors.
"""

from typing import Any, Dict, List
import pandas as pd
import numpy as np

def detect_anomalies(df: pd.DataFrame, method: str = "iqr", threshold: float = 3.0) -> List[Dict[str, Any]]:
    """
    Detect statistical outliers across all numerical columns.
    Methods:
      - 'iqr': 1.5 * IQR rule
      - 'zscore': Values exceeding threshold standard deviations (default 3.0)
    """
    results = []
    num_cols = df.select_dtypes(include=[np.number]).columns
    
    for col in num_cols:
        series = df[col].dropna()
        if len(series) < 5:
            continue
            
        anomalies_idx = []
        explanation = ""
        
        if method == "iqr":
            q1 = float(series.quantile(0.25))
            q3 = float(series.quantile(0.75))
            iqr = q3 - q1
            if iqr <= 0:
                continue
            lower_bound = q1 - 1.5 * iqr
            upper_bound = q3 + 1.5 * iqr
            mask = (series < lower_bound) | (series > upper_bound)
            anomalies_idx = series[mask].index.tolist()
            explanation = (
                f"Using IQR method (Q1={q1:.2f}, Q3={q3:.2f}, IQR={iqr:.2f}). "
                f"Values outside [{lower_bound:.2f}, {upper_bound:.2f}] are flagged as potential anomalies."
            )
        elif method == "zscore":
            mean = float(series.mean())
            std = float(series.std())
            if std <= 0:
                continue
            z_scores = np.abs((series - mean) / std)
            mask = z_scores > threshold
            anomalies_idx = series[mask].index.tolist()
            explanation = (
                f"Using Z-score method (Mean={mean:.2f}, Std={std:.2f}). "
                f"Values deviating by more than {threshold} standard deviations are flagged as potential anomalies."
            )
            
        if len(anomalies_idx) > 0:
            sample_rows = df.loc[anomalies_idx[:5]].to_dict(orient="records")
            results.append({
                "column": col,
                "anomaly_count": len(anomalies_idx),
                "anomaly_percentage": round((len(anomalies_idx) / len(series)) * 100, 2),
                "min_anomaly_val": float(series.loc[anomalies_idx].min()),
                "max_anomaly_val": float(series.loc[anomalies_idx].max()),
                "explanation": explanation,
                "example_rows": sample_rows
            })
            
    return results
