import React, { useState, useEffect } from 'react';
import { Navbar, TabKey } from './components/Navbar';
import { HomeTab } from './components/HomeTab';
import { UploadTab } from './components/UploadTab';
import { DashboardTab } from './components/DashboardTab';
import { AskDataTab } from './components/AskDataTab';
import { ExploreDataTab } from './components/ExploreDataTab';
import { SqlDetectiveTab } from './components/SqlDetectiveTab';
import { DataQualityTab } from './components/DataQualityTab';
import { AiInsightsTab } from './components/AiInsightsTab';
import { ExportCodeTab } from './components/ExportCodeTab';
import { DatasetState, ChatMessage } from './types/dataset';
import { parseCSVString, SAMPLE_CSV_DATA } from './utils/dataEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [dataset, setDataset] = useState<DatasetState | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // Function to load sample Superstore dataset
  const handleLoadSample = () => {
    try {
      const parsed = parseCSVString(SAMPLE_CSV_DATA, 'sample_superstore.csv');
      setDataset(parsed);
      setActiveTab('dashboard');
    } catch (err) {
      console.error('Failed to parse sample dataset', err);
    }
  };

  const handleClearDataset = () => {
    setDataset(null);
    setChatHistory([]);
    setActiveTab('home');
  };

  // Auto-load sample dataset on initial mount so users immediately see live data and charts
  useEffect(() => {
    if (!dataset) {
      try {
        const parsed = parseCSVString(SAMPLE_CSV_DATA, 'sample_superstore.csv');
        setDataset(parsed);
      } catch (err) {
        console.error('Initial sample load failed', err);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar with Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dataset={dataset}
        onLoadSample={handleLoadSample}
        onClearDataset={handleClearDataset}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pb-16">
        {activeTab === 'home' && (
          <HomeTab
            dataset={dataset}
            setActiveTab={setActiveTab}
            onLoadSample={handleLoadSample}
          />
        )}

        {activeTab === 'upload' && (
          <UploadTab
            dataset={dataset}
            setDataset={(ds) => {
              setDataset(ds);
              setActiveTab('dashboard');
            }}
            setActiveTab={setActiveTab}
            onLoadSample={handleLoadSample}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardTab
            dataset={dataset}
            setActiveTab={setActiveTab}
            onLoadSample={handleLoadSample}
          />
        )}

        {activeTab === 'ask' && (
          <AskDataTab
            dataset={dataset}
            chatHistory={chatHistory}
            setChatHistory={setChatHistory}
            onLoadSample={handleLoadSample}
          />
        )}

        {activeTab === 'explore' && (
          <ExploreDataTab dataset={dataset} onLoadSample={handleLoadSample} />
        )}

        {activeTab === 'sql' && (
          <SqlDetectiveTab dataset={dataset} onLoadSample={handleLoadSample} />
        )}

        {activeTab === 'quality' && (
          <DataQualityTab
            dataset={dataset}
            onLoadSample={handleLoadSample}
            onUpdateCleanedDataset={(cleanedRows) => {
              if (dataset) {
                setDataset({
                  ...dataset,
                  cleanedRows,
                });
              }
            }}
          />
        )}

        {activeTab === 'insights' && (
          <AiInsightsTab dataset={dataset} onLoadSample={handleLoadSample} />
        )}

        {activeTab === 'code' && <ExportCodeTab />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">DataGPT</span>
            <span>•</span>
            <span>AI-Powered Autonomous Data Analysis Assistant</span>
          </div>
          <div>
            <span>Verified Computation Architecture • 100% Mathematical Accuracy Guarantee</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
