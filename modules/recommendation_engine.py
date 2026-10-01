"""
Recommendation Engine module for DataGPT.
Pairs data findings with targeted, actionable business recommendations.
Strictly separates mathematical findings from prudent analytical advice.
"""

from typing import Any, Dict, List
import pandas as pd
import numpy as np

def generate_recommendations(
    insights: Dict[str, Any],
    quality_report: Dict[str, Any],
    anomalies: List[Dict[str, Any]]
) -> List[Dict[str, str]]:
    """
    Generate strategic recommendation pairs (Finding vs Recommendation).
    """
    recommendations = []
    
    # 1. Quality-based recommendations
    if quality_report.get("duplicate_rows", 0) > 0:
        dups = quality_report["duplicate_rows"]
        recommendations.append({
            "category": "Data Hygiene",
            "finding": f"Dataset contains {dups} duplicate records, representing potential repeated transaction logs.",
            "recommendation": "Review source ETL pipeline or de-duplicate records before generating executive financial reporting."
        })
        
    if quality_report.get("total_missing_cells", 0) > 0:
        missing_count = quality_report["total_missing_cells"]
        recommendations.append({
            "category": "Data Completeness",
            "finding": f"Detected {missing_count} null or missing values across key operational dimensions.",
            "recommendation": "Implement front-end validation rules on upstream data entry forms to prevent optional missing fields."
        })
        
    # 2. Outlier / Anomaly-based recommendations
    for anom in anomalies:
        col = anom["column"]
        count = anom["anomaly_count"]
        max_val = anom["max_anomaly_val"]
        recommendations.append({
            "category": "Outlier Investigation",
            "finding": f"Identified {count} statistical anomalies in '{col}' reaching values up to {max_val:,.2f}.",
            "recommendation": f"Verify whether these high-magnitude '{col}' instances correspond to enterprise bulk orders, customized contracts, or unit-of-measure data entry typos."
        })
        
    # 3. Business concentration recommendations
    top_perf = insights.get("top_performers", {})
    for name, data in list(top_perf.items())[:3]:
        cat = data["category"]
        metric = data["metric"]
        top_item = data["top_item"]
        share = data["share_percentage"]
        
        if share > 40:
            recommendations.append({
                "category": "Portfolio Diversification",
                "finding": f"High concentration risk: '{top_item}' commands {share}% of total {metric} across all {cat}s.",
                "recommendation": f"Develop retention initiatives for '{top_item}' while actively cross-selling secondary {cat}s to mitigate dependency on a single revenue driver."
            })
        elif share > 20:
            recommendations.append({
                "category": "Growth Acceleration",
                "finding": f"'{top_item}' is the top contributor with {share}% of total {metric}.",
                "recommendation": f"Analyze the marketing channel and margin profile of '{top_item}' to replicate its playbook across emerging items."
            })
            
    # 4. Temporal Trend recommendations
    trends = insights.get("trends", [])
    if trends:
        recommendations.append({
            "category": "Demand Forecasting",
            "finding": "Observed significant month-over-month variances across key timeline periods.",
            "recommendation": "Institute rolling 90-day demand forecasting and inventory buffers to prevent stockouts or over-allocation during peak cycles."
        })
        
    return recommendations
