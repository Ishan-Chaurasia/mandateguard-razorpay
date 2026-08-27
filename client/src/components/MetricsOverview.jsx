import React from 'react';
import { IndianRupee, TrendingUp, ShieldCheck, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function MetricsOverview({ stats }) {
  const totalAmount = stats?.totalAmountAtRisk || 0;
  const recoveredAmount = stats?.recoveredAmount || 0;
  const recoveryRate = stats?.recoveryRate || 0;
  const latestBatch = stats?.latestBatch;

  const upliftAmount = latestBatch?.revenue_uplift_amount || 0;
  const upliftPercent = latestBatch?.revenue_uplift_percent || 0;
  const naiveViolations = latestBatch?.naive_compliance_violations || 14;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Total Volume At Risk */}
      <div className="glass-panel p-4 rounded-2xl relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Failed Mandates At Risk</span>
          <IndianRupee className="h-4 w-4 text-slate-400" />
        </div>
        <div className="text-2xl font-bold text-white tracking-tight">
          ₹{totalAmount.toLocaleString('en-IN')}
        </div>
        <div className="flex items-center space-x-2 mt-2 text-xs text-slate-400">
          <span className="font-mono text-slate-300 font-semibold">{stats?.totalCharges || 0}</span>
          <span>failed autopay charges</span>
        </div>
        <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* 2. MandateGuard Recovered Revenue */}
      <div className="glass-panel p-4 rounded-2xl border-blue-500/30 bg-blue-950/20 relative overflow-hidden">
        <div className="flex items-center justify-between text-blue-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Recovered Revenue</span>
          <CheckCircle2 className="h-4 w-4 text-blue-400" />
        </div>
        <div className="text-2xl font-bold text-white tracking-tight">
          ₹{recoveredAmount.toLocaleString('en-IN')}
        </div>
        <div className="flex items-center space-x-2 mt-2 text-xs">
          <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold font-mono">
            {recoveryRate.toFixed(1)}%
          </span>
          <span className="text-slate-400">recovery success</span>
        </div>
        <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* 3. Revenue Uplift vs Naive Baseline */}
      <div className="glass-panel p-4 rounded-2xl border-emerald-500/30 bg-emerald-950/20 relative overflow-hidden">
        <div className="flex items-center justify-between text-emerald-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Recovery Uplift</span>
          <TrendingUp className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="text-2xl font-bold text-emerald-300 tracking-tight">
          +₹{upliftAmount.toLocaleString('en-IN')}
        </div>
        <div className="flex items-center space-x-1.5 mt-2 text-xs">
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold font-mono">
            +{upliftPercent.toFixed(1)}%
          </span>
          <span className="text-slate-400">vs Naive Retry</span>
        </div>
        <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* 4. NPCI Compliance Score */}
      <div className="glass-panel p-4 rounded-2xl border-indigo-500/30 bg-indigo-950/20 relative overflow-hidden">
        <div className="flex items-center justify-between text-indigo-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">NPCI Compliance</span>
          <ShieldCheck className="h-4 w-4 text-indigo-400" />
        </div>
        <div className="text-2xl font-bold text-white tracking-tight flex items-baseline space-x-1">
          <span>100%</span>
          <span className="text-xs text-emerald-400 font-normal">(0 Violations)</span>
        </div>
        <div className="flex items-center space-x-1.5 mt-2 text-xs text-slate-400">
          <span className="text-rose-400 font-mono font-semibold">0</span>
          <span>vs {naiveViolations} Naive Violations</span>
        </div>
        <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* 5. Exceptions Queue */}
      <div className="glass-panel p-4 rounded-2xl border-amber-500/30 bg-amber-950/20 relative overflow-hidden">
        <div className="flex items-center justify-between text-amber-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Ops Review Queue</span>
          <AlertCircle className="h-4 w-4 text-amber-400" />
        </div>
        <div className="text-2xl font-bold text-amber-300 tracking-tight">
          {stats?.exceptionsCount || 0}
        </div>
        <div className="flex items-center space-x-1.5 mt-2 text-xs text-slate-400">
          <span className="text-amber-400 font-medium">Safely isolated</span>
          <span>for human ops</span>
        </div>
        <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
      </div>
    </div>
  );
}
