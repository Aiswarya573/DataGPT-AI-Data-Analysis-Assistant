import React from 'react';
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  FileUp,
  Flame,
  Layers,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { DatasetState } from '../types/dataset';
import { TabKey } from './Navbar';

interface HomeTabProps {
  dataset: DatasetState | null;
  setActiveTab: (tab: TabKey) => void;
  onLoadSample: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({ dataset, setActiveTab, onLoadSample }) => {
  return (
    <div className="space-y-10 py-6 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white p-8 md:p-12 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-semibold text-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>AI Data Analyst Engine • Zero-Hallucination Local Computation</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Meet DataGPT, your autonomous AI Data Analyst.
          </h1>

          <p className="text-base md:text-lg text-slate-300 leading-relaxed">
            Upload any CSV or Excel dataset and instantly explore data quality scores, ask natural-language
            questions with verified mathematical computation, render dynamic Plotly visualizations, inspect
            statistical anomalies, and generate executive recommendations.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-3">
            {dataset ? (
              <button
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                <span>Open Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                >
                  <FileUp className="w-4 h-4" />
                  <span>Upload Dataset</span>
                </button>
                <button
                  onClick={onLoadSample}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-white font-semibold border border-slate-700 transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Try Superstore Sample Dataset</span>
                </button>
              </>
            )}
            <button
              onClick={() => setActiveTab('ask')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold border border-white/20 transition-all cursor-pointer"
            >
              <Bot className="w-4 h-4 text-sky-400" />
              <span>Ask Data Mode</span>
            </button>
          </div>
        </div>

        {/* Current Dataset Overview Mini-Card */}
        {dataset && (
          <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-slate-300">
            <div>
              <span className="text-xs text-slate-400 block">Loaded Dataset</span>
              <span className="font-bold text-white truncate block">{dataset.name}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Records</span>
              <span className="font-bold text-white">{dataset.rawRows.length.toLocaleString()} rows</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Quality Score</span>
              <span className="font-bold text-emerald-400">{dataset.qualityReport.score} / 100</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Columns</span>
              <span className="font-bold text-white">{dataset.columns.length} dimensions</span>
            </div>
          </div>
        )}
      </div>

      {/* Verified Computational Architecture Callout */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Reliability First Principle
            </span>
            <h3 className="text-xl font-bold text-slate-900">
              Why DataGPT Never Hallucinates Mathematical Numbers
            </h3>
            <p className="text-sm text-slate-600">
              Generic chatbots guess arithmetic, causing fatal errors in business decisions. DataGPT uses
              LLMs strictly to interpret user intent; all calculations are executed directly on your dataset
              via local verified engines (Pandas & SQLite), and results are paired with transparent calculation steps.
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex-1 max-w-md font-mono text-xs text-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-blue-600 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Verified Execution Pipeline</span>
            </div>
            <div className="p-2 bg-slate-50 rounded border border-slate-200 text-slate-600">
              1. Natural Question ➔ LLM Intent Parsing
            </div>
            <div className="p-2 bg-blue-50/50 rounded border border-blue-200 text-blue-900">
              2. Local Engine Execution ➔ Exact Pandas/SQL Math
            </div>
            <div className="p-2 bg-emerald-50/50 rounded border border-emerald-200 text-emerald-900">
              3. Human Explanation + Dynamic Plotly Chart Spec
            </div>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Core Data Analyst Capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            onClick={() => setActiveTab('upload')}
            className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <FileUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Automated Ingestion & Profiling</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Drag-and-drop CSV, XLSX, and XLS files up to 50MB. Automatic data type classification,
              frequency distributions, date bounds, and statistical profiles.
            </p>
          </div>

          <div
            onClick={() => setActiveTab('quality')}
            className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Data Quality Score & Audits</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Instant 0–100 Data Quality Score. Detects missing cells, duplicate rows, constant columns,
              and flags statistical outliers using 1.5x IQR and Z-scores.
            </p>
          </div>

          <div
            onClick={() => setActiveTab('ask')}
            className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-sky-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Conversational AI Analyst</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Ask natural questions like &quot;Which product generated top sales in March?&quot;. Multi-turn memory
              with transparent calculation explanations and auto Plotly charts.
            </p>
          </div>

          <div
            onClick={() => setActiveTab('explore')}
            className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Self-Serve Data Explorer</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Point-and-click slicing, dicing, custom group-bys, aggregations (Sum, Mean, Count, Min, Max),
              filters, and custom visual chart types with instant CSV download.
            </p>
          </div>

          <div
            onClick={() => setActiveTab('sql')}
            className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">SQL Detective Sandbox</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Convert plain English into SQL queries against an in-memory SQLite table. Protected by strict
              safety filters disallowing destructive commands (DROP, DELETE, UPDATE).
            </p>
          </div>

          <div
            onClick={() => setActiveTab('insights')}
            className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-rose-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Automated Business Deep-Dive</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              1-click &quot;Analyze My Data&quot; mode: synthesizes executive summaries, top performer rankings,
              anomalies, and strategic recommendations strictly separated from factual findings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
