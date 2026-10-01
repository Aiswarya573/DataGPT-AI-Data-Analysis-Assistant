"""
Query Engine module for DataGPT.
Executes safe, verified analytical queries using SQLite and Pandas.
Enforces strict read-only execution to prevent harmful mutations.
"""

import sqlite3
import time
from typing import Any, Dict, Optional, Tuple
import pandas as pd
from utils.helpers import sanitize_sql_query

class SQLiteQueryEngine:
    def __init__(self, df: pd.DataFrame, table_name: str = "dataset"):
        self.df = df
        self.table_name = table_name
        self.conn = sqlite3.connect(":memory:", check_same_thread=False)
        self._load_table()
        
    def _load_table(self):
        """Write the dataframe into the in-memory SQLite instance."""
        # Clean column names for SQL safety (replace spaces with underscores if needed, or keep enclosed)
        clean_df = self.df.copy()
        clean_df.columns = [c.strip().replace(" ", "_") for c in clean_df.columns]
        clean_df.to_sql(self.table_name, self.conn, if_exists="replace", index=False)
        
    def get_schema(self) -> Dict[str, str]:
        """Return the SQLite table schema."""
        cursor = self.conn.cursor()
        cursor.execute(f"PRAGMA table_info({self.table_name});")
        rows = cursor.fetchall()
        # row: (cid, name, type, notnull, dflt_value, pk)
        return {r[1]: r[2] for r in rows}
        
    def execute_query(self, query: str, limit: int = 500) -> Tuple[Optional[pd.DataFrame], Optional[str], float]:
        """
        Safely execute a read-only SQL query against the dataset.
        Returns (result_df, error_msg, execution_time_sec).
        """
        start_time = time.time()
        
        # 1. Security Check
        if not sanitize_sql_query(query):
            return None, "Security Violation: Only read-only analytical queries (SELECT / WITH) are allowed.", 0.0
            
        try:
            # Enforce limit if not already limited
            stripped = query.strip().rstrip(";")
            if "LIMIT" not in stripped.upper():
                stripped = f"{stripped} LIMIT {limit}"
                
            res_df = pd.read_sql_query(stripped, self.conn)
            elapsed = time.time() - start_time
            return res_df, None, elapsed
        except Exception as e:
            elapsed = time.time() - start_time
            return None, f"SQL Execution Error: {str(e)}", elapsed

def compute_aggregation(
    df: pd.DataFrame,
    target_col: str,
    group_col: Optional[str] = None,
    agg_func: str = "sum",
    filter_expr: Optional[str] = None
) -> Tuple[Optional[pd.DataFrame], Optional[str]]:
    """
    Direct Pandas exploration engine for Explore Data mode.
    """
    try:
        working_df = df.copy()
        
        # Apply filter if provided
        if filter_expr and filter_expr.strip():
            working_df = working_df.query(filter_expr)
            
        if working_df.empty:
            return pd.DataFrame(), "No data matches the selected filter."
            
        if group_col and group_col in working_df.columns:
            if agg_func.lower() == "sum":
                res = working_df.groupby(group_col)[target_col].sum().reset_index()
            elif agg_func.lower() in ["mean", "average"]:
                res = working_df.groupby(group_col)[target_col].mean().reset_index()
            elif agg_func.lower() == "count":
                res = working_df.groupby(group_col)[target_col].count().reset_index()
            elif agg_func.lower() == "min":
                res = working_df.groupby(group_col)[target_col].min().reset_index()
            elif agg_func.lower() == "max":
                res = working_df.groupby(group_col)[target_col].max().reset_index()
            else:
                return None, f"Unsupported aggregation function: {agg_func}"
                
            # Sort descending by target_col
            res = res.sort_values(by=target_col, ascending=False)
            return res, None
        else:
            # Single scalar aggregation
            series = working_df[target_col]
            if agg_func.lower() == "sum":
                val = series.sum()
            elif agg_func.lower() in ["mean", "average"]:
                val = series.mean()
            elif agg_func.lower() == "count":
                val = series.count()
            elif agg_func.lower() == "min":
                val = series.min()
            elif agg_func.lower() == "max":
                val = series.max()
            else:
                return None, f"Unsupported aggregation function: {agg_func}"
            return pd.DataFrame([{"Metric": f"{agg_func.upper()} of {target_col}", "Value": val}]), None
    except Exception as e:
        return None, f"Aggregation error: {str(e)}"
