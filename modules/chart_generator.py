"""
Chart generator module for DataGPT.
Generates responsive, publication-quality Plotly figures with hover data, titles, and layout formatting.
"""

from typing import Optional
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

# Consistent modern theme styling
THEME_TEMPLATE = "plotly_white"
COLOR_SEQUENCE = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"]

def generate_bar_chart(
    df: pd.DataFrame,
    x: str,
    y: str,
    title: str = "Bar Chart Comparison",
    orientation: str = "v",
    top_n: Optional[int] = 15
) -> go.Figure:
    """Generate interactive Bar Chart."""
    plot_df = df.copy()
    if top_n and len(plot_df) > top_n:
        plot_df = plot_df.head(top_n)
        
    fig = px.bar(
        plot_df,
        x=x,
        y=y,
        title=title,
        orientation=orientation,
        color_discrete_sequence=COLOR_SEQUENCE,
        template=THEME_TEMPLATE,
        text_auto=".2s"
    )
    fig.update_layout(
        title_font=dict(size=16, family="sans-serif"),
        xaxis_title=x.replace("_", " ").title(),
        yaxis_title=y.replace("_", " ").title(),
        hoverlabel=dict(bgcolor="white", font_size=13),
        margin=dict(l=40, r=40, t=60, b=40)
    )
    return fig

def generate_line_chart(
    df: pd.DataFrame,
    x: str,
    y: str,
    title: str = "Trend Analysis Over Time",
    color: Optional[str] = None
) -> go.Figure:
    """Generate interactive Line Chart with markers."""
    fig = px.line(
        df,
        x=x,
        y=y,
        color=color,
        title=title,
        markers=True,
        color_discrete_sequence=COLOR_SEQUENCE,
        template=THEME_TEMPLATE
    )
    fig.update_layout(
        title_font=dict(size=16, family="sans-serif"),
        xaxis_title=x.replace("_", " ").title(),
        yaxis_title=y.replace("_", " ").title(),
        hovermode="x unified",
        margin=dict(l=40, r=40, t=60, b=40)
    )
    return fig

def generate_scatter_chart(
    df: pd.DataFrame,
    x: str,
    y: str,
    title: str = "Scatter Plot Correlation",
    color: Optional[str] = None,
    size: Optional[str] = None,
    hover_name: Optional[str] = None
) -> go.Figure:
    """Generate interactive Scatter Plot."""
    fig = px.scatter(
        df,
        x=x,
        y=y,
        color=color,
        size=size,
        hover_name=hover_name,
        title=title,
        color_discrete_sequence=COLOR_SEQUENCE,
        template=THEME_TEMPLATE
    )
    fig.update_layout(
        title_font=dict(size=16, family="sans-serif"),
        xaxis_title=x.replace("_", " ").title(),
        yaxis_title=y.replace("_", " ").title(),
        margin=dict(l=40, r=40, t=60, b=40)
    )
    return fig

def generate_pie_chart(
    df: pd.DataFrame,
    names: str,
    values: str,
    title: str = "Category Proportion Breakdown",
    hole: float = 0.4
) -> go.Figure:
    """Generate interactive Donut / Pie Chart."""
    fig = px.pie(
        df,
        names=names,
        values=values,
        title=title,
        hole=hole,
        color_discrete_sequence=COLOR_SEQUENCE,
        template=THEME_TEMPLATE
    )
    fig.update_traces(textposition='inside', textinfo='percent+label')
    fig.update_layout(
        title_font=dict(size=16, family="sans-serif"),
        margin=dict(l=40, r=40, t=60, b=40)
    )
    return fig

def generate_histogram(
    df: pd.DataFrame,
    x: str,
    title: str = "Distribution Histogram",
    nbins: int = 30
) -> go.Figure:
    """Generate interactive Histogram."""
    fig = px.histogram(
        df,
        x=x,
        title=title,
        nbins=nbins,
        color_discrete_sequence=COLOR_SEQUENCE,
        template=THEME_TEMPLATE,
        marginal="box"
    )
    fig.update_layout(
        title_font=dict(size=16, family="sans-serif"),
        xaxis_title=x.replace("_", " ").title(),
        yaxis_title="Frequency",
        margin=dict(l=40, r=40, t=60, b=40)
    )
    return fig
