import React, { useState } from 'react';
import {
  Flame,
  Sparkles,
  TrendingUp,
  Award,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Download,
  ArrowRight,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { DatasetState } from '../types/dataset';

interface AiInsightsTabProps {
  dataset: DatasetState | null;
  onLoadSample: () => void;
}

export const AiInsightsTab: React.FC<AiInsightsTabProps> = ({ dataset, onLoadSample }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisReport, setAnalysisReport] = useState<any | null>(null);

  if (!dataset) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 max-w-xl mx-auto my-12 space-y-4">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
          <Flame className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Upload Dataset for AI Insights</h3>
        <p className="text-sm text-slate-600">
          Upload your data to trigger automated &quot;Analyze My Data&quot; mode, detecting concentration risks,
          top performers, timeline trends, and strategic recommendations.
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

  const { numericalColumns, categoricalColumns, dateColumns, rawRows, qualityReport, anomalies } = dataset;
  const primaryMetric = numericalColumns[numericalColumns.length - 1] || 'Sales';

  // Compute verifiable facts directly
  const runDataAnalystAnalysis = async () => {
    setIsAnalyzing(true);

    try {
      // 1. Calculate Top Performers
      const topPerformers: any[] = [];
      categoricalColumns.slice(0, 3).forEach((cat) => {
        const map: Record<string, number> = {};
        rawRows.forEach((r) => {
          const k = String(r[cat] || 'Unassigned');
          map[k] = (map[k] || 0) + (Number(r[primaryMetric]) || 0);
        });

        const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
        if (sorted.length > 0) {
          const total = sorted.reduce((sum, curr) => sum + curr[1], 0);
          const topItem = sorted[0];
          const share = total > 0 ? (topItem[1] / total) * 100 : 0;

          topPerformers.push({
            dimension: cat,
            topLeader: topItem[0],
            value: topItem[1],
            total,
            sharePct: Number(share.toFixed(1)),
            top3: sorted.slice(0, 3).map((s) => ({ name: s[0], val: s[1] })),
          });
        }
      });

      // 2. Calculate Temporal Trend if date exists
      let trendInfo: any = null;
      if (dateColumns.length > 0) {
        const dCol = dateColumns[0];
        const monthMap: Record<string, number> = {};
        rawRows.forEach((r) => {
          const d = r[dCol];
          if (d) {
            const m = String(d).slice(0, 7);
            monthMap[m] = (monthMap[m] || 0) + (Number(r[primaryMetric]) || 0);
          }
        });

        const months = Object.keys(monthMap).sort();
        if (months.length >= 2) {
          const first = monthMap[months[0]];
          const last = monthMap[months[months.length - 1]];
          const diffPct = first !== 0 ? ((last - first) / Math.abs(first)) * 100 : 0;
          trendInfo = {
            startMonth: months[0],
            endMonth: months[months.length - 1],
            startVal: first,
            endVal: last,
            growthPct: Number(diffPct.toFixed(1)),
          };
        }
      }

      // 3. Ask server for executive synthesis
      let serverSummary = '';
      let serverRecs: any[] = [];

      try {
        const resp = await fetch('/api/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile: {
              rows: rawRows.length,
              cols: dataset.columns.length,
              primaryMetric,
            },
            quality: {
              score: qualityReport.score,
              duplicateCount: qualityReport.duplicateRows,
              missingCount: qualityReport.totalMissingCells,
              outlierCount: anomalies.reduce((a, b) => a + b.count, 0),
            },
            stats: {
              topPerformers,
              trendInfo,
            },
            sampleRows: rawRows.slice(0, 5),
          }),
        });

        if (resp.ok) {
          const resJson = await resp.json();
          serverSummary = resJson.executive_summary;
          if (Array.isArray(resJson.recommendations)) {
            serverRecs = resJson.recommendations;
          }
        }
      } catch {
        // server fallback
      }

      // Default fallback recommendations if not returned by server
      if (serverRecs.length === 0) {
        serverRecs = [
          ...(qualityReport.duplicateRows > 0
            ? [
                {
                  category: 'Data Hygiene',
                  finding: `Detected ${qualityReport.duplicateRows} duplicate transaction rows.`,
                  recommendation: 'De-duplicate orders prior to submitting quarterly tax and accounting reports.',
                },
              ]
            : []),
          ...topPerformers.map((tp) => ({
            category: 'Revenue Concentration',
            finding: `'${tp.topLeader}' accounts for ${tp.sharePct}% of total ${primaryMetric} in ${tp.dimension}.`,
            recommendation:
              tp.sharePct > 35
                ? `High concentration risk detected. Cultivate cross-sell programs to diversify revenue beyond '${tp.topLeader}'.`
                : `Solid performance benchmark. Replicate marketing playbook of '${tp.topLeader}' across trailing peers.`,
          })),
          ...(trendInfo
            ? [
                {
                  category: 'Forecasting',
                  finding: `Net trajectory from ${trendInfo.startMonth} to ${trendInfo.endMonth} shifted by ${trendInfo.growthPct}%.`,
                  recommendation: 'Calibrate inventory and staffing around verified peak operational months.',
                },
              ]
            : []),
        ];
      }

      setAnalysisReport({
        executiveSummary:
          serverSummary ||
          `The dataset contains ${rawRows.length.toLocaleString()} verified records with a Data Quality Score of ${
            qualityReport.score
          }/100. Primary operational driver is '${primaryMetric}', with noticeable concentrations in leading categories.`,
        topPerformers,
        trendInfo,
        recommendations: serverRecs,
        timestamp: new Date().toLocaleString(),
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Download complete report as Markdown
  const handleDownloadReport = () => {
    if (!analysisReport) return;
    const md = `# DataGPT Executive Insights Report: ${dataset.name}
Generated: ${analysisReport.timestamp}

## Executive Summary
${analysisReport.executiveSummary}

## Top Performers
${analysisReport.topPerformers
  .map(
    (tp: any) =>
      `- **${tp.dimension}:** '${tp.topLeader}' generated ${tp.value.toLocaleString()} (${tp.sharePct}% of total ${primaryMetric}).`
  )
  .join('\n')}

${
  analysisReport.trendInfo
    ? `## Temporal Trend
- Movement from ${analysisReport.trendInfo.startMonth} to ${analysisReport.trendInfo.endMonth}: ${analysisReport.trendInfo.growthPct}% change.`
    : ''
}

## Strategic Recommendations (Finding vs. Recommendation)
${analysisReport.recommendations
  .map((r: any) => `### ${r.category}\n- **Finding:** ${r.finding}\n- **Recommendation:** ${r.recommendation}`)
  .join('\n\n')}
`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DataGPT_Report_${dataset.name.replace(/\.[^/.]+$/, '')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 py-6 max-w-7xl mx-auto">
      {/* Top Banner & Trigger Button */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white p-8 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-xs font-semibold text-blue-200 border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Autonomous AI Data Analyst Mode</span>
          </div>
          <h2 className="text-2xl font-bold">Comprehensive Dataset Intelligence</h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Click &quot;Analyze My Data&quot; to synthesize top performers, temporal movements, anomaly alerts,
            and data-grounded business recommendations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={runDataAnalystAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {isAnalyzing ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Flame className="w-4 h-4 text-amber-300" />
            )}
            <span>🚀 Analyze My Data</span>
          </button>
        </div>
      </div>

      {/* Report Section */}
      {analysisReport && (
        <div className="space-y-8">
          {/* Executive Summary Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Executive Summary</h3>
              </div>
              <button
                onClick={handleDownloadReport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Report (Markdown)</span>
              </button>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
              {analysisReport.executiveSummary}
            </p>
          </div>

          {/* Top Performers Ranking Grid */}
          {analysisReport.topPerformers.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">Top Dimension Contributors ({primaryMetric})</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {analysisReport.topPerformers.map((tp: any) => (
                  <div key={tp.dimension} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                      {tp.dimension} Leader
                    </span>
                    <div>
                      <div className="text-lg font-bold text-slate-900 truncate">{tp.topLeader}</div>
                      <div className="text-xs text-blue-600 font-semibold font-mono">
                        {tp.value.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({tp.sharePct}% share)
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200 space-y-1">
                      <span className="font-semibold block text-slate-700">Top 3 in {tp.dimension}:</span>
                      {tp.top3.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between truncate">
                          <span className="truncate">{idx + 1}. {item.name}</span>
                          <span className="font-mono text-slate-700">{item.val.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strategic Recommendations: Finding vs Recommendation */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900">
                Actionable Recommendations (Finding vs. Recommendation)
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Each recommendation is derived strictly from computed data evidence. Recommendations are separated
              from verified findings to provide objective decision support.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {analysisReport.recommendations.map((rec: any, idx: number) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {rec.category || 'Strategic Action'}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-slate-500 block uppercase text-[10px] tracking-wider">
                      📊 Observed Finding:
                    </span>
                    <p className="text-slate-800 font-medium">{rec.finding}</p>
                  </div>

                  <div className="space-y-1 text-xs bg-white p-3 rounded-xl border border-slate-200">
                    <span className="font-bold text-emerald-600 block uppercase text-[10px] tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Prudent Recommendation:
                    </span>
                    <p className="text-slate-700">{rec.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
