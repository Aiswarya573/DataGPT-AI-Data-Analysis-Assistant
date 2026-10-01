"""
SQL Detective Page for DataGPT
Interactive SQL analytical investigation with safety guards against harmful mutations.
"""

import streamlit as st
import pandas as pd
from modules.query_engine import SQLiteQueryEngine
from modules.ai_engine import call_gemini_api
from utils.helpers import sanitize_sql_query

st.set_page_config(page_title="SQL Detective | DataGPT", layout="wide")
st.title("🕵️‍♂️ SQL Detective – Safe Analytical SQL Engine")

if "df" not in st.session_state or st.session_state.df is None:
    st.warning("⚠️ No dataset loaded! Please upload a file on the Home page first.")
    st.stop()

df = st.session_state.df
engine = SQLiteQueryEngine(df, table_name="dataset")
schema = engine.get_schema()

st.caption("Investigate your dataset using SQLite. Ask in natural language to generate SQL, or write custom SELECT queries.")

# Schema Viewer Expander
with st.expander("📋 View Table Schema (`dataset`)"):
    schema_df = pd.DataFrame([{"Column Name": col, "Data Type": dtype} for col, dtype in schema.items()])
    st.dataframe(schema_df, use_container_width=True)

# NL to SQL Translation section
st.subheader("1. Natural Language to SQL Assistant")
nl_col1, nl_col2 = st.columns([4, 1])

with nl_col1:
    nl_prompt = st.text_input(
        "Ask a question in plain English:",
        placeholder="Show top 5 products by total sales"
    )
with nl_col2:
    generate_btn = st.button("Generate SQL", type="primary", use_container_width=True)

initial_sql = "SELECT * FROM dataset LIMIT 10;"

if generate_btn and nl_prompt:
    with st.spinner("Translating English to SQL..."):
        prompt = f"""
You are an expert SQLite developer. Convert the following natural language question into a safe read-only SELECT SQLite query.
Table Name: dataset
Columns and Types: {schema}

Question: "{nl_prompt}"

Rules:
1. ONLY return the raw SQL query. No markdown formatting, no explanation.
2. Must be a safe SELECT statement.
3. If grouping, use SUM, AVG, COUNT, MIN, MAX as appropriate.
4. Keep column names exactly as listed in the schema.
"""
        generated_sql = call_gemini_api(prompt)
        if generated_sql:
            cleaned = generated_sql.replace("```sql", "").replace("```", "").strip()
            st.session_state["editor_sql"] = cleaned
        else:
            # Fallback heuristic
            st.session_state["editor_sql"] = f"SELECT * FROM dataset ORDER BY 1 DESC LIMIT 10;"

# SQL Editor Section
st.subheader("2. Execute SQL Query")
sql_query = st.text_area(
    "SQL Query (Read-Only):",
    value=st.session_state.get("editor_sql", initial_sql),
    height=120
)

col_run, col_clear = st.columns([1, 5])
with col_run:
    run_btn = st.button("▶️ Execute Query", type="primary", use_container_width=True)

if run_btn or "last_sql_result" in st.session_state:
    if run_btn:
        # Validate security
        if not sanitize_sql_query(sql_query):
            st.error("⛔ Security Alert: Destructive operations (DROP, DELETE, UPDATE, INSERT, ALTER) are strictly prohibited! Only analytical SELECT / WITH statements are allowed.")
        else:
            with st.spinner("Executing query on SQLite engine..."):
                res_df, err, elapsed = engine.execute_query(sql_query)
                if err:
                    st.error(err)
                else:
                    st.session_state["last_sql_result"] = {
                        "df": res_df,
                        "time": elapsed,
                        "query": sql_query
                    }

    if "last_sql_result" in st.session_state:
        res_info = st.session_state["last_sql_result"]
        res_df = res_info["df"]
        elapsed = res_info["time"]
        
        st.success(f"Query returned **{len(res_df):,} rows** in **{elapsed*1000:.1f} ms**.")
        
        st.dataframe(res_df, use_container_width=True)
        
        # Download SQL Result
        csv_bytes = res_df.to_csv(index=False).encode("utf-8")
        st.download_button(
            label="📥 Download Result CSV",
            data=csv_bytes,
            file_name="sql_detective_result.csv",
            mime="text/csv"
        )
