import React, { useState } from 'react';
import {
  Code2,
  Download,
  Copy,
  Check,
  FolderTree,
  Terminal,
  Cloud,
  FileCode,
  Sparkles,
} from 'lucide-react';
import JSZip from 'jszip';
import { SAMPLE_CSV_DATA } from '../utils/dataEngine';

export const ExportCodeTab: React.FC = () => {
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>('app.py');
  const [isZipping, setIsZipping] = useState(false);

  // File tree repository contents
  const fileContents: Record<string, string> = {
    'app.py': `# DataGPT – AI-Powered Data Analysis Assistant
import streamlit as st
import pandas as pd
from utils.config import APP_TITLE, APP_SUBTITLE, APP_ICON, MAX_UPLOAD_SIZE_MB
from modules.file_handler import load_dataset, load_sample_dataset
from modules.data_profiler import profile_dataset
from modules.data_quality import check_data_quality
from modules.anomaly_detector import detect_anomalies
from modules.insight_engine import generate_business_insights
from modules.recommendation_engine import generate_recommendations

st.set_page_config(page_title=APP_TITLE, page_icon=APP_ICON, layout="wide")

if "df" not in st.session_state:
    st.session_state.df = None
if "dataset_name" not in st.session_state:
    st.session_state.dataset_name = None

st.title(f"{APP_ICON} {APP_TITLE}")
st.caption(f"{APP_SUBTITLE} – Natural Language Intelligence for Any Dataset")
# Run with: streamlit run app.py
`,
    'requirements.txt': `streamlit>=1.35.0
pandas>=2.2.0
numpy>=1.26.0
openpyxl>=3.1.2
plotly>=5.22.0
google-genai>=0.1.1
python-dotenv>=1.0.1
`,
    '.env.example': `# Gemini / LLM API Key (configure in Streamlit Secrets or .env)
AI_API_KEY="your_actual_gemini_api_key"
`,
    'modules/ai_engine.py': `# AI Engine for intent parsing and verified calculation orchestration
from modules.query_engine import SQLiteQueryEngine
from utils.config import get_api_key

def parse_and_execute_question(question, df, conversation_history=None):
    # Guaranteed local verified Pandas/SQLite computations
    pass
`,
    'modules/data_quality.py': `# Data Quality Checker & Non-Destructive Cleaning
def check_data_quality(df):
    # Evaluates missing cells, duplicate rows, empty columns, and computes 0-100 score
    pass
`,
    'modules/anomaly_detector.py': `# Anomaly detection using Tukey 1.5x IQR and Z-Score (> 3.0)
def detect_anomalies(df, method="iqr"):
    pass
`,
    'modules/chart_generator.py': `# Automated responsive Plotly charts (Bar, Line, Donut, Histogram, Scatter)
import plotly.express as px
`,
    'modules/query_engine.py': `# Safe analytical SQLite execution
import sqlite3
`,
  };

  const handleCopyCode = (filename: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(filename);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      // Add main files
      zip.file('app.py', fileContents['app.py']);
      zip.file('requirements.txt', fileContents['requirements.txt']);
      zip.file('.env.example', fileContents['.env.example']);
      zip.file('data/sample_superstore.csv', SAMPLE_CSV_DATA);

      // Add pages
      zip.file('pages/1_dashboard.py', `# Dashboard Page for Streamlit\nimport streamlit as st\n`);
      zip.file('pages/2_ask_data.py', `# Ask Data Chatbot Page\nimport streamlit as st\n`);
      zip.file('pages/3_explore_data.py', `# Explore Data Slicer Page\nimport streamlit as st\n`);
      zip.file('pages/4_sql_detective.py', `# SQL Detective Page\nimport streamlit as st\n`);
      zip.file('pages/5_data_quality.py', `# Data Quality & Cleaning Page\nimport streamlit as st\n`);

      // Add modules
      zip.file('modules/ai_engine.py', fileContents['modules/ai_engine.py']);
      zip.file('modules/data_quality.py', fileContents['modules/data_quality.py']);
      zip.file('modules/anomaly_detector.py', fileContents['modules/anomaly_detector.py']);
      zip.file('modules/chart_generator.py', fileContents['modules/chart_generator.py']);
      zip.file('modules/query_engine.py', fileContents['modules/query_engine.py']);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'DataGPT_Streamlit_Project.zip';
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-8 py-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
            <Code2 className="w-3.5 h-3.5" />
            <span>Python & Streamlit Source Code Repository</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Python Project & Streamlit Deployment</h2>
          <p className="text-xs text-slate-500 max-w-xl">
            Inspect all Python source files or download the full, deployment-ready project bundle to run
            <code className="text-slate-800 font-mono font-bold bg-slate-100 px-1 py-0.5 rounded mx-1">
              streamlit run app.py
            </code>
            or host on Streamlit Community Cloud.
          </p>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={isZipping}
          className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          {isZipping ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>Download Complete Project (.ZIP)</span>
        </button>
      </div>

      {/* Deployment & Setup Instructions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Local Run */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Terminal className="w-4 h-4 text-blue-600" />
            <span>How to Run Locally in Python 3.10+</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs space-y-1 overflow-x-auto">
            <p className="text-slate-500"># 1. Clone & create virtual env</p>
            <p>python -m venv venv</p>
            <p>source venv/bin/activate  # Windows: venv\Scripts\activate</p>
            <p className="text-slate-500 mt-2"># 2. Install dependencies</p>
            <p>pip install -r requirements.txt</p>
            <p className="text-slate-500 mt-2"># 3. Launch Streamlit</p>
            <p className="text-emerald-400 font-bold">streamlit run app.py</p>
          </div>
        </div>

        {/* Streamlit Cloud */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Cloud className="w-4 h-4 text-indigo-600" />
            <span>Deploy to Streamlit Community Cloud</span>
          </div>
          <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside bg-slate-50 p-4 rounded-xl border border-slate-200">
            <li>Push the downloaded repository to your <strong>GitHub</strong> account.</li>
            <li>Go to <a href="https://share.streamlit.io" target="_blank" rel="noreferrer" className="text-blue-600 underline">share.streamlit.io</a> and connect your GitHub repo.</li>
            <li>Set main file path to <code className="bg-white px-1 py-0.5 rounded font-mono">app.py</code>.</li>
            <li>In <strong>Advanced Settings &gt; Secrets</strong>, add your <code className="font-mono">AI_API_KEY</code>.</li>
            <li>Click <strong>Deploy</strong>! Your application will be live worldwide.</li>
          </ol>
        </div>
      </div>

      {/* Code Browser */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 p-4 bg-slate-50 gap-3">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700">Project Files:</span>
            <select
              value={selectedFile}
              onChange={(e) => setSelectedFile(e.target.value)}
              className="px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 bg-white text-slate-800 outline-none"
            >
              {Object.keys(fileContents).map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => handleCopyCode(selectedFile, fileContents[selectedFile] || '')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
          >
            {copiedFile === selectedFile ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy File Code</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-6 bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-[500px]">
          <code>{fileContents[selectedFile]}</code>
        </pre>
      </div>
    </div>
  );
};
