import React from 'react';
import { ShieldCheck, Play, RefreshCw, AlertTriangle, Layers, Cpu, Sparkles, Database } from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  onRunBatch,
  onResetSeed,
  isRunning,
  pendingCount,
  exceptionsCount
}) {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'mandates', label: 'Mandates & Audit', count: pendingCount, countColor: 'bg-blue-500/20 text-blue-300' },
    { id: 'exceptions', label: 'Exceptions', count: exceptionsCount, countColor: 'bg-rose-500/20 text-rose-300' },
    { id: 'playground', label: 'AI Sandbox', icon: Sparkles, iconClass: 'text-amber-400' },
    { id: 'policy', label: 'Policy Matrix', icon: Cpu },
  ];

  return (
    <header className="border-b border-slate-800/80 bg-[#080E1A]/80 backdrop-blur-xl sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand / Logo */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm shadow-blue-500/10">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-white tracking-tight">
                MandateGuard
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-800 text-slate-400 border border-slate-700/60">
                For Razorpay
              </span>
            </div>
          </div>

          {/* Clean Segmented Navigation */}
          <nav className="flex items-center space-x-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150 flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {Icon && <Icon className={`h-3.5 w-3.5 ${tab.iconClass || ''}`} />}
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-bold ${tab.countColor}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={onResetSeed}
              title="Reset & re-seed 52 synthetic UPI Autopay records"
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent hover:border-slate-700/60 transition flex items-center space-x-1.5"
            >
              <Database className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-slate-300">Seed Data or Reset</span>
            </button>

            <button
              onClick={onRunBatch}
              disabled={isRunning}
              className={`px-3.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center space-x-1.5 shadow-sm ${
                isRunning
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 active:scale-95'
              }`}
            >
              {isRunning ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-300" />
                  <span className="hidden sm:inline">Processing...</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 fill-current" />
                  <span>Run Agent</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
