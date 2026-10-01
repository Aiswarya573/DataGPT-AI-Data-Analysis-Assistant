import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Copy,
  Zap,
  CheckCircle2,
  Download,
  HelpCircle,
  TrendingDown,
  Info,
} from 'lucide-react';
import { DatasetState } from '../types/dataset';
import { createCleanedDataset, detectOutliers } from '../utils/dataEngine';

interface DataQualityTabProps {
  dataset: DatasetState | null;
  onLoadSample: () => void;
  onUpdateCleanedDataset?: (cleanedRows: Record<string, any>[]) => void;
}

export const DataQualityTab: React.FC<DataQualityTabProps> = ({
  dataset,
  onLoadSample,
  onUpdateCleanedDataset,
}) => {
  const [outlierMethod, setOutlierMethod] = useState<'iqr' | 'zscore'>('iqr');
  const [dropDuplicates, setDropDuplicates] = useState(true);
  const [fillStrategy, setFillStrategy] = useState<'median' | 'drop' | 'none'>('median');
  const [cleanedData, setCleanedData] = useState<Record<string, any>[] | null>(null);

  if (!dataset) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 max-w-xl mx-auto my-12 space-y-4">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Upload Dataset to Run Quality Audit</h3>
        <p className="text-sm text-slate-600">
          Upload your dataset to calculate the Data Quality Score and detect duplicates, missing entries, and
          statistical outliers.
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

  const { qualityReport, numericalColumns, rawRows } = dataset;
  const score = qualityReport.score;
  const scoreColor =
    score >= 80 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
    score >= 60 ? 'text-amber-600 bg-amber-50 border-amber-200' :
    'text-rose-600 bg-rose-50 border-rose-200';

  // Recalculate outliers based on chosen method
  const activeAnomalies = detectOutliers(rawRows, numericalColumns, outlierMethod);

  // Generate cleaned copy
  const handleGenerateCleanedCopy = () => {
    const cleaned = createCleanedDataset(rawRows, {
      dropDuplicates,
      fillMissing: fillStrategy,
      numericalColumns: dataset.numericalColumns,
      categoricalColumns: dataset.categoricalColumns,
      numericalStats: dataset.numericalStats,
      categoricalStats: dataset.categoricalStats,
    });
    setCleanedData(cleaned);
    if (onUpdateCleanedDataset) {
      onUpdateCleanedDataset(cleaned);
    }
  };

  // Download cleaned CSV
  const handleDownloadCleaned = () => {
    if (!cleanedData || cleanedData.length === 0) return;
    const headers = Object.keys(cleanedData[0]).join(',');
    const rows = cleanedData.map((r) => Object.values(r).join(',')).join('\n');
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(`${headers}\n${rows}`);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `cleaned_${dataset.name.replace(/\.[^/.]+$/, '')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 py-6 max-w-7xl mx-auto">
      {/* Score Header Card */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Automated Health & Hygiene Audit</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Data Quality Score & Diagnostics</h2>
          <p className="text-xs text-slate-500 max-w-xl">
            A weighted integrity index based on completeness, uniqueness, empty columns, and outlier density.
            Original data is never automatically overwritten.
          </p>
        </div>

        {/* Score Ring / Badge */}
        <div className={`px-8 py-6 rounded-2xl border text-center ${scoreColor} shadow-xs shrink-0`}>
          <div className="text-4xl font-black tracking-tight">{score} / 100</div>
          <span className="text-xs font-bold uppercase tracking-wider block mt-1">
            {score >= 80 ? 'Excellent Integrity' : score >= 60 ? 'Fair • Needs Cleaning' : 'Critical Action Needed'}
          </span>
        </div>
      </div>

      {/* Metric Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Missing Cells</span>
          <div className="text-2xl font-black text-amber-600">{qualityReport.totalMissingCells}</div>
          <span className="text-[11px] text-slate-400">
            Across {Object.keys(qualityReport.missingByColumn).length} columns
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Duplicate Rows</span>
          <div className="text-2xl font-black text-rose-600">{qualityReport.duplicateRows}</div>
          <span className="text-[11px] text-slate-400">Repeated row records</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Potential Outliers</span>
          <div className="text-2xl font-black text-indigo-600">{activeAnomalies.reduce((a, b) => a + b.count, 0)}</div>
          <span className="text-[11px] text-slate-400">{outlierMethod.toUpperCase()} methodology</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Constant / Empty Columns</span>
          <div className="text-2xl font-black text-slate-700">
            {qualityReport.emptyColumns.length + qualityReport.constantColumns.length}
          </div>
          <span className="text-[11px] text-slate-400">Zero variance columns</span>
        </div>
      </div>

      {/* Suggested Actions & Audits Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Missing Values Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Missing Values Audit</h3>
            <span className="text-xs text-slate-400 font-mono">
              {Object.keys(qualityReport.missingByColumn).length} affected columns
            </span>
          </div>

          {Object.keys(qualityReport.missingByColumn).length > 0 ? (
            <div className="space-y-2.5">
              {Object.entries(qualityReport.missingByColumn).map(([col, count]) => {
                const pct = ((count / rawRows.length) * 100).toFixed(1);
                return (
                  <div key={col} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800">{col}</span>
                      <p className="text-[11px] text-slate-500">
                        {count} null values ({pct}% of rows)
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded">
                      Action: Impute
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-emerald-600 bg-emerald-50/50 rounded-2xl border border-emerald-200 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Zero missing values detected across the entire dataset!</span>
            </div>
          )}
        </div>

        {/* Duplicate Rows Audit */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Duplicate Rows Audit</h3>
            <span className="text-xs text-slate-400 font-mono">
              {qualityReport.duplicateRows} exact duplicates
            </span>
          </div>

          {qualityReport.duplicateRows > 0 ? (
            <div className="space-y-3">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {qualityReport.duplicateRows} Duplicate Transactions Detected
                </span>
                <p className="text-[11px] text-rose-700">
                  Duplicate rows introduce severe risk of double-counting revenues or inflating inventory counts.
                  Use the cleaning recipe below to generate a deduplicated copy.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-emerald-600 bg-emerald-50/50 rounded-2xl border border-emerald-200 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Every row in this dataset is unique. No duplicate records detected.</span>
            </div>
          )}
        </div>
      </div>

      {/* Outlier Detection Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Statistical Anomaly & Outlier Inspector</h3>
            <p className="text-xs text-slate-500">
              Values labeled as &quot;Potential Anomaly&quot; require business confirmation rather than automatic deletion.
            </p>
          </div>

          {/* Outlier Switcher */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setOutlierMethod('iqr')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                outlierMethod === 'iqr' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              1.5x IQR (Tukey)
            </button>
            <button
              onClick={() => setOutlierMethod('zscore')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                outlierMethod === 'zscore' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Z-score (&gt; 3.0 σ)
            </button>
          </div>
        </div>

        {activeAnomalies.length > 0 ? (
          <div className="space-y-3">
            {activeAnomalies.map((anom) => (
              <div key={anom.column} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{anom.column}</span>
                    <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                      {anom.count} Potential Anomalies ({anom.percentage}%)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Max: {anom.maxVal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-mono bg-white p-2 rounded-lg border border-slate-200">
                  {anom.explanation}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-emerald-600 bg-emerald-50 rounded-2xl border border-emerald-200">
            No extreme statistical outliers detected with {outlierMethod.toUpperCase()} methodology.
          </div>
        )}
      </div>

      {/* Non-Destructive Cleaning Engine */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-8 rounded-3xl shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Non-Destructive Smart Cleaning Engine</h3>
            <p className="text-xs text-slate-400">
              Generate a pristine, cleaned dataset copy. The original uploaded data is never modified.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={dropDuplicates}
              onChange={(e) => setDropDuplicates(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600"
            />
            <span>Drop duplicate rows ({qualityReport.duplicateRows} found)</span>
          </label>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400 font-medium">Missing values:</span>
            <select
              value={fillStrategy}
              onChange={(e) => setFillStrategy(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white outline-none"
            >
              <option value="median">Fill with Median / Mode (Recommended)</option>
              <option value="drop">Drop rows with missing cells</option>
              <option value="none">Keep as is</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleGenerateCleanedCopy}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>Create Cleaned Dataset Copy</span>
          </button>

          {cleanedData && (
            <button
              onClick={handleDownloadCleaned}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Cleaned CSV ({cleanedData.length.toLocaleString()} rows)</span>
            </button>
          )}
        </div>

        {cleanedData && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
            ✅ Cleaned dataset successfully generated ({cleanedData.length.toLocaleString()} rows).
            {qualityReport.duplicateRows > 0 && ` Removed ${qualityReport.duplicateRows} duplicate rows.`}
          </div>
        )}
      </div>
    </div>
  );
};
