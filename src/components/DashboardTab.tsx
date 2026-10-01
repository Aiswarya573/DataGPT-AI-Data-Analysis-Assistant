import React from 'react';
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle2,
  Copy,
  DollarSign,
  FileSpreadsheet,
  Hash,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { DatasetState } from '../types/dataset';
import { PlotlyChart } from './PlotlyChart';
import { TabKey } from './Navbar';

interface DashboardTabProps {
  dataset: DatasetState | null;
  setActiveTab: (tab: TabKey) => void;
  onLoadSample: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  dataset,
  setActiveTab,
  onLoadSample,
}) => {
  if (!dataset) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 max-w-xl mx-auto my-12 space-y-4">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
          <BarChart3 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">No Dataset Uploaded Yet</h3>
        <p className="text-sm text-slate-600">
          Upload a CSV or Excel dataset to automatically generate KPI metrics, quality indicators, and
          interactive Plotly charts.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={() => setActiveTab('upload')}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all cursor-pointer"
          >
            Upload Data
          </button>
          <button
            onClick={onLoadSample}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all cursor-pointer"
          >
            Load Sample Superstore Data
          </button>
        </div>
      </div>
    );
  }

  const { qualityReport, numericalColumns, categoricalColumns, dateColumns, rawRows } = dataset;
  const primaryMetric = numericalColumns[numericalColumns.length - 1] || numericalColumns[0];
  const primaryDim = categoricalColumns[0] || 'Category';

  // 1. Bar Chart Data (Top 8 items by primary metric)
  let barData: any[] = [];
  if (primaryDim && primaryMetric) {
    const aggMap: Record<string, number> = {};
    rawRows.forEach((r) => {
      const dimVal = String(r[primaryDim] || 'Unassigned');
      const metricVal = Number(r[primaryMetric]) || 0;
      aggMap[dimVal] = (aggMap[dimVal] || 0) + metricVal;
    });

    const sortedEntries = Object.entries(aggMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    barData = [
      {
        x: sortedEntries.map((e) => e[0]),
        y: sortedEntries.map((e) => Number(e[1].toFixed(2))),
        type: 'bar',
        marker: {
          color: '#2563eb',
          borderRadius: 6,
        },
      },
    ];
  }

  // 2. Trend Line Chart Data (Monthly aggregation if date exists)
  let lineData: any[] = [];
  if (dateColumns.length > 0 && primaryMetric) {
    const dateCol = dateColumns[0];
    const trendMap: Record<string, number> = {};
    rawRows.forEach((r) => {
      const d = r[dateCol];
      if (d) {
        const month = String(d).slice(0, 7); // YYYY-MM
        const mVal = Number(r[primaryMetric]) || 0;
        trendMap[month] = (trendMap[month] || 0) + mVal;
      }
    });

    const sortedMonths = Object.keys(trendMap).sort();
    lineData = [
      {
        x: sortedMonths,
        y: sortedMonths.map((m) => Number(trendMap[m].toFixed(2))),
        type: 'scatter',
        mode: 'lines+markers',
        line: { color: '#0ea5e9', width: 3 },
        marker: { size: 7, color: '#0369a1' },
      },
    ];
  }

  // 3. Donut / Pie Chart Data (Category share)
  let pieData: any[] = [];
  if (categoricalColumns.length > 0 && primaryMetric) {
    // pick categorical with <= 7 unique values if possible
    const bestCat =
      categoricalColumns.find((c) => {
        const u = dataset.categoricalStats[c]?.uniqueCount || 0;
        return u >= 2 && u <= 8;
      }) || categoricalColumns[0];

    const pieMap: Record<string, number> = {};
    rawRows.forEach((r) => {
      const key = String(r[bestCat] || 'Other');
      const val = Number(r[primaryMetric]) || 0;
      pieMap[key] = (pieMap[key] || 0) + val;
    });

    const entries = Object.entries(pieMap);
    pieData = [
      {
        labels: entries.map((e) => e[0]),
        values: entries.map((e) => Number(e[1].toFixed(2))),
        type: 'pie',
        hole: 0.45,
        textinfo: 'label+percent',
        marker: {
          colors: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'],
        },
      },
    ];
  }

  // 4. Histogram distribution data
  let histData: any[] = [];
  if (primaryMetric) {
    const vals = rawRows.map((r) => Number(r[primaryMetric])).filter((n) => !isNaN(n));
    histData = [
      {
        x: vals,
        type: 'histogram',
        nbinsx: 20,
        marker: {
          color: '#10b981',
        },
      },
    ];
  }

  const primaryStats = dataset.numericalStats[primaryMetric];

  return (
    <div className="space-y-8 py-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-2xl text-slate-900">{dataset.name}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
              Live Dashboard
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visualizing {rawRows.length.toLocaleString()} records across {dataset.columns.length} dimensions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('ask')}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all cursor-pointer shadow-xs"
          >
            Ask Questions About This Data
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Rows */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">Total Records</span>
          <div className="text-xl font-black text-slate-900">{rawRows.length.toLocaleString()}</div>
          <span className="text-[10px] text-slate-400">Rows in dataset</span>
        </div>

        {/* Columns */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">Columns</span>
          <div className="text-xl font-black text-slate-900">{dataset.columns.length}</div>
          <span className="text-[10px] text-slate-400">Total dimensions</span>
        </div>

        {/* Missing Values */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            Missing Cells
          </span>
          <div className="text-xl font-black text-amber-600">{qualityReport.totalMissingCells}</div>
          <span className="text-[10px] text-slate-400">Cells requiring audit</span>
        </div>

        {/* Duplicates */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1 flex items-center gap-1">
            <Copy className="w-3 h-3 text-rose-500" />
            Duplicate Rows
          </span>
          <div className="text-xl font-black text-rose-600">{qualityReport.duplicateRows}</div>
          <span className="text-[10px] text-slate-400">Repeated entries</span>
        </div>

        {/* Quality Score */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            Quality Score
          </span>
          <div className="text-xl font-black text-emerald-600">{qualityReport.score} / 100</div>
          <span className="text-[10px] text-slate-400">Integrity index</span>
        </div>

        {/* Primary Metric KPI */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1 truncate">
            Total {primaryMetric || 'Metric'}
          </span>
          <div className="text-xl font-black text-blue-600 truncate">
            {primaryStats ? primaryStats.sum.toLocaleString(undefined, { maximumFractionDigits: 0 }) : 'N/A'}
          </div>
          <span className="text-[10px] text-slate-400">
            Avg: {primaryStats ? primaryStats.mean.toFixed(1) : '-'}
          </span>
        </div>
      </div>

      {/* Plotly Interactive Charts 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Bar Comparison */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Top {primaryDim} by {primaryMetric}
              </h3>
              <p className="text-xs text-slate-500">Comparative volume analysis</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
              Bar Chart
            </span>
          </div>
          {barData.length > 0 ? (
            <PlotlyChart
              data={barData}
              layout={{
                xaxis: { title: { text: primaryDim, font: { size: 12 } } },
                yaxis: { title: { text: `Total ${primaryMetric}`, font: { size: 12 } } },
              }}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              No suitable numerical & categorical columns found for comparison.
            </div>
          )}
        </div>

        {/* Chart 2: Timeline Trend */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Temporal Trend ({primaryMetric})
              </h3>
              <p className="text-xs text-slate-500">Monthly aggregate trajectory</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-700">
              Line Chart
            </span>
          </div>
          {lineData.length > 0 ? (
            <PlotlyChart
              data={lineData}
              layout={{
                xaxis: { title: { text: 'Period (Month)', font: { size: 12 } } },
                yaxis: { title: { text: primaryMetric, font: { size: 12 } } },
              }}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              No date columns detected for temporal trend line.
            </div>
          )}
        </div>

        {/* Chart 3: Donut Proportion */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Category Proportion Breakdown</h3>
              <p className="text-xs text-slate-500">Relative share contribution</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700">
              Donut Chart
            </span>
          </div>
          {pieData.length > 0 ? (
            <PlotlyChart data={pieData} />
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              Insufficient dimension data for pie visualization.
            </div>
          )}
        </div>

        {/* Chart 4: Numerical Distribution Histogram */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Distribution of {primaryMetric}
              </h3>
              <p className="text-xs text-slate-500">Frequency spread & concentration</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
              Histogram
            </span>
          </div>
          {histData.length > 0 ? (
            <PlotlyChart
              data={histData}
              layout={{
                xaxis: { title: { text: primaryMetric, font: { size: 12 } } },
                yaxis: { title: { text: 'Record Count (Frequency)', font: { size: 12 } } },
              }}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              No numerical values to plot histogram.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
