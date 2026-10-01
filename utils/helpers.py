"""
Helper utilities for DataGPT: formatting, serialization, and safety checks.
"""

import re
from typing import Any, Dict, List
import pandas as pd
import numpy as np

def format_currency(val: float, currency_symbol: str = "$") -> str:
    """Format numerical values nicely with abbreviations or commas."""
    if pd.isna(val):
        return "N/A"
    abs_val = abs(val)
    if abs_val >= 1_000_000_000:
        return f"{currency_symbol}{val/1_000_000_000:.2f}B"
    elif abs_val >= 1_000_000:
        return f"{currency_symbol}{val/1_000_000:.2f}M"
    elif abs_val >= 1_000:
        return f"{currency_symbol}{val:,.2f}"
    return f"{currency_symbol}{val:.2f}"

def format_number(val: float) -> str:
    """Format regular number with thousands separators."""
    if pd.isna(val):
        return "N/A"
    if isinstance(val, (int, np.integer)):
        return f"{val:,}"
    if isinstance(val, (float, np.floating)):
        return f"{val:,.2f}"
    return str(val)

def sanitize_sql_query(query: str) -> bool:
    """
    Ensure the SQL query is strictly read-only SELECT.
    Disallows DROP, DELETE, INSERT, UPDATE, ALTER, TRUNCATE, ATTACH, DETACH, PRAGMA.
    """
    cleaned = re.sub(r"--.*?\n", "", query)
    cleaned = re.sub(r"/\*.*?\*/", "", cleaned, flags=re.DOTALL)
    
    # Check forbidden keywords
    forbidden = [
        r"\bDROP\b", r"\bDELETE\b", r"\bINSERT\b", r"\bUPDATE\b",
        r"\bALTER\b", r"\bTRUNCATE\b", r"\bATTACH\b", r"\bDETACH\b",
        r"\bREPLACE\b", r"\bCREATE\b", r"\bEXEC\b", r"\bGRANT\b",
        r"\bREVOKE\b"
    ]
    for pattern in forbidden:
        if re.search(pattern, cleaned, flags=re.IGNORECASE):
            return False
            
    # Must start with SELECT or WITH
    stripped = cleaned.strip().upper()
    return stripped.startswith("SELECT") or stripped.startswith("WITH")
