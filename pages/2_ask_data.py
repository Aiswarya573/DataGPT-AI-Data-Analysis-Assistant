"""
Ask Data Page for DataGPT
Natural Language AI Data Analyst Chatbot with verifiable computations and dynamic Plotly charts.
"""

import streamlit as st
import pandas as pd
from modules.ai_engine import parse_and_execute_question
from modules.chart_generator import (
    generate_bar_chart, generate_line_chart, generate_scatter_chart,
    generate_pie_chart, generate_histogram
)

st.set_page_config(page_title="Ask Data | DataGPT", layout="wide")
st.title("💬 Ask Data – Conversational Data Analyst")

if "df" not in st.session_state or st.session_state.df is None:
    st.warning("⚠️ No dataset loaded! Please upload a file on the Home page first.")
    st.stop()

df = st.session_state.df
p = st.session_state.profile

# Top control bar
c1, c2 = st.columns([4, 1])
with c1:
    st.caption("Ask questions about your dataset. All numbers are computed directly with local Pandas/SQLite operations to guarantee 100% accuracy.")
with c2:
    if st.button("🗑️ Clear Chat", use_container_width=True):
        st.session_state.chat_history = []
        st.rerun()

# Sample Question Chips
st.markdown("**Try asking:**")
sample_questions = [
    "Which product has the highest sales?",
    "What is the total revenue?",
    "Show sales by category.",
    "Give me the top 5 customers.",
    "What is the monthly sales trend?"
]
cols = st.columns(len(sample_questions))
clicked_question = None
for i, q in enumerate(sample_questions):
    if cols[i].button(q, key=f"sample_q_{i}", use_container_width=True):
        clicked_question = q

# Display Chat History
for msg in st.session_state.chat_history:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])
        
        # Display calculation explanation if present
        if "calculation" in msg and msg["calculation"]:
            with st.expander("🔍 How this was calculated"):
                st.info(msg["calculation"])
                
        # Display table if present
        if "data" in msg and msg["data"] is not None:
            st.dataframe(msg["data"], use_container_width=True)
            
        # Display chart if present
        if "chart" in msg and msg["chart"]:
            chart_info = msg["chart"]
            chart_type = chart_info.get("type")
            res_df = msg["data"]
            try:
                if chart_type == "bar" and res_df is not None:
                    fig = generate_bar_chart(res_df, x=chart_info["x"], y=chart_info["y"], title=chart_info.get("title", ""))
                    st.plotly_chart(fig, use_container_width=True)
                elif chart_type == "line" and res_df is not None:
                    fig = generate_line_chart(res_df, x=chart_info["x"], y=chart_info["y"], title=chart_info.get("title", ""))
                    st.plotly_chart(fig, use_container_width=True)
            except Exception:
                pass

# Handle User Input
user_input = st.chat_input("Ask a question about your data (e.g., 'What are the top 5 cities by revenue?')...")
question_to_process = clicked_question or user_input

if question_to_process:
    # Append user question
    st.session_state.chat_history.append({"role": "user", "content": question_to_process})
    
    with st.chat_message("user"):
        st.markdown(question_to_process)
        
    with st.chat_message("assistant"):
        with st.spinner("Analyzing question, running calculations, and generating visualization..."):
            result = parse_and_execute_question(
                question_to_process,
                df,
                conversation_history=st.session_state.chat_history
            )
            
            st.markdown(result["answer"])
            if result.get("calculation"):
                with st.expander("🔍 How this was calculated"):
                    st.info(result["calculation"])
                    
            if result.get("result_data") is not None:
                st.dataframe(result["result_data"], use_container_width=True)
                
            if result.get("chart_info") and result.get("result_data") is not None:
                ci = result["chart_info"]
                try:
                    if ci["type"] == "bar":
                        fig = generate_bar_chart(result["result_data"], x=ci["x"], y=ci["y"], title=ci.get("title", ""))
                        st.plotly_chart(fig, use_container_width=True)
                    elif ci["type"] == "line":
                        fig = generate_line_chart(result["result_data"], x=ci["x"], y=ci["y"], title=ci.get("title", ""))
                        st.plotly_chart(fig, use_container_width=True)
                except Exception:
                    pass

    # Save to session history
    st.session_state.chat_history.append({
        "role": "assistant",
        "content": result["answer"],
        "calculation": result.get("calculation"),
        "data": result.get("result_data"),
        "chart": result.get("chart_info")
    })
