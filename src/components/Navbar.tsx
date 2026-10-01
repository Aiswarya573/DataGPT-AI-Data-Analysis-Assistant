import React from 'react';
import {
  BarChart3,
  Bot,
  Database,
  FileSpreadsheet,
  FileUp,
  Flame,
  Home,
  Layers,
  ShieldCheck,
  Code2,
} from 'lucide-react';
import { DatasetState } from '../types/dataset';

export type TabKey =
  | 'home'
  | 'upload'
  | 'dashboard'
  | 'ask'
  | 'explore'
  | 'sql'
  | 'quality'
  | 'insights'
  | 'code';

interface NavbarProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  dataset: DatasetState | null;
  onLoadSample: () => void;
  onClearDataset: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  dataset,
  onLoadSample,
  onClearDataset,
}) => {
  const navItems: { id: TabKey; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'upload', label: 'Upload Data', icon: <FileUp className="w-4 h-4" /> },
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'ask', label: 'Ask Data', icon: <Bot className="w-4 h-4" /> },
    { id: 'explore', label: 'Explore Data', icon: <Layers className="w-4 h-4" /> },
    { id: 'sql', label: 'SQL Detective', icon: <Database className="w-4 h-4" /> },
    { id: 'quality', label: 'Data Quality', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'insights', label: 'AI Insights', icon: <Flame className="w-4 h-4" />, badge: 'Analyst' },
    { id: 'code', label: 'Python & Deploy', icon: <Code2 className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">DataGPT</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  AI Analyst
                </span>
              </div>
              <p className="text-xs text-slate-500">Autonomous Data Profiler & Copilot</p>
            </div>
          </div>

          {/* Dataset Status Banner */}
          <div className="hidden lg:flex items-center gap-3">
            {dataset ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-emerald-900 truncate max-w-40">{dataset.name}</span>
                <span className="text-emerald-700 font-medium">
                  ({dataset.rawRows.length.toLocaleString()} rows, {dataset.columns.length} cols)
                </span>
                <button
                  onClick={onClearDataset}
                  className="ml-1 text-slate-400 hover:text-red-600 transition-colors"
                  title="Remove dataset"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={onLoadSample}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-blue-700 text-xs font-semibold border border-slate-200 transition-all cursor-pointer"
              >
                <span>⚡ Load Superstore Sample</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none py-1 border-t border-slate-100">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm ${
                      isActive ? 'bg-blue-800 text-white' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
