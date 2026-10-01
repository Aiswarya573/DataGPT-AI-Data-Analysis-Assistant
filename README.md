# DataGPT – AI-Powered Data Analysis Assistant

[![Python Version](https://img.shields.io/badge/python-3.10%20%7C%203.11+-blue.svg)](https://www.python.org/)
[![Streamlit App](https://static.streamlit.io/badges/streamlit_badge_black_white.svg)](https://streamlit.io/)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

**DataGPT** is a production-quality, conversational AI Data Analyst web application. It transforms raw CSV and Excel datasets into interactive intelligence through automated profiling, data quality auditing, natural language conversational querying, dynamic Plotly visualizations, safe analytical SQL execution, and data-grounded business recommendations.

---

##  Problem Statement

Data analysis in modern organizations remains bottlenecked:
1. **Spreadsheet Overload:** Business users struggle to quickly diagnose anomalies, compute cross-dimensional aggregations, or write complex formulas across thousands of rows.
2. **Hallucination Risk in LLMs:** Directly asking raw LLMs for numerical aggregates (e.g., "What was total Q3 revenue?") often results in convincing but fabricated numbers.
3. **Data Quality Blindspots:** Missing entries, duplicate rows, and undetected statistical outliers contaminate executive decision-making.
4. **Technical Barriers:** Non-technical stakeholders cannot write SQL queries or Pandas commands to slice and dice datasets.

---

##  Solution

DataGPT solves this through a **Hybrid AI + Local Computational Engine**:
- **Zero Hallucination Guarantee:** The AI model is strictly used to parse natural language intent. The actual mathematical aggregations are executed locally in verified Pandas and SQLite engines.
- **Automated Profiling & Quality Scoring:** Instant calculation of a 0–100 Data Quality Score with IQR and Z-Score outlier detection.
- **Transparent Calculations:** Every numerical response comes paired with a plain-English explanation of exactly how the answer was computed.
- **Self-Serve Visualizations:** Dynamic Plotly interactive charts with hover details, zoom, and download capabilities.

---

##  Key Features

| Feature | Description |
| :--- | :--- |
| ** Smart File Ingestion** | Upload `.csv`, `.xlsx`, or `.xls` up to 50MB with instant type classification (numerical, categorical, date). |
| ** Data Quality Audit** | Detects missing values, duplicates, constant columns, and computes a comprehensive Data Quality Score (0–100). |
| ** Ask Data (Conversational AI)** | Multi-turn chat interface with memory, suggested prompts, transparent calculation steps, and Plotly charts. |
| ** Data Analyst Mode** | One-click automated deep-dive revealing top performers, temporal trends, anomalies, and findings vs. recommendations. |
| ** Explore Data** | Point-and-click slicing and dicing (columns, aggregations, group-by, custom query filters) with instant export. |
| ** SQL Detective** | Natural language to SQL translation with an in-memory SQLite sandbox restricted to safe, read-only analytical queries. |
| ** Statistical Anomaly Detector** | Interquartile Range (1.5x IQR) and Z-Score (>3.0) outlier detection with sample inspection. |
| ** Non-Destructive Cleaning** | Generates cleaned copies (duplicate removal, intelligent median/mode imputation) without mutating source data. |

---

##  Technology Stack & Architecture

- **Frontend & Orchestration:** Streamlit (Python)
- **Data Engineering:** Pandas & NumPy
- **Visualizations:** Plotly (Plotly Express & Graph Objects)
- **SQL Execution:** SQLite in-memory engine with AST safety validation
- **AI Intelligence:** Google GenAI Gemini API (`gemini-3.8-flash`)

### Workflow Architecture

```
User Query ──► [LLM Intent Interpreter] ──► Generate Pandas / SQLite Query
                                                   │
                                                   ▼
Human Answer ◄── [LLM Synthesis] ◄── [Local Computation Result]
                                                   │
                                                   ▼
                                        [Interactive Plotly Chart]
```

---

##  Quickstart & Local Installation

### 1. Clone the repository
```bash
git clone https://github.com/your-username/DataGPT.git
cd DataGPT
```

### 2. Create and activate a virtual environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```
Add your Gemini API key (or configure Streamlit secrets):
```env
AI_API_KEY="your_actual_gemini_api_key"
```

### 5. Launch the application
```bash
streamlit run app.py
```
Open [http://localhost:8501](http://localhost:8501) in your browser.

---

##  Deployment on Streamlit Community Cloud

1. Push your repository to **GitHub**.
2. Visit [share.streamlit.io](https://share.streamlit.io) and log in.
3. Click **"New App"** and select your repository, branch (`main`), and entrypoint file (`app.py`).
4. In **Advanced Settings > Secrets**, configure:
   ```toml
   AI_API_KEY = "your_gemini_api_key_here"
   ```
5. Click **Deploy**!

---

##  Security & Guardrails

- **Zero Arbitrary Code Execution:** The LLM does NOT execute arbitrary Python strings (`exec` / `eval` are banned).
- **SQL Injection Prevention:** SQL queries are sanitized to strictly permit `SELECT` and `WITH` statements, rejecting destructive keywords (`DROP`, `DELETE`, `UPDATE`, `ALTER`, `TRUNCATE`).
- **Secret Isolation:** API keys are never exposed in client bundles or public endpoints.

---

##  Future Improvements

- Automated PDF / Executive PowerPoint report exporter.
- Multi-table relational joins across multiple uploaded files.
- Predictive machine learning forecasting models (ARIMA / Prophet integration).
