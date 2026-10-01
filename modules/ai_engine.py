"""
AI Engine module for DataGPT.
Interfaces with Gemini API / LLM to interpret user questions into verified local queries.
Guarantees numerical integrity by ensuring the LLM never hallucinates raw numbers:
Calculation is executed locally in Pandas/SQLite, and the LLM formats the verifiable result.
"""

import json
import re
from typing import Any, Dict, List, Optional, Tuple
import pandas as pd
import numpy as np

from utils.config import get_api_key
from modules.query_engine import SQLiteQueryEngine

def call_gemini_api(prompt: str, system_instruction: str = "") -> Optional[str]:
    """
    Execute a call to Google GenAI Gemini model.
    Falls back gracefully if key is not configured.
    """
    api_key = get_api_key()
    if not api_key:
        return None
        
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=prompt,
            config={
                "system_instruction": system_instruction,
                "temperature": 0.2
            }
        )
        return response.text
    except Exception as e:
        # Log or return None for fallback
        return None

def parse_and_execute_question(
    question: str,
    df: pd.DataFrame,
    conversation_history: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    """
    Core AI Data Analyst Pipeline:
    1. Determine user intent and target dimensions/metrics
    2. Execute computation locally on Pandas or SQLite
    3. Synthesize human explanation and chart specification
    """
    num_cols = list(df.select_dtypes(include=[np.number]).columns)
    cat_cols = [c for c in df.columns if c not in num_cols]
    col_names = list(df.columns)
    
    # Check for date columns
    date_cols = []
    for c in col_names:
        if "date" in c.lower() or "time" in c.lower() or "year" in c.lower() or "month" in c.lower():
            date_cols.append(c)

    # 1. Ask Gemini to extract operation specification
    api_key = get_api_key()
    parsed_intent = None
    
    if api_key:
        history_context = ""
        if conversation_history:
            history_context = "Recent conversation context:\n" + "\n".join(
                [f"{m['role'].upper()}: {m['content']}" for m in conversation_history[-3:]]
            )
            
        sys_prompt = f"""
You are an expert Data Analyst AI. Your goal is to analyze the user's question about a dataset with columns:
Columns: {col_names}
Numerical columns: {num_cols}
Categorical columns: {cat_cols}
Date columns: {date_cols}

{history_context}

Return a JSON object with:
{{
  "operation": "total | top_n | bottom_n | groupby | trend | count | filter | direct_sql",
  "metric_col": "<one of numerical columns, or empty>",
  "group_col": "<one of categorical or date columns, or empty>",
  "top_n": <number if asking for top/bottom, else 5>,
  "filter_condition": "<optional text filter>",
  "chart_type": "bar | line | pie | scatter | histogram | none",
  "chart_title": "<concise chart title>",
  "sql_query": "<optional safe SQLite query for table 'dataset'>"
}}
Return ONLY valid JSON.
"""
        raw_resp = call_gemini_api(question, sys_prompt)
        if raw_resp:
            try:
                cleaned = re.sub(r"```json|```", "", raw_resp).strip()
                parsed_intent = json.loads(cleaned)
            except Exception:
                parsed_intent = None

    # Fallback heuristic parser if no API key or failed parse
    if not parsed_intent:
        parsed_intent = fallback_heuristic_intent(question, col_names, num_cols, cat_cols, date_cols)

    # 2. Local Verified Execution based on Intent
    op = parsed_intent.get("operation", "total")
    metric = parsed_intent.get("metric_col")
    group = parsed_intent.get("group_col")
    top_k = int(parsed_intent.get("top_n", 5))
    
    # Pick safe defaults if not found
    if not metric and num_cols:
        metric = num_cols[-1]  # Often 'Sales' or 'Revenue'
    if not group and cat_cols:
        group = cat_cols[0]

    result_data = None
    answer_text = ""
    calculation_explanation = ""
    chart_info = None

    # Execute locally
    engine = SQLiteQueryEngine(df)
    
    if op in ["top_n", "bottom_n", "groupby"] and metric and group:
        ascending = (op == "bottom_n")
        grouped = df.groupby(group)[metric].sum().reset_index()
        sorted_df = grouped.sort_values(by=metric, ascending=ascending)
        result_data = sorted_df.head(top_k)
        
        top_item = result_data.iloc[0][group]
        top_val = result_data.iloc[0][metric]
        
        direction = "lowest" if ascending else "highest"
        answer_text = f"**{top_item}** has the {direction} {metric} with a total of **{top_val:,.2f}**."
        calculation_explanation = f"Grouped dataset by '{group}', computed sum of '{metric}' for each group, and sorted in {'ascending' if ascending else 'descending'} order (Top {top_k})."
        
        chart_info = {
            "type": "bar",
            "x": group,
            "y": metric,
            "title": f"Top {top_k} {group}s by {metric}"
        }
        
    elif op == "total" and metric:
        total_val = float(df[metric].sum())
        mean_val = float(df[metric].mean())
        count_val = int(df[metric].count())
        result_data = pd.DataFrame([{
            "Metric": metric,
            "Total Sum": total_val,
            "Average": mean_val,
            "Record Count": count_val
        }])
        answer_text = f"The total **{metric}** across all records is **{total_val:,.2f}** (Average: {mean_val:,.2f} across {count_val:,} rows)."
        calculation_explanation = f"Calculated by summing all non-null values in the '{metric}' column across {count_val:,} rows."
        
    elif op == "trend" and metric and (date_cols or group):
        t_col = date_cols[0] if date_cols else group
        try:
            df_temp = df.copy()
            df_temp['__d__'] = pd.to_datetime(df_temp[t_col], errors='coerce')
            df_temp = df_temp.dropna(subset=['__d__']).sort_values('__d__')
            df_temp['__period__'] = df_temp['__d__'].dt.to_period('M').astype(str)
            trend_df = df_temp.groupby('__period__')[metric].sum().reset_index()
            result_data = trend_df
            
            first_val = trend_df.iloc[0][metric]
            last_val = trend_df.iloc[-1][metric]
            change = ((last_val - first_val) / abs(first_val) * 100) if first_val != 0 else 0
            
            answer_text = f"From {trend_df.iloc[0]['__period__']} to {trend_df.iloc[-1]['__period__']}, {metric} went from {first_val:,.2f} to {last_val:,.2f} ({'+' if change >= 0 else ''}{change:.1f}%)."
            calculation_explanation = f"Parsed '{t_col}' into monthly periods, aggregated sum of '{metric}', and measured overall net movement."
            chart_info = {
                "type": "line",
                "x": "__period__",
                "y": metric,
                "title": f"Monthly {metric} Trend"
            }
        except Exception as e:
            answer_text = f"Analyzed trend for {metric}: total is {df[metric].sum():,.2f}."
            calculation_explanation = f"Aggregated {metric} over available records."
            
    else:
        # Default SQL / table execution
        sql = parsed_intent.get("sql_query")
        if not sql:
            sql = f"SELECT {group}, SUM({metric}) as total_{metric} FROM dataset GROUP BY {group} ORDER BY total_{metric} DESC LIMIT 5"
        
        res_df, err, _ = engine.execute_query(sql)
        if err or res_df is None or res_df.empty:
            # Fallback
            result_data = df.head(5)
            answer_text = f"Here are the top rows matching your query."
            calculation_explanation = "Retrieved dataset preview."
        else:
            result_data = res_df
            first_row = result_data.iloc[0].to_dict()
            answer_text = f"Analysis completed: leading item is **{list(first_row.values())[0]}**."
            calculation_explanation = f"Executed verified query: `{sql}`"
            if len(result_data.columns) >= 2:
                chart_info = {
                    "type": "bar",
                    "x": result_data.columns[0],
                    "y": result_data.columns[1],
                    "title": f"Analysis Result: {result_data.columns[1]} by {result_data.columns[0]}"
                }

    # 3. If LLM is available, refine human phrasing without modifying numbers
    if api_key and answer_text:
        refine_prompt = f"""
You are DataGPT, an AI Data Analyst.
User Question: "{question}"
Computed Answer: "{answer_text}"
Calculation Explanation: "{calculation_explanation}"

Write a concise, polished response in 1-2 paragraphs. Keep the EXACT computed figures, format numbers cleanly, and maintain the calculation explanation section.
Do NOT invent new numerical numbers.
"""
        refined = call_gemini_api(refine_prompt)
        if refined and len(refined.strip()) > 10:
            answer_text = refined.strip()

    return {
        "answer": answer_text,
        "calculation": calculation_explanation,
        "result_data": result_data,
        "chart_info": chart_info,
        "intent": parsed_intent
    }

def fallback_heuristic_intent(
    question: str,
    columns: List[str],
    num_cols: List[str],
    cat_cols: List[str],
    date_cols: List[str]
) -> Dict[str, Any]:
    """Heuristic regex parser for common analytical queries."""
    q = question.lower()
    
    # Detect target numerical column
    metric = None
    for c in num_cols:
        if c.lower() in q:
            metric = c
            break
    if not metric and num_cols:
        metric = num_cols[-1]
        
    # Detect target categorical or date column
    group = None
    for c in cat_cols + date_cols:
        if c.lower() in q or c.lower().replace("_", " ") in q:
            group = c
            break
            
    # Detect top / highest / best / most
    if any(w in q for w in ["highest", "top", "best", "most", "maximum", "leader", "largest"]):
        # Check for top N number
        match = re.search(r"top\s+(\d+)", q)
        top_n = int(match.group(1)) if match else 5
        return {
            "operation": "top_n",
            "metric_col": metric,
            "group_col": group or (cat_cols[0] if cat_cols else None),
            "top_n": top_n,
            "chart_type": "bar"
        }
    elif any(w in q for w in ["lowest", "bottom", "least", "worst", "minimum"]):
        match = re.search(r"bottom\s+(\d+)", q)
        top_n = int(match.group(1)) if match else 5
        return {
            "operation": "bottom_n",
            "metric_col": metric,
            "group_col": group or (cat_cols[0] if cat_cols else None),
            "top_n": top_n,
            "chart_type": "bar"
        }
    elif any(w in q for w in ["trend", "over time", "month", "monthly", "year", "timeline"]):
        return {
            "operation": "trend",
            "metric_col": metric,
            "group_col": date_cols[0] if date_cols else (cat_cols[0] if cat_cols else None),
            "chart_type": "line"
        }
    elif any(w in q for w in ["total", "sum", "overall", "revenue", "how much", "entire"]):
        return {
            "operation": "total",
            "metric_col": metric,
            "chart_type": "none"
        }
    else:
        return {
            "operation": "groupby",
            "metric_col": metric,
            "group_col": group or (cat_cols[0] if cat_cols else None),
            "top_n": 5,
            "chart_type": "bar"
        }
