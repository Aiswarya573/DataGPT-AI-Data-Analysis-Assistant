"""
Dashboard Page for DataGPT
Visualizes high-level KPIs, distributions, and automated Plotly charts.
"""

import streamlit as st
import pandas as pd
from modules.chart_generator import generate_bar_chart, generate_line_chart, generate_histogram, generate_pie_chart

st.set_page_config(page_title="Dashboard | DataGPT", layout="wide")
st.title("📊 Executive Dataset Dashboard")

if "df" not in st.session_state or st.session_state.df is None:
    st.warning("⚠️ No dataset uploaded yet! Please go to the Home page and upload a dataset or load the sample data.")
    st.stop()

df = st.session_state.df
p = st.session_state.profile
q = st.session_state.quality_report

# KPI Summary Cards
k1, k2, k3, k4, k5 = st.columns(5)
k1.metric("Total Records", f"{len(df):,}")
k2.metric("Total Dimensions", len(p["categorical_columns"]))
k3.metric("Data Quality Score", f"{q['score']}/100")
k4.metric("Identified Anomalies", q["total_outliers"])
if p["numerical_columns"]:
    first_num = p["numerical_columns"][-1]
    k5.metric(f"Total {first_num}", f"{df[first_num].sum():,.2f}")
else:
    k5.metric("Columns", len(df.columns))

st.divider()

# Automated Charts Grid
col_left, col_right = st.columns(2)

with col_left:
    st.subheader("Top Category Performance")
    if p["categorical_columns"] and p["numerical_columns"]:
        cat_col = p["categorical_columns"][0]
        num_col = p["numerical_columns"][-1]
        agg_df = df.groupby(cat_col)[num_col].sum().reset_index().sort_values(by=num_col, ascending=False)
        fig_bar = generate_bar_chart(agg_df, x=cat_col, y=num_col, title=f"Total {num_col} by {cat_col}", top_n=10)
        st.plotly_chart(fig_bar, use_container_width=True)
    else:
        st.info("Insufficient categorical and numerical columns for bar chart.")

with col_right:
    st.subheader("Proportion Breakdown")
    if p["categorical_columns"] and p["numerical_columns"]:
        # Pick category with <= 8 categories if possible
        best_cat = None
        for c in p["categorical_columns"]:
            if 2 <= df[c].nunique() <= 10:
                best_cat = c
                break
        best_cat = best_cat or p["categorical_columns"][0]
        num_col = p["numerical_columns"][-1]
        pie_df = df.groupby(best_cat)[num_col].sum().reset_index()
        fig_pie = generate_pie_chart(pie_df, names=best_cat, values=num_col, title=f"Share of {num_col} by {best_cat}")
        st.plotly_chart(fig_pie, use_container_width=True)
    else:
        st.info("Insufficient data for pie chart.")

# Trend and Distribution Row
col_trend, col_dist = st.columns(2)

with col_trend:
    st.subheader("Temporal Trend")
    if p["date_columns"] and p["numerical_columns"]:
        d_col = p["date_columns"][0]
        n_col = p["numerical_columns"][-1]
        try:
            df_t = df.copy()
            df_t["__date__"] = pd.to_datetime(df_t[d_col], errors="coerce")
            df_t = df_t.dropna(subset=["__date__"]).sort_values("__date__")
            df_t["Month"] = df_t["__date__"].dt.to_period("M").astype(str)
            trend_data = df_t.groupby("Month")[n_col].sum().reset_index()
            fig_trend = generate_line_chart(trend_data, x="Month", y=n_col, title=f"Monthly {n_col} Trend")
            st.plotly_chart(fig_trend, use_container_width=True)
        except Exception:
            st.info("Could not parse dates for trend line chart.")
    else:
        st.info("No date column detected for timeline analysis.")

with col_dist:
    st.subheader("Numerical Distribution")
    if p["numerical_columns"]:
        n_col = p["numerical_columns"][0]
        fig_hist = generate_histogram(df, x=n_col, title=f"Distribution of {n_col}")
        st.plotly_chart(fig_hist, use_container_width=True)
    else:
        st.info("No numerical column for distribution chart.")
