"""
File handler module for DataGPT.
Handles loading and reading of CSV, XLSX, and XLS datasets with error tolerance.
"""

import io
from typing import Optional, Tuple
import pandas as pd
from utils.config import MAX_UPLOAD_SIZE_MB

def load_dataset(file_obj, filename: str) -> Tuple[Optional[pd.DataFrame], Optional[str]]:
    """
    Read an uploaded file or file path into a pandas DataFrame.
    Returns (DataFrame, error_message).
    """
    try:
        lower_name = filename.lower()
        if lower_name.endswith(".csv"):
            # Try utf-8 first, fallback to latin-1
            try:
                df = pd.read_csv(file_obj, encoding="utf-8")
            except UnicodeDecodeError:
                if hasattr(file_obj, "seek"):
                    file_obj.seek(0)
                df = pd.read_csv(file_obj, encoding="latin-1")
        elif lower_name.endswith(".xlsx") or lower_name.endswith(".xls"):
            df = pd.read_excel(file_obj)
        else:
            return None, f"Unsupported file format '{filename}'. Please upload a CSV, XLSX, or XLS file."
        
        if df.empty:
            return None, "The uploaded dataset is empty."
            
        return df, None
    except Exception as e:
        return None, f"Failed to parse file: {str(e)}"

def load_sample_dataset() -> Tuple[Optional[pd.DataFrame], Optional[str]]:
    """Load the included sample superstore dataset."""
    import os
    path = os.path.join(os.path.dirname(__file__), "..", "data", "sample_superstore.csv")
    if os.path.exists(path):
        return load_dataset(path, "sample_superstore.csv")
    return None, "Sample dataset file not found."
