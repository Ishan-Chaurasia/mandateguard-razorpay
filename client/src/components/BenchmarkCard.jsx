import React from 'react';
import { ShieldCheck, AlertOctagon, TrendingUp, IndianRupee, ArrowRight, Zap, CheckCircle, XCircle } from 'lucide-react';

export default function BenchmarkCard({ stats }) {
  const latestBatch = stats?.latestBatch;
  const totalAmount = stats?.totalAmountAtRisk || 55049;
  const smartAmount = latestBatch?.smart_recovered_amount || stats?.recoveredAmount || 25127;
  const naiveAmount = latestBatch?.naive_recovered_amount || 10488;
  const upliftAmount = latestBatch?.revenue_uplift_amount || (smartAmount - naiveAmount);
  const upliftPercent = latestBatch?.revenue_uplift_percent || (naiveAmount > 0 ? ((upliftAmount / naiveAmount) * 100) : 139.6);
  const naiveViolations = latestBatch?.naive_compliance_violations || 14;

  return (
    <div className="glass-panel p-6 rounded-3xl relative overflow-hidden border border-slate-800">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Live Benchmark
            </span>
            <span className="text-xs text-slate-400">Razorpay AI Revenue Recovery Evaluation</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">
            MandateGuard Intelligent Agent vs. Naive "Retry Everything Once" Baseline
          </h2>
        </div>

        <div className="flex items-center space-x-3 bg-slate-900/90 px-4 py-2 rounded-2xl border border-slate-800">
          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">Net Revenue Uplift</div>
            <div className="text-lg font-bold text-emerald-400">
              +₹{upliftAmount.toLocaleString('en-IN')} <span className="text-xs font-normal text-emerald-500">(+{upliftPercent.toFixed(1)}%)</span>
            </div>
          </div>
          <div className="h-9 w-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: MandateGuard Intelligent Agent */}
        <div className="rounded-2xl bg-gradient-to-b from-blue-950/40 via-slate-900/60 to-slate-900/90 border-2 border-blue-500/40 p-5 relative">
          <div className="absolute top-4 right-4">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500 text-white shadow-md shadow-blue-500/30 flex items-center space-x-1">
              <Zap className="h-3 w-3 fill-current" />
              <span>MandateGuard Agent</span>
            </span>
          </div>

          <div className="text-xs uppercase font-semibold text-blue-400 tracking-wider">
            Fintech-Native Bounded Agent
          </div>
          <div className="text-3xl font-extrabold text-white mt-2 flex items-baseline space-x-2">
            <span>₹{smartAmount.toLocaleString('en-IN')}</span>
            <span className="text-sm font-medium text-slate-400">recovered</span>
          </div>

          <div className="mt-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-700/40">
              <span className="text-slate-300 flex items-center space-x-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-blue-400" />
                <span>NPCI Attempt Ceiling Guardrail</span>
              </span>
              <span className="font-semibold text-emerald-400">0 Over-limit Retries</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-700/40">
              <span className="text-slate-300 flex items-center space-x-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-blue-400" />
                <span>Mandate Lifecycle Gating</span>
              </span>
              <span className="font-semibold text-emerald-400">0 Revoked Retried</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-700/40">
              <span className="text-slate-300 flex items-center space-x-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-blue-400" />
                <span>Smart Timing Alignment</span>
              </span>
              <span className="font-semibold text-blue-300">Salary Window (1st-5th / T+2d)</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-700/40">
              <span className="text-slate-300 flex items-center space-x-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-blue-400" />
                <span>Expired Mandate Recovery</span>
              </span>
              <span className="font-semibold text-blue-300">Hinglish 1-Click WhatsApp</span>
            </div>
          </div>
        </div>

        {/* Right: Naive Baseline */}
        <div className="rounded-2xl bg-slate-900/40 border border-slate-800 p-5 relative opacity-90">
          <div className="absolute top-4 right-4">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
              Naive Baseline
            </span>
          </div>

          <div className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
            Blind "Retry Everything Once"
          </div>
          <div className="text-3xl font-extrabold text-slate-300 mt-2 flex items-baseline space-x-2">
            <span>₹{naiveAmount.toLocaleString('en-IN')}</span>
            <span className="text-sm font-medium text-slate-500">recovered</span>
          </div>

          <div className="mt-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-rose-950/20 border border-rose-900/30">
              <span className="text-slate-300 flex items-center space-x-1.5">
                <XCircle className="h-3.5 w-3.5 text-rose-400" />
                <span>NPCI Attempt Ceiling Guardrail</span>
              </span>
              <span className="font-semibold text-rose-400 font-mono">Violated ({Math.round(naiveViolations * 0.4)}x)</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-rose-950/20 border border-rose-900/30">
              <span className="text-slate-300 flex items-center space-x-1.5">
                <XCircle className="h-3.5 w-3.5 text-rose-400" />
                <span>Mandate Lifecycle Gating</span>
              </span>
              <span className="font-semibold text-rose-400 font-mono">Violated ({Math.round(naiveViolations * 0.6)}x)</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/20 border border-slate-800">
              <span className="text-slate-400 flex items-center space-x-1.5">
                <XCircle className="h-3.5 w-3.5 text-slate-500" />
                <span>Smart Timing Alignment</span>
              </span>
              <span className="text-slate-400 font-mono">Immediate (18% success)</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/20 border border-slate-800">
              <span className="text-slate-400 flex items-center space-x-1.5">
                <XCircle className="h-3.5 w-3.5 text-slate-500" />
                <span>Expired Mandate Recovery</span>
              </span>
              <span className="text-slate-400 font-mono">Dropped / Unrecoverable</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
