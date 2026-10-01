"""
Data Quality & Hygiene Page for DataGPT
Comprehensive audit of dataset integrity, anomaly detection, and non-destructive cleaning recipes.
"""

import streamlit as st
import pandas as pd
from modules.data_quality import check_data_quality, create_cleaned_dataset
from modules.anomaly_detector import detect_anomalies

st.set_page_config(page_title="Data Quality | DataGPT", layout="wide")
st.title("🛡️ Data Quality & Anomaly Detection")

if "df" not in st.session_state or st.session_state.df is None:
    st.warning("⚠️ No dataset loaded! Please upload a file on the Home page first.")
    st.stop()

df = st.session_state.df
q = st.session_state.quality_report or check_data_quality(df)

# Score Gauge Banner
score = q["score"]
score_color = "green" if score >= 80 else ("orange" if score >= 60 else "red")
st.markdown(f"### Overall Data Quality Score: :{score_color}[{score}/100]")

m1, m2, m3, m4 = st.columns(4)
m1.metric("Missing Values", f"{q['total_missing_cells']:,}")
m2.metric("Duplicate Rows", f"{q['duplicate_rows']:,}")
m3.metric("Potential Outliers", f"{q['total_outliers']:,}")
m4.metric("Constant / Empty Columns", len(q["empty_cols"]) + len(q["constant_cols"]))

st.divider()

# Tabs for audit sections
tab_issues, tab_anomalies, tab_clean = st.tabs(["1. Quality Audit Details", "2. Statistical Anomalies", "3. Smart Cleaning Recipe"])

with tab_issues:
    st.subheader("Detected Quality Issues")
    
    col_l, col_r = st.columns(2)
    with col_l:
        st.markdown("##### Missing Values by Column")
        if q["cols_with_missing"]:
            miss_df = pd.DataFrame([
                {"Column": col, "Missing Count": count, "Missing %": f"{(count/len(df))*100:.1f}%"}
                for col, count in q["cols_with_missing"].items()
            ])
            st.dataframe(miss_df, use_container_width=True)
        else:
            st.success("✅ Zero missing values detected across all columns.")
            
    with col_r:
        st.markdown("##### Duplicate Records")
        if q["duplicate_rows"] > 0:
            st.warning(f"⚠️ Found {q['duplicate_rows']} exact duplicate rows in the dataset.")
            dup_df = df[df.duplicated(keep=False)].head(10)
            st.dataframe(dup_df, use_container_width=True)
        else:
            st.success("✅ No duplicate records detected.")

with tab_anomalies:
    st.subheader("Statistical Outlier Inspection")
    method = st.radio("Detection Methodology:", options=["IQR (Interquartile Range 1.5x)", "Z-score (Threshold > 3.0)"], horizontal=True)
    selected_method = "iqr" if "IQR" in method else "zscore"
    
    anomalies = detect_anomalies(df, method=selected_method)
    if anomalies:
        for item in anomalies:
            with st.expander(f"⚠️ Column '{item['column']}': {item['anomaly_count']} potential anomalies ({item['anomaly_percentage']}%)"):
                st.caption(item["explanation"])
                st.markdown(f"**Value Range of Anomalies:** Min = `{item['min_anomaly_val']:,.2f}`, Max = `{item['max_anomaly_val']:,.2f}`")
                st.markdown("**Sample Flagged Rows:**")
                st.dataframe(pd.DataFrame(item["example_rows"]), use_container_width=True)
    else:
        st.success("✅ No statistical outliers detected using this methodology.")

with tab_clean:
    st.subheader("Non-Destructive Cleaning Engine")
    st.info("ℹ️ Cleaning creates a brand new copy of your data for downstream analytics. Your original uploaded dataset remains strictly untouched.")
    
    c1, c2 = st.columns(2)
    with c1:
        drop_dups = st.checkbox("Remove Duplicate Rows", value=True)
    with c2:
        missing_strategy = st.selectbox("Missing Values Handling:", options=["Fill with Median/Mode (Recommended)", "Drop Rows with Missing Values", "Keep As Is"])
        strat_key = "median" if "Median" in missing_strategy else ("drop" if "Drop" in missing_strategy else "none")

    if st.button("✨ Create Cleaned Dataset", type="primary"):
        cleaned_df = create_cleaned_dataset(
            df,
            drop_duplicates=drop_dups,
            fill_na_strategy=strat_key
        )
        st.session_state["cleaned_df"] = cleaned_df
        st.success(f"Cleaned dataset created! Shape: {cleaned_df.shape[0]:,} rows x {cleaned_df.shape[1]} columns (Reduced from {df.shape[0]:,} rows).")

    if "cleaned_df" in st.session_state:
        st.markdown("##### Cleaned Dataset Preview")
        st.dataframe(st.session_state["cleaned_df"].head(10), use_container_width=True)
        
        csv_bytes = st.session_state["cleaned_df"].to_csv(index=False).encode("utf-8")
        st.download_button(
            label="📥 Download Cleaned CSV",
            data=csv_bytes,
            file_name="cleaned_dataset.csv",
            mime="text/csv",
            use_container_width=True
        )
