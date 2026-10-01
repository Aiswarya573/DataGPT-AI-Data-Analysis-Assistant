"""
Explore Data Page for DataGPT
Interactive self-serve slicing, dicing, grouping, aggregation, and chart generation.
"""

import streamlit as st
import pandas as pd
from modules.query_engine import compute_aggregation
from modules.chart_generator import (
    generate_bar_chart, generate_line_chart, generate_scatter_chart,
    generate_pie_chart, generate_histogram
)

st.set_page_config(page_title="Explore Data | DataGPT", layout="wide")
st.title("🔍 Explore Data – Self-Serve Analytics")

if "df" not in st.session_state or st.session_state.df is None:
    st.warning("⚠️ No dataset loaded! Please upload a file on the Home page first.")
    st.stop()

df = st.session_state.df
p = st.session_state.profile

st.caption("Point-and-click data explorer. Select columns, grouping dimensions, aggregations, and visual chart types.")

col_c, col_g, col_a, col_ch = st.columns(4)

with col_c:
    target_metric = st.selectbox(
        "1. Select Metric / Column",
        options=p["numerical_columns"] if p["numerical_columns"] else df.columns.tolist()
    )

with col_g:
    group_options = ["None (Overall)"] + p["categorical_columns"] + p["date_columns"]
    selected_group = st.selectbox("2. Group By (Dimension)", options=group_options)
    group_col = None if selected_group == "None (Overall)" else selected_group

with col_a:
    agg_func = st.selectbox(
        "3. Aggregation",
        options=["Sum", "Mean", "Count", "Min", "Max"]
    )

with col_ch:
    chart_type = st.selectbox(
        "4. Chart Type",
        options=["Bar Chart", "Line Chart", "Donut / Pie Chart", "Histogram", "Scatter Plot"]
    )

# Filter accordion
with st.expander("⚙️ Optional Query Filter (e.g. Sales > 500 or Region == 'West')"):
    filter_expr = st.text_input("Pandas query filter expression", placeholder="Quantity > 2 and Category == 'Electronics'")

# Run computation
res_df, err = compute_aggregation(
    df,
    target_col=target_metric,
    group_col=group_col,
    agg_func=agg_func.lower(),
    filter_expr=filter_expr if filter_expr.strip() else None
)

if err:
    st.error(err)
elif res_df is not None:
    st.divider()
    
    col_plot, col_table = st.columns([3, 2])
    
    with col_plot:
        st.subheader("Interactive Plot")
        try:
            if group_col:
                if chart_type == "Bar Chart":
                    fig = generate_bar_chart(res_df, x=group_col, y=target_metric, title=f"{agg_func} of {target_metric} by {group_col}")
                    st.plotly_chart(fig, use_container_width=True)
                elif chart_type == "Line Chart":
                    fig = generate_line_chart(res_df, x=group_col, y=target_metric, title=f"{agg_func} of {target_metric} by {group_col}")
                    st.plotly_chart(fig, use_container_width=True)
                elif chart_type == "Donut / Pie Chart":
                    fig = generate_pie_chart(res_df, names=group_col, values=target_metric, title=f"Proportion of {target_metric} by {group_col}")
                    st.plotly_chart(fig, use_container_width=True)
                elif chart_type == "Scatter Plot":
                    fig = generate_scatter_chart(res_df, x=group_col, y=target_metric, title=f"{target_metric} vs {group_col}")
                    st.plotly_chart(fig, use_container_width=True)
                else:
                    fig = generate_histogram(df, x=target_metric, title=f"Distribution of {target_metric}")
                    st.plotly_chart(fig, use_container_width=True)
            else:
                fig = generate_histogram(df, x=target_metric, title=f"Distribution of {target_metric}")
                st.plotly_chart(fig, use_container_width=True)
        except Exception as e:
            st.error(f"Plotting error: {str(e)}")
            
    with col_table:
        st.subheader("Aggregated Data Table")
        st.dataframe(res_df, use_container_width=True)
        
        # Download button for aggregated results
        csv_bytes = res_df.to_csv(index=False).encode("utf-8")
        st.download_button(
            label="📥 Download Result CSV",
            data=csv_bytes,
            file_name=f"explored_{target_metric}_{agg_func.lower()}.csv",
            mime="text/csv",
            use_container_width=True
        )
