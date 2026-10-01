"""
Application configuration for DataGPT
Handles environment variables and system constants.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Gemini / LLM API Key: Checks Streamlit secrets or OS environment
def get_api_key() -> str:
    # Check Streamlit secrets if running inside Streamlit Cloud
    try:
        import streamlit as st
        if "AI_API_KEY" in st.secrets:
            return st.secrets["AI_API_KEY"]
        if "GEMINI_API_KEY" in st.secrets:
            return st.secrets["GEMINI_API_KEY"]
    except Exception:
        pass
    
    # Check OS Environment
    return os.getenv("AI_API_KEY") or os.getenv("GEMINI_API_KEY") or ""

APP_TITLE = "DataGPT – AI-Powered Data Analysis Assistant"
APP_SUBTITLE = "Your AI Data Analyst"
APP_ICON = "📊"

# Max file size limit in MB
MAX_UPLOAD_SIZE_MB = 50

# Supported extensions
SUPPORTED_EXTENSIONS = [".csv", ".xlsx", ".xls"]
