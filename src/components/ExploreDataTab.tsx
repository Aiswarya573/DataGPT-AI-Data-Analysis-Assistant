import React, { useState, useMemo } from 'react';
import {
  Layers,
  BarChart,
  Download,
  Filter,
  PieChart as PieIcon,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { DatasetState } from '../types/dataset';
import { PlotlyChart } from './PlotlyChart';
import { executeAggregation } from '../utils/dataEngine';

interface ExploreDataTabProps {
  dataset: DatasetState | null;
  onLoadSample: () => void;
}

export const ExploreDataTab: React.FC<ExploreDataTabProps> = ({ dataset, onLoadSample }) => {
  if (!dataset) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 max-w-xl mx-auto my-12 space-y-4">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
          <Layers className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Upload Dataset to Explore</h3>
        <p className="text-sm text-slate-600">
          Upload your data to slice, dice, group, filter, and generate custom visualizations without writing
          code.
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

  const { numericalColumns, categoricalColumns, dateColumns } = dataset;
  const defaultMetric = numericalColumns[numericalColumns.length - 1] || dataset.columns[0];
  const defaultDim = categoricalColumns[0] || 'None';

  const [selectedMetric, setSelectedMetric] = useState(defaultMetric);
  const [selectedDimension, setSelectedDimension] = useState<string>(defaultDim);
  const [selectedAgg, setSelectedAgg] = useState<'sum' | 'mean' | 'count' | 'min' | 'max'>('sum');
  const [selectedChartType, setSelectedChartType] = useState<'bar' | 'line' | 'pie' | 'scatter'>('bar');
  const [filterText, setFilterText] = useState('');

  const groupOptions = ['None (Overall)', ...categoricalColumns, ...dateColumns];

  // Perform aggregation
  const dimensionToUse = selectedDimension === 'None (Overall)' ? null : selectedDimension;
  const aggregatedResults = useMemo(() => {
    return executeAggregation(
      dataset.rawRows,
      selectedMetric,
      dimensionToUse,
      selectedAgg,
      filterText
    );
  }, [dataset.rawRows, selectedMetric, dimensionToUse, selectedAgg, filterText]);

  // Export CSV of results
  const handleDownloadCSV = () => {
    if (!aggregatedResults || aggregatedResults.length === 0) return;
    const headers = Object.keys(aggregatedResults[0]).join(',');
    const rows = aggregatedResults.map((r) => Object.values(r).join(',')).join('\n');
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(`${headers}\n${rows}`);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `explored_${selectedMetric}_${selectedAgg}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Prepare Plotly Chart Data
  const chartData = useMemo(() => {
    if (!dimensionToUse || aggregatedResults.length === 0) {
      // Single scalar value bar
      return [
        {
          x: [aggregatedResults[0]?.Metric || selectedMetric],
          y: [aggregatedResults[0]?.Value || 0],
          type: 'bar',
          marker: { color: '#2563eb', borderRadius: 6 },
        },
      ];
    }

    const xVals = aggregatedResults.map((r) => r[dimensionToUse]);
    const yVals = aggregatedResults.map((r) => r[selectedMetric]);

    if (selectedChartType === 'pie') {
      return [
        {
          labels: xVals,
          values: yVals,
          type: 'pie',
          hole: 0.4,
          marker: {
            colors: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'],
          },
        },
      ];
    }

    if (selectedChartType === 'line') {
      return [
        {
          x: xVals,
          y: yVals,
          type: 'scatter',
          mode: 'lines+markers',
          line: { color: '#0ea5e9', width: 3 },
          marker: { size: 7, color: '#0369a1' },
        },
      ];
    }

    if (selectedChartType === 'scatter') {
      return [
        {
          x: xVals,
          y: yVals,
          mode: 'markers',
          type: 'scatter',
          marker: { size: 10, color: '#8b5cf6' },
        },
      ];
    }

    // Default bar
    return [
      {
        x: xVals,
        y: yVals,
        type: 'bar',
        marker: { color: '#2563eb', borderRadius: 6 },
      },
    ];
  }, [aggregatedResults, dimensionToUse, selectedMetric, selectedChartType]);

  return (
    <div className="space-y-8 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Explore Data – Slicing & Dicing</h2>
              <p className="text-xs text-slate-500">
                Self-serve visual aggregations across {dataset.name} without manual code.
              </p>
            </div>
          </div>
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Explored CSV</span>
          </button>
        </div>
      </div>

      {/* Slicing Controls Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        {/* 1. Metric Column */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">1. Target Metric</label>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 outline-none focus:border-blue-500"
          >
            {numericalColumns.map((col) => (
              <option key={col} value={col}>
                {col} (Numeric)
              </option>
            ))}
          </select>
        </div>

        {/* 2. Group Dimension */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">2. Group By Dimension</label>
          <select
            value={selectedDimension}
            onChange={(e) => setSelectedDimension(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 outline-none focus:border-blue-500"
          >
            {groupOptions.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Aggregation Function */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">3. Aggregation</label>
          <select
            value={selectedAgg}
            onChange={(e) => setSelectedAgg(e.target.value as any)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 outline-none focus:border-blue-500 uppercase"
          >
            <option value="sum">Sum</option>
            <option value="mean">Average / Mean</option>
            <option value="count">Record Count</option>
            <option value="min">Minimum</option>
            <option value="max">Maximum</option>
          </select>
        </div>

        {/* 4. Chart Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">4. Visualization Type</label>
          <select
            value={selectedChartType}
            onChange={(e) => setSelectedChartType(e.target.value as any)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 outline-none focus:border-blue-500"
          >
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
            <option value="pie">Donut / Pie Chart</option>
            <option value="scatter">Scatter Plot</option>
          </select>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 flex items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Filter rows by keyword (e.g. 'Electronics', 'West', '2024')..."
          className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none"
        />
        {filterText && (
          <button
            onClick={() => setFilterText('')}
            className="text-xs text-slate-400 hover:text-slate-600 px-2 cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Main Exploration Split: Chart & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Chart Column (3 cols) */}
        <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              {selectedAgg.toUpperCase()} of {selectedMetric}
              {dimensionToUse ? ` by ${dimensionToUse}` : ''}
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700">
              Interactive Plotly
            </span>
          </div>

          <PlotlyChart
            data={chartData}
            layout={{
              height: 380,
              xaxis: {
                title: { text: dimensionToUse || 'Overall', font: { size: 12 } },
              },
              yaxis: {
                title: { text: `${selectedAgg.toUpperCase()} (${selectedMetric})`, font: { size: 12 } },
              },
            }}
          />
        </div>

        {/* Table Column (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Result Table</h3>
            <span className="text-xs text-slate-400 font-mono">
              {aggregatedResults.length} {aggregatedResults.length === 1 ? 'row' : 'groups'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-96 rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 shadow-2xs">
                <tr>
                  <th className="py-2.5 px-3 font-semibold text-slate-700">
                    {dimensionToUse || 'Metric'}
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-slate-700 text-right">
                    {selectedAgg.toUpperCase()}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {aggregatedResults.map((r, idx) => {
                  const dimVal = dimensionToUse ? r[dimensionToUse] : r.Metric;
                  const numVal = dimensionToUse ? r[selectedMetric] : r.Value;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-medium text-slate-800">{String(dimVal)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-blue-600">
                        {typeof numVal === 'number'
                          ? numVal.toLocaleString(undefined, { maximumFractionDigits: 2 })
                          : String(numVal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
