import React, { useState } from 'react';
import {
  Database,
  Play,
  Download,
  AlertOctagon,
  Sparkles,
  Table,
  CheckCircle,
  Clock,
  Terminal,
} from 'lucide-react';
import { DatasetState } from '../types/dataset';

interface SqlDetectiveTabProps {
  dataset: DatasetState | null;
  onLoadSample: () => void;
}

export const SqlDetectiveTab: React.FC<SqlDetectiveTabProps> = ({ dataset, onLoadSample }) => {
  const [nlPrompt, setNlPrompt] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM dataset LIMIT 10;');
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queryResult, setQueryResult] = useState<{
    columns: string[];
    rows: any[];
    count: number;
    executionTimeMs: number;
  } | null>(null);

  if (!dataset) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 max-w-xl mx-auto my-12 space-y-4">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
          <Database className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Upload Dataset for SQL Investigation</h3>
        <p className="text-sm text-slate-600">
          Upload your data to run analytical SQLite queries or translate plain English into optimized SQL.
        </p>
        <button
          onClick={onLoadSample}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all cursor-pointer"
        >
          Load Superstore Sample Dataset
        </button>
      </div>
    );
  }

  // Quick NL translation to SQL
  const handleTranslateNLtoSQL = async () => {
    if (!nlPrompt.trim()) return;
    setIsTranslating(true);
    setQueryError(null);

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: `Generate a safe SQLite query for table 'dataset' with columns ${JSON.stringify(
            dataset.columns
          )} for question: "${nlPrompt}". Return ONLY the raw SQL SELECT query.`,
          columns: dataset.columns,
          numericalColumns: dataset.numericalColumns,
          categoricalColumns: dataset.categoricalColumns,
          dateColumns: dataset.dateColumns,
        }),
      });

      if (resp.ok) {
        const json = await resp.json();
        if (json.intent?.sql_query) {
          setSqlQuery(json.intent.sql_query);
        } else {
          // Fallback SQL template
          const num = dataset.numericalColumns[dataset.numericalColumns.length - 1] || 'Sales';
          const cat = dataset.categoricalColumns[0] || 'Category';
          setSqlQuery(
            `SELECT "${cat}", SUM(CAST("${num}" AS REAL)) AS total_${num.toLowerCase()}\nFROM dataset\nGROUP BY "${cat}"\nORDER BY total_${num.toLowerCase()} DESC\nLIMIT 5;`
          );
        }
      }
    } catch {
      // local fallback
      const num = dataset.numericalColumns[dataset.numericalColumns.length - 1] || 'Sales';
      const cat = dataset.categoricalColumns[0] || 'Category';
      setSqlQuery(
        `SELECT "${cat}", SUM(CAST("${num}" AS REAL)) AS total_${num.toLowerCase()}\nFROM dataset\nGROUP BY "${cat}"\nORDER BY total_${num.toLowerCase()} DESC\nLIMIT 5;`
      );
    } finally {
      setIsTranslating(false);
    }
  };

  // Safe Execute Query via backend endpoint
  const handleExecuteSQL = async () => {
    setQueryError(null);
    setIsExecuting(true);

    try {
      const resp = await fetch('/api/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: sqlQuery,
          columns: dataset.columns,
          dataRows: dataset.rawRows,
        }),
      });

      const resJson = await resp.json();

      if (!resp.ok) {
        setQueryError(resJson.error || 'SQL execution failed.');
      } else {
        setQueryResult({
          columns: resJson.columns,
          rows: resJson.rows,
          count: resJson.count,
          executionTimeMs: resJson.executionTimeMs,
        });
      }
    } catch (err: any) {
      setQueryError(err.message || 'Error communicating with SQL execution engine.');
    } finally {
      setIsExecuting(false);
    }
  };

  // Download SQL Result CSV
  const handleDownloadResultCSV = () => {
    if (!queryResult || queryResult.rows.length === 0) return;
    const headers = queryResult.columns.join(',');
    const rows = queryResult.rows.map((r) => Object.values(r).join(',')).join('\n');
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(`${headers}\n${rows}`);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', 'sql_detective_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 py-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">SQL Detective – Analytical SQLite Sandbox</h2>
              <p className="text-xs text-slate-500">
                Execute safe, read-only SQL queries against in-memory table <code className="text-amber-700 font-semibold bg-amber-50 px-1 py-0.5 rounded">dataset</code>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700">
            <Terminal className="w-4 h-4 text-slate-500" />
            <span>SQLite 3.x Sandbox</span>
          </div>
        </div>
      </div>

      {/* Natural Language to SQL Assistant Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Ask in Plain English ➔ Auto-Generate SQL</span>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={nlPrompt}
            onChange={(e) => setNlPrompt(e.target.value)}
            placeholder="e.g., 'Show top 5 products by total sales' or 'Find customers with more than 3 orders'..."
            className="w-full sm:flex-1 px-4 py-2.5 text-xs bg-white rounded-xl border border-blue-200 text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500"
          />
          <button
            onClick={handleTranslateNLtoSQL}
            disabled={!nlPrompt.trim() || isTranslating}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            {isTranslating ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Generate SQL</span>
          </button>
        </div>
      </div>

      {/* SQL Editor Area */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">SQL Query Editor</h3>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Read-Only Safe
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Table name: <code className="text-slate-800 font-mono font-bold">dataset</code>
          </span>
        </div>

        <textarea
          value={sqlQuery}
          onChange={(e) => setSqlQuery(e.target.value)}
          rows={5}
          className="w-full p-4 font-mono text-xs rounded-2xl bg-slate-900 text-emerald-400 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {queryError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 shrink-0" />
            <span>{queryError}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="text-[11px] text-slate-400">
            Destructive queries (<code className="text-slate-600">DROP</code>, <code className="text-slate-600">DELETE</code>, <code className="text-slate-600">UPDATE</code>) are strictly forbidden.
          </div>
          <button
            onClick={handleExecuteSQL}
            disabled={isExecuting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
          >
            {isExecuting ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>Run SQL Query</span>
          </button>
        </div>
      </div>

      {/* Query Result View */}
      {queryResult && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="text-sm font-bold text-slate-900">Query Executed Successfully</span>
                <p className="text-xs text-slate-500 flex items-center gap-2">
                  <span>Returned {queryResult.count.toLocaleString()} rows</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {queryResult.executionTimeMs} ms
                  </span>
                </p>
              </div>
            </div>
            {queryResult.count > 0 && (
              <button
                onClick={handleDownloadResultCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto max-h-96 rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 shadow-2xs">
                <tr>
                  <th className="py-2.5 px-3 font-semibold text-slate-500">#</th>
                  {queryResult.columns.map((c) => (
                    <th key={c} className="py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queryResult.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    {queryResult.columns.map((c) => (
                      <td key={c} className="py-2 px-3 whitespace-nowrap text-slate-800">
                        {row[c] !== null && row[c] !== undefined ? String(row[c]) : 'null'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
