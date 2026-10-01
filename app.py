"""
DataGPT – AI-Powered Data Analysis Assistant
Main Streamlit Application Entrypoint
"""

import streamlit as st
import pandas as pd
from utils.config import APP_TITLE, APP_SUBTITLE, APP_ICON, MAX_UPLOAD_SIZE_MB, get_api_key
from modules.file_handler import load_dataset, load_sample_dataset
from modules.data_profiler import profile_dataset
from modules.data_quality import check_data_quality
from modules.anomaly_detector import detect_anomalies
from modules.insight_engine import generate_business_insights
from modules.recommendation_engine import generate_recommendations

st.set_page_config(
    page_title=APP_TITLE,
    page_icon=APP_ICON,
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize Session State
if "df" not in st.session_state:
    st.session_state.df = None
if "dataset_name" not in st.session_state:
    st.session_state.dataset_name = None
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []
if "profile" not in st.session_state:
    st.session_state.profile = None
if "quality_report" not in st.session_state:
    st.session_state.quality_report = None
if "anomalies" not in st.session_state:
    st.session_state.anomalies = None
if "insights" not in st.session_state:
    st.session_state.insights = None
if "recommendations" not in st.session_state:
    st.session_state.recommendations = None

def process_dataframe(df: pd.DataFrame, name: str):
    """Profile and analyze a loaded dataframe."""
    st.session_state.df = df
    st.session_state.dataset_name = name
    st.session_state.profile = profile_dataset(df)
    st.session_state.quality_report = check_data_quality(df)
    st.session_state.anomalies = detect_anomalies(df, method="iqr")
    st.session_state.insights = generate_business_insights(df)
    st.session_state.recommendations = generate_recommendations(
        st.session_state.insights,
        st.session_state.quality_report,
        st.session_state.anomalies
    )

# Sidebar
with st.sidebar:
    st.markdown(f"### {APP_ICON} {APP_TITLE}")
    st.caption(APP_SUBTITLE)
    st.divider()
    
    # File Uploader
    uploaded_file = st.file_uploader(
        "Upload your dataset (CSV, XLSX, XLS)",
        type=["csv", "xlsx", "xls"],
        help=f"Maximum file size: {MAX_UPLOAD_SIZE_MB}MB"
    )
    
    if uploaded_file is not None:
        if st.session_state.dataset_name != uploaded_file.name:
            with st.spinner("Processing dataset & profiling data..."):
                df, err = load_dataset(uploaded_file, uploaded_file.name)
                if err:
                    st.error(err)
                else:
                    process_dataframe(df, uploaded_file.name)
                    st.success(f"Loaded '{uploaded_file.name}'!")
                    
    # Quick Sample Data Loader
    st.markdown("---")
    st.markdown("##### Need sample data?")
    if st.button("Load Superstore Sample Dataset", use_container_width=True):
        with st.spinner("Loading sample dataset with intentional QA anomalies..."):
            df, err = load_sample_dataset()
            if err:
                st.error(err)
            else:
                process_dataframe(df, "sample_superstore.csv")
                st.success("Loaded 'sample_superstore.csv'!")
                st.rerun()

    # Active dataset indicator
    if st.session_state.df is not None:
        st.divider()
        st.markdown(f"**Active Dataset:** `{st.session_state.dataset_name}`")
        st.write(f"**Rows:** {len(st.session_state.df):,} | **Columns:** {len(st.session_state.df.columns)}")
        if st.button("Clear Dataset", use_container_width=True):
            st.session_state.df = None
            st.session_state.dataset_name = None
            st.session_state.chat_history = []
            st.rerun()

# Main Area
st.title(f"{APP_ICON} {APP_TITLE}")
st.markdown(f"*{APP_SUBTITLE} – Natural Language Intelligence for Any Dataset*")

if st.session_state.df is None:
    # Empty State Welcome
    st.info("👋 Welcome to DataGPT! Upload a CSV or Excel file in the sidebar, or click **'Load Superstore Sample Dataset'** to begin.")
    
    col1, col2, col3 = st.columns(3)
    with col1:
        st.markdown("#### 1. Instant Data Profiling")
        st.write("Automatic schema detection, summary statistics, missing values, duplicates, and statistical anomaly detection (IQR & Z-score).")
    with col2:
        st.markdown("#### 2. Verified AI Chat")
        st.write("Ask natural-language questions. DataGPT computes exact answers locally using Pandas/SQLite, guaranteeing zero mathematical hallucinations.")
    with col3:
        st.markdown("#### 3. Interactive Plotly Charts")
        st.write("Automatic responsive visualizations with hover inspection, custom slicers, SQL detective mode, and business recommendations.")
        
    st.divider()
    st.markdown("### Architecture Workflow")
    st.code("""
User Question ──> LLM Intent Extraction ──> Local Computation (Pandas / Safe SQLite)
                                                  │
                                                  ▼
Human Explanation <── LLM Synthesis <── Verified Result + Plotly Chart Spec
""", language="text")

else:
    # Dataset Loaded Overview
    p = st.session_state.profile
    q = st.session_state.quality_report
    
    st.success(f"**Active Dataset:** `{st.session_state.dataset_name}`")
    
    # Overview Metrics Row
    m1, m2, m3, m4, m5 = st.columns(5)
    m1.metric("Total Rows", f"{p['rows']:,}")
    m2.metric("Total Columns", f"{p['columns']:,}")
    m3.metric("Numerical Columns", len(p['numerical_columns']))
    m4.metric("Categorical Columns", len(p['categorical_columns']))
    m5.metric("Date Columns", len(p['date_columns']))
    
    # Data Quality Banner
    st.markdown("---")
    q_col1, q_col2 = st.columns([1, 3])
    with q_col1:
        score = q["score"]
        color = "green" if score >= 80 else ("orange" if score >= 60 else "red")
        st.markdown(f"### Data Quality Score: :{color}[{score}/100]")
        st.caption("Computed from missing cells, duplicate records, and outliers.")
    with q_col2:
        c1, c2, c3, c4 = st.columns(4)
        c1.metric("Missing Cells", q["total_missing_cells"])
        c2.metric("Duplicate Rows", q["duplicate_rows"])
        c3.metric("Potential Outliers", q["total_outliers"])
        c4.metric("Empty Columns", len(q["empty_cols"]))
        
    # Dataset Preview Tab
    st.markdown("### Dataset Preview")
    tab_preview, tab_cols, tab_summary = st.tabs(["Data Table", "Column Types", "Numerical Summary"])
    
    with tab_preview:
        st.dataframe(st.session_state.df.head(15), use_container_width=True)
        st.caption(f"Displaying first 15 of {p['rows']:,} rows.")
        
    with tab_cols:
        col_type_df = pd.DataFrame({
            "Column": p["column_names"],
            "Data Type": [str(st.session_state.df[c].dtype) for c in p["column_names"]],
            "Type Classification": [
                "Numerical" if c in p["numerical_columns"] else
                ("Date" if c in p["date_columns"] else "Categorical")
                for c in p["column_names"]
            ],
            "Null Count": [int(st.session_state.df[c].isnull().sum()) for c in p["column_names"]],
            "Unique Count": [int(st.session_state.df[c].nunique()) for c in p["column_names"]]
        })
        st.dataframe(col_type_df, use_container_width=True)
        
    with tab_summary:
        if p["numerical_summary"]:
            summary_df = pd.DataFrame(p["numerical_summary"]).T
            st.dataframe(summary_df.style.format("{:,.2f}"), use_container_width=True)
        else:
            st.info("No numerical columns detected.")
            
    # "Analyze My Data" Button (Data Analyst Mode)
    st.markdown("---")
    st.markdown("### 🤖 Data Analyst Mode")
    if st.button("🚀 Analyze My Data (Complete Automated Deep-Dive)", type="primary", use_container_width=True):
        st.session_state["show_deep_dive"] = True

    if st.session_state.get("show_deep_dive", False):
        st.markdown("#### 📈 Automated Business Findings & Key Insights")
        ins = st.session_state.insights
        for finding in ins.get("insights", []):
            st.markdown(f"- {finding}")
            
        st.markdown("#### 💡 Strategic Recommendations (Finding vs Recommendation)")
        recs = st.session_state.recommendations
        if recs:
            for r in recs:
                with st.expander(f"📌 {r['category']}: {r['finding'][:60]}..."):
                    st.markdown(f"**Finding:** {r['finding']}")
                    st.markdown(f"**Recommendation:** {r['recommendation']}")
        else:
            st.write("No critical risk patterns detected in this dataset.")
