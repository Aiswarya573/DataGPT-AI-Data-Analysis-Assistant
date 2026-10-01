import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  FileUp,
  Table,
  CheckCircle,
  AlertCircle,
  Hash,
  Type,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { DatasetState } from '../types/dataset';
import { parseFile } from '../utils/dataEngine';
import { TabKey } from './Navbar';

interface UploadTabProps {
  dataset: DatasetState | null;
  setDataset: (dataset: DatasetState) => void;
  setActiveTab: (tab: TabKey) => void;
  onLoadSample: () => void;
}

export const UploadTab: React.FC<UploadTabProps> = ({
  dataset,
  setDataset,
  setActiveTab,
  onLoadSample,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'table' | 'columns' | 'stats'>('table');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const parsed = await parseFile(file);
      setDataset(parsed);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to read dataset file.');
    } finally {
      setIsLoading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-8 py-6 max-w-7xl mx-auto">
      {/* Upload Zone Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileUp className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Upload Dataset for AI Profiling</h2>
          <p className="text-sm text-slate-600">
            Upload your CSV, Excel (XLSX, XLS) file. All data profiling and calculations are processed locally
            with verified mathematical accuracy.
          </p>

          {/* Drag & Drop Area */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-300 hover:border-blue-400 bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <FileSpreadsheet className="w-10 h-10 text-slate-400" />
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Click to browse or drag and drop file here
              </p>
              <p className="text-xs text-slate-500">Supports .CSV, .XLSX, and .XLS files (up to 50MB)</p>
            </div>
            {isLoading && (
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
                <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>Reading and profiling dataset...</span>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700 flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Demo Dataset Button */}
          <div className="pt-2 flex items-center justify-center gap-2">
            <span className="text-xs text-slate-400">Need instant test data?</span>
            <button
              onClick={onLoadSample}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline underline-offset-2 cursor-pointer"
            >
              Load Superstore Sample Dataset (with intentional QA anomalies)
            </button>
          </div>
        </div>
      </div>

      {/* Dataset Overview & Preview Section */}
      {dataset && (
        <div className="space-y-6">
          {/* Metrics summary banner */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Total Records</span>
              <div className="text-2xl font-black text-slate-900">{dataset.rawRows.length.toLocaleString()}</div>
              <span className="text-[11px] text-slate-400">Rows in file</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Total Columns</span>
              <div className="text-2xl font-black text-slate-900">{dataset.columns.length}</div>
              <span className="text-[11px] text-slate-400">Dimensions & metrics</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block mb-1 flex items-center gap-1">
                <Hash className="w-3 h-3 text-blue-600" />
                Numerical Columns
              </span>
              <div className="text-2xl font-black text-blue-600">{dataset.numericalColumns.length}</div>
              <span className="text-[11px] text-slate-400">Aggregatable</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block mb-1 flex items-center gap-1">
                <Type className="w-3 h-3 text-emerald-600" />
                Categorical Columns
              </span>
              <div className="text-2xl font-black text-emerald-600">{dataset.categoricalColumns.length}</div>
              <span className="text-[11px] text-slate-400">Dimensions & labels</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-600" />
                Date Columns
              </span>
              <div className="text-2xl font-black text-amber-600">{dataset.dateColumns.length}</div>
              <span className="text-[11px] text-slate-400">Timelines & trends</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between bg-blue-50/60 border border-blue-200 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <div>
                <span className="text-sm font-bold text-slate-900">Dataset Ready: {dataset.name}</span>
                <p className="text-xs text-slate-600">
                  Data Quality Score: <strong className="text-blue-700">{dataset.qualityReport.score}/100</strong>.
                  Explore the dashboard or chat with your data.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <span>View Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Tabs for Table View, Column Schema, and Statistical Summary */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="flex items-center border-b border-slate-200 px-6 pt-4 gap-4">
              <button
                onClick={() => setPreviewTab('table')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                  previewTab === 'table'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Data Table Preview (First 15 Rows)
              </button>
              <button
                onClick={() => setPreviewTab('columns')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                  previewTab === 'columns'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Column Schema & Null Audit
              </button>
              <button
                onClick={() => setPreviewTab('stats')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                  previewTab === 'stats'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Numerical Statistical Summary
              </button>
            </div>

            <div className="p-6">
              {previewTab === 'table' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/75">
                        <th className="py-2.5 px-3 font-semibold text-slate-500">#</th>
                        {dataset.columns.map((c) => (
                          <th key={c} className="py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dataset.rawRows.slice(0, 15).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          {dataset.columns.map((c) => {
                            const val = row[c];
                            const isNull = val === null || val === undefined || val === '';
                            return (
                              <td
                                key={c}
                                className={`py-2.5 px-3 whitespace-nowrap ${
                                  isNull ? 'text-rose-400 italic bg-rose-50/30' : 'text-slate-800'
                                }`}
                              >
                                {isNull ? 'null' : String(val)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-xs text-slate-400 mt-4">
                    Showing first 15 of {dataset.rawRows.length.toLocaleString()} rows.
                  </p>
                </div>
              )}

              {previewTab === 'columns' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="py-3 px-4 font-semibold text-slate-700">Column Name</th>
                        <th className="py-3 px-4 font-semibold text-slate-700">Classification</th>
                        <th className="py-3 px-4 font-semibold text-slate-700">Null Count</th>
                        <th className="py-3 px-4 font-semibold text-slate-700">Null %</th>
                        <th className="py-3 px-4 font-semibold text-slate-700">Unique Values</th>
                        <th className="py-3 px-4 font-semibold text-slate-700">Sample Values</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dataset.columnMeta.map((cm) => (
                        <tr key={cm.name} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 font-semibold text-slate-900">{cm.name}</td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                                cm.type === 'numerical'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : cm.type === 'date'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {cm.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-4">
                            {cm.nullCount > 0 ? (
                              <span className="text-rose-600 font-semibold">{cm.nullCount}</span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            {cm.nullPercentage > 0 ? (
                              <span className="text-rose-600 font-medium">
                                {cm.nullPercentage.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-slate-400">0%</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-slate-700">{cm.uniqueCount}</td>
                          <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px] truncate max-w-xs">
                            {cm.sampleValues.join(', ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {previewTab === 'stats' && (
                <div className="overflow-x-auto">
                  {Object.keys(dataset.numericalStats).length > 0 ? (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="py-3 px-4 font-semibold text-slate-700">Column</th>
                          <th className="py-3 px-4 font-semibold text-slate-700">Count</th>
                          <th className="py-3 px-4 font-semibold text-slate-700">Sum</th>
                          <th className="py-3 px-4 font-semibold text-slate-700">Mean</th>
                          <th className="py-3 px-4 font-semibold text-slate-700">Median</th>
                          <th className="py-3 px-4 font-semibold text-slate-700">Min</th>
                          <th className="py-3 px-4 font-semibold text-slate-700">Max</th>
                          <th className="py-3 px-4 font-semibold text-slate-700">Std Dev</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {Object.entries(dataset.numericalStats).map(([col, st]) => (
                          <tr key={col} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-4 font-semibold text-slate-900">{col}</td>
                            <td className="py-2.5 px-4 text-slate-700">{st.count.toLocaleString()}</td>
                            <td className="py-2.5 px-4 font-semibold text-blue-700">
                              {st.sum.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-4 text-slate-700">
                              {st.mean.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-4 text-slate-700">
                              {st.median.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-4 text-slate-700">
                              {st.min.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-4 text-slate-700">
                              {st.max.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-4 text-slate-500">
                              {st.std.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-sm text-slate-500">No numerical columns detected in dataset.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
