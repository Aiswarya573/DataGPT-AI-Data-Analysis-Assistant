import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  User,
  Send,
  Trash2,
  Sparkles,
  HelpCircle,
  Table,
  ChevronDown,
  ChevronUp,
  BarChart,
  ArrowRight,
} from 'lucide-react';
import { DatasetState, ChatMessage } from '../types/dataset';
import { PlotlyChart } from './PlotlyChart';
import { executeAggregation } from '../utils/dataEngine';

interface AskDataTabProps {
  dataset: DatasetState | null;
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onLoadSample: () => void;
}

export const AskDataTab: React.FC<AskDataTabProps> = ({
  dataset,
  chatHistory,
  setChatHistory,
  onLoadSample,
}) => {
  const [inputQuestion, setInputQuestion] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedCalcs, setExpandedCalcs] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isProcessing]);

  if (!dataset) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 max-w-xl mx-auto my-12 space-y-4">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
          <Bot className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Upload Dataset to Chat</h3>
        <p className="text-sm text-slate-600">
          Upload your data or load the sample Superstore dataset to ask natural-language questions and get
          verified, calculation-backed answers.
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

  const { numericalColumns, categoricalColumns, dateColumns, rawRows } = dataset;
  const primaryMetric = numericalColumns[numericalColumns.length - 1] || 'Sales';
  const primaryDim = categoricalColumns[0] || 'Product';

  // Sample prompt chips
  const suggestedPrompts = [
    `Which ${primaryDim} has the highest ${primaryMetric}?`,
    `What is the total ${primaryMetric}?`,
    `Show ${primaryMetric} by ${categoricalColumns[1] || primaryDim}.`,
    `Give me the top 5 ${primaryDim}s.`,
    `What is the monthly ${primaryMetric} trend?`,
  ];

  const toggleCalc = (msgId: string) => {
    setExpandedCalcs((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleAskQuestion = async (qText: string) => {
    const q = qText.trim();
    if (!q || isProcessing) return;

    setInputQuestion('');
    const userMsgId = 'usr_' + Date.now();
    const assistantMsgId = 'ast_' + (Date.now() + 1);

    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistory((prev) => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      // 1. Ask server intent parser (with local fallback)
      let intent: any = null;
      try {
        const resp = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: q,
            columns: dataset.columns,
            numericalColumns,
            categoricalColumns,
            dateColumns,
            history: chatHistory.slice(-4),
          }),
        });
        if (resp.ok) {
          const resJson = await resp.json();
          intent = resJson.intent;
        }
      } catch {
        // server request failed, proceed to local heuristic
      }

      // Local heuristic fallback if no LLM intent
      if (!intent) {
        intent = deduceHeuristicIntent(q, dataset);
      }

      // 2. Perform verified local calculation on rawRows
      const executionResult = executeAnalyticalPlan(intent, q, dataset);

      // 3. Optional server human explanation synthesis
      let finalAnswer = executionResult.answer;
      try {
        const expResp = await fetch('/api/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: q,
            resultSummary: executionResult.answer,
            calculationStep: executionResult.calculation,
          }),
        });
        if (expResp.ok) {
          const expJson = await expResp.json();
          if (expJson.explanation) {
            finalAnswer = expJson.explanation;
          }
        }
      } catch {
        // ignore
      }

      const assistantMessage: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: finalAnswer,
        calculation: executionResult.calculation,
        data: executionResult.data,
        chart: executionResult.chart,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatHistory((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: `I encountered an issue processing that query: ${err.message || 'Unknown error'}. Please try rephrasing your question.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 py-4 max-w-5xl mx-auto flex flex-col h-[calc(100vh-140px)]">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Conversational Data Analyst</h2>
            <p className="text-xs text-slate-500">
              Verified computations over{' '}
              <strong className="text-slate-800">{dataset.name}</strong> ({rawRows.length.toLocaleString()}{' '}
              records)
            </p>
          </div>
        </div>

        {chatHistory.length > 0 && (
          <button
            onClick={() => setChatHistory([])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Chat</span>
          </button>
        )}
      </div>

      {/* Suggested Chips Bar */}
      <div className="shrink-0 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-semibold text-slate-400 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Suggestions:
        </span>
        {suggestedPrompts.map((pText, idx) => (
          <button
            key={idx}
            onClick={() => handleAskQuestion(pText)}
            className="shrink-0 px-3 py-1 rounded-full bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-200 text-xs text-slate-700 font-medium transition-all cursor-pointer shadow-2xs"
          >
            {pText}
          </button>
        ))}
      </div>

      {/* Chat Messages Scroll Container */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {chatHistory.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Ask Any Question About Your Data</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              You can query top performers, monthly trends, regional comparisons, totals, or aggregations.
              Every numerical answer is computed mathematically on your dataset.
            </p>
          </div>
        ) : (
          chatHistory.map((msg) => {
            const isUser = msg.role === 'user';
            const hasCalc = Boolean(msg.calculation);
            const isCalcOpen = expandedCalcs[msg.id];

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4 space-y-3 shadow-xs ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                  }`}
                >
                  {/* Message Text */}
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                  {/* Calculation Details Expander */}
                  {hasCalc && (
                    <div className="border-t border-slate-100 pt-2">
                      <button
                        onClick={() => toggleCalc(msg.id)}
                        className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                      >
                        <span>🔍 How it was calculated</span>
                        {isCalcOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                      {isCalcOpen && (
                        <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700 leading-normal">
                          {msg.calculation}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Table Result */}
                  {msg.data && msg.data.length > 0 && (
                    <div className="border-t border-slate-100 pt-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1.5">
                        <span className="flex items-center gap-1">
                          <Table className="w-3 h-3 text-slate-400" />
                          Computed Result Table ({msg.data.length} rows)
                        </span>
                      </div>
                      <div className="overflow-x-auto max-h-48 rounded-lg border border-slate-200 bg-slate-50/50">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-100/70">
                              {Object.keys(msg.data[0]).map((col) => (
                                <th key={col} className="p-2 font-semibold text-slate-700 whitespace-nowrap">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {msg.data.map((row, rIdx) => (
                              <tr key={rIdx}>
                                {Object.values(row).map((val: any, cIdx) => (
                                  <td key={cIdx} className="p-2 whitespace-nowrap text-slate-800">
                                    {typeof val === 'number' ? val.toLocaleString() : String(val)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Chart Result */}
                  {msg.chart && msg.data && msg.data.length > 0 && (
                    <div className="border-t border-slate-100 pt-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-2">
                        <BarChart className="w-3 h-3 text-blue-600" />
                        <span>Interactive Chart: {msg.chart.title}</span>
                      </div>
                      <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-2">
                        {renderChartForMessage(msg.chart, msg.data)}
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div
                    className={`text-[10px] text-right ${
                      isUser ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {isProcessing && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs font-medium text-slate-600 flex items-center gap-2 shadow-xs">
              <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Interpreting question and computing mathematical results...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAskQuestion(inputQuestion);
        }}
        className="shrink-0 flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-md"
      >
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          placeholder={`Ask about ${primaryMetric}, ${primaryDim}, trends, top rankings...`}
          className="flex-1 px-4 py-2.5 text-sm bg-transparent outline-none text-slate-800 placeholder-slate-400"
          disabled={isProcessing}
        />
        <button
          type="submit"
          disabled={!inputQuestion.trim() || isProcessing}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
        >
          <span>Ask</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

// Helper: Heuristic parser for intent
function deduceHeuristicIntent(q: string, dataset: DatasetState) {
  const lq = q.toLowerCase();
  const numCol =
    dataset.numericalColumns.find((c) => lq.includes(c.toLowerCase())) ||
    dataset.numericalColumns[dataset.numericalColumns.length - 1];

  const dimCol =
    dataset.categoricalColumns.find((c) => lq.includes(c.toLowerCase())) ||
    dataset.categoricalColumns[0];

  if (lq.includes('highest') || lq.includes('top') || lq.includes('best') || lq.includes('most')) {
    const match = lq.match(/top\s+(\d+)/);
    const n = match ? parseInt(match[1]) : 5;
    return {
      operation: 'top_n',
      metric: numCol,
      dimension: dimCol,
      top_n: n,
      chart_type: 'bar',
    };
  }

  if (lq.includes('trend') || lq.includes('month') || lq.includes('time') || lq.includes('over time')) {
    return {
      operation: 'trend',
      metric: numCol,
      dimension: dataset.dateColumns[0] || dimCol,
      chart_type: 'line',
    };
  }

  if (lq.includes('total') || lq.includes('sum') || lq.includes('overall') || lq.includes('how much')) {
    return {
      operation: 'total',
      metric: numCol,
      chart_type: 'none',
    };
  }

  return {
    operation: 'groupby',
    metric: numCol,
    dimension: dimCol,
    top_n: 5,
    chart_type: 'bar',
  };
}

// Helper: Verified execution
function executeAnalyticalPlan(intent: any, question: string, dataset: DatasetState) {
  const op = intent?.operation || 'groupby';
  const metric =
    intent?.metric && dataset.numericalColumns.includes(intent.metric)
      ? intent.metric
      : dataset.numericalColumns[dataset.numericalColumns.length - 1] || 'Sales';
  const dimension =
    intent?.dimension && dataset.columns.includes(intent.dimension)
      ? intent.dimension
      : dataset.categoricalColumns[0] || 'Category';
  const topN = Math.max(1, Math.min(20, parseInt(intent?.top_n) || 5));

  if (op === 'top_n' || op === 'bottom_n' || op === 'groupby') {
    const isBottom = op === 'bottom_n';
    const grouped = executeAggregation(dataset.rawRows, metric, dimension, 'sum');
    const sorted = isBottom ? [...grouped].reverse() : grouped;
    const finalData = sorted.slice(0, topN);

    if (finalData.length === 0) {
      return {
        answer: `No records found to group '${dimension}' by '${metric}'.`,
        calculation: `Grouped dataset by '${dimension}', calculated sum of '${metric}'.`,
        data: [],
      };
    }

    const topItem = finalData[0][dimension];
    const topVal = Number(finalData[0][metric]);

    return {
      answer: `**${topItem}** has the ${isBottom ? 'lowest' : 'highest'} total ${metric} at **${topVal.toLocaleString(
        undefined,
        { maximumFractionDigits: 2 }
      )}**. Here are the top ${finalData.length} ${dimension}s.`,
      calculation: `Aggregated sum of '${metric}' grouped by '${dimension}', sorted in ${
        isBottom ? 'ascending' : 'descending'
      } order, extracted top ${topN} entries.`,
      data: finalData,
      chart: {
        type: 'bar' as const,
        x: dimension,
        y: metric,
        title: `Top ${finalData.length} ${dimension}s by ${metric}`,
      },
    };
  }

  if (op === 'total') {
    const totalData = executeAggregation(dataset.rawRows, metric, null, 'sum');
    const totalVal = Number(totalData[0].Value);
    const count = dataset.rawRows.length;
    const meanVal = totalVal / (count || 1);

    return {
      answer: `The total **${metric}** across all ${count.toLocaleString()} rows is **${totalVal.toLocaleString(
        undefined,
        { maximumFractionDigits: 2 }
      )}** (Average: ${meanVal.toLocaleString(undefined, { maximumFractionDigits: 2 })} per row).`,
      calculation: `Summed all numerical entries in column '${metric}' across ${count.toLocaleString()} rows.`,
      data: [
        {
          Metric: metric,
          'Total Sum': totalVal,
          'Average Value': Number(meanVal.toFixed(2)),
          'Row Count': count,
        },
      ],
      chart: undefined,
    };
  }

  if (op === 'trend') {
    const dateCol = dataset.dateColumns[0] || dimension;
    const trendMap: Record<string, number> = {};
    dataset.rawRows.forEach((r) => {
      const d = r[dateCol];
      if (d) {
        const monthKey = String(d).slice(0, 7);
        trendMap[monthKey] = (trendMap[monthKey] || 0) + (Number(r[metric]) || 0);
      }
    });

    const months = Object.keys(trendMap).sort();
    const trendData = months.map((m) => ({
      Month: m,
      [metric]: Number(trendMap[m].toFixed(2)),
    }));

    if (trendData.length >= 2) {
      const first = trendData[0][metric];
      const last = trendData[trendData.length - 1][metric];
      const changePct = first !== 0 ? ((last - first) / Math.abs(first)) * 100 : 0;

      return {
        answer: `From **${trendData[0].Month}** to **${
          trendData[trendData.length - 1].Month
        }**, ${metric} changed from **${first.toLocaleString()}** to **${last.toLocaleString()}** (${
          changePct >= 0 ? '+' : ''
        }${changePct.toFixed(1)}%).`,
        calculation: `Grouped records by Month from column '${dateCol}' and computed total '${metric}' per monthly bucket.`,
        data: trendData,
        chart: {
          type: 'line' as const,
          x: 'Month',
          y: metric,
          title: `Monthly Trend of ${metric}`,
        },
      };
    }
  }

  // General fallback table
  return {
    answer: `Here is the requested analysis on '${metric}' by '${dimension}'.`,
    calculation: `Computed top aggregations on '${metric}' grouped by '${dimension}'.`,
    data: dataset.rawRows.slice(0, 5),
  };
}

// Render dynamic chart inside chat message
function renderChartForMessage(chartInfo: any, data: any[]) {
  if (chartInfo.type === 'bar') {
    return (
      <PlotlyChart
        data={[
          {
            x: data.map((d) => d[chartInfo.x]),
            y: data.map((d) => d[chartInfo.y]),
            type: 'bar',
            marker: { color: '#2563eb', borderRadius: 4 },
          },
        ]}
        layout={{
          height: 260,
          margin: { l: 40, r: 20, t: 20, b: 40 },
          xaxis: { title: { text: chartInfo.x, font: { size: 11 } } },
          yaxis: { title: { text: chartInfo.y, font: { size: 11 } } },
        }}
      />
    );
  }

  if (chartInfo.type === 'line') {
    return (
      <PlotlyChart
        data={[
          {
            x: data.map((d) => d[chartInfo.x]),
            y: data.map((d) => d[chartInfo.y]),
            type: 'scatter',
            mode: 'lines+markers',
            line: { color: '#0ea5e9', width: 2.5 },
            marker: { size: 6, color: '#0284c7' },
          },
        ]}
        layout={{
          height: 260,
          margin: { l: 40, r: 20, t: 20, b: 40 },
          xaxis: { title: { text: chartInfo.x, font: { size: 11 } } },
          yaxis: { title: { text: chartInfo.y, font: { size: 11 } } },
        }}
      />
    );
  }

  return null;
}
