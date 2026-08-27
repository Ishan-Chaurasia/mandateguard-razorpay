import React, { useState, useEffect, useRef } from 'react';
import { Terminal, CheckCircle2, ShieldCheck, X, Sparkles, TrendingUp, RefreshCw } from 'lucide-react';

export default function LiveBatchStream({ isOpen, onClose, onComplete }) {
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(52);
  const [isDone, setIsDone] = useState(false);
  const [batchSummary, setBatchSummary] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setLogs([]);
      setProgress(0);
      setIsDone(false);
      setBatchSummary(null);
      return;
    }

    const eventSource = new EventSource('/api/batch/run-stream');

    eventSource.addEventListener('start', (e) => {
      const data = JSON.parse(e.data);
      setLogs((prev) => [...prev, { type: 'system', text: `🚀 ${data.message}` }]);
    });

    eventSource.addEventListener('item', (e) => {
      const item = JSON.parse(e.data);
      setProgress(item.index);
      setTotal(item.total);

      setLogs((prev) => [...prev, { type: 'item', data: item }]);

      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });

    eventSource.addEventListener('complete', (e) => {
      const summary = JSON.parse(e.data);
      setBatchSummary(summary);
      setIsDone(true);
      setLogs((prev) => [
        ...prev,
        {
          type: 'summary',
          text: `🎉 Batch Run Complete! Recovered ₹${summary.smartMetrics.recoveredAmount.toLocaleString('en-IN')} with 0 NPCI Violations.`
        }
      ]);
      eventSource.close();
      if (onComplete) onComplete(summary);
    });

    eventSource.addEventListener('error', (e) => {
      console.error('SSE Stream Error:', e);
      eventSource.close();
      setIsDone(true);
    });

    return () => {
      eventSource.close();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const percent = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0B1324] border border-slate-700 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white">Live Batch Recovery Pipeline</h3>
                {!isDone ? (
                  <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    <span>Live Processing</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    <span>Completed</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Evaluating 50+ failed charges: Ingest → Diagnose → Decide Policy → Recover → Audit Trail
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
            <span className="text-slate-300">
              Processed <span className="font-mono text-blue-400">{progress}</span> of <span className="font-mono">{total}</span> charges
            </span>
            <span className="font-mono text-emerald-400 font-semibold">{percent}%</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-150 rounded-full"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Live Stream Terminal View */}
        <div
          ref={scrollRef}
          className="p-4 sm:p-6 font-mono text-xs overflow-y-auto space-y-2 bg-[#060B14] flex-1 max-h-[450px]"
        >
          {logs.map((log, idx) => {
            if (log.type === 'system') {
              return (
                <div key={idx} className="text-blue-400 font-semibold py-1">
                  {log.text}
                </div>
              );
            }

            if (log.type === 'summary') {
              return (
                <div key={idx} className="text-emerald-400 font-bold p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl my-2">
                  {log.text}
                </div>
              );
            }

            const item = log.data;
            const isRecovered = item.status === 'recovered';
            const isBlocked = item.guardrail_check?.startsWith('BLOCKED_');
            const isManual = item.action_type === 'escalate_manual';

            return (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition space-y-1"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500">[{String(item.index).padStart(2, '0')}/{item.total}]</span>
                    <span className="text-slate-200 font-semibold">{item.mandate_id}</span>
                    <span className="text-blue-400 font-sans font-medium text-[11px] bg-blue-950/40 px-2 py-0.5 rounded border border-blue-800/40">
                      {item.merchant_name}
                    </span>
                    <span className="text-white font-bold">₹{item.amount}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400 text-[11px]">Cause:</span>
                    <span className="text-amber-300 font-semibold">{item.root_cause}</span>
                    <span className="text-slate-500 text-[10px]">({Math.round(item.confidence * 100)}%)</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pt-1 border-t border-slate-800/50">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">Policy:</span>
                    <span className="text-indigo-300 font-semibold">{item.policy_rule_id}</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-cyan-300 font-semibold">{item.action_type}</span>
                  </div>

                  <div>
                    {isRecovered ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                        ✓ ₹{item.recovered_amount} Recovered
                      </span>
                    ) : isBlocked ? (
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                        🛡️ Blocked by Guardrail (0 Violations)
                      </span>
                    ) : isManual ? (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                        ⚠️ Ops Queue ({item.policy_rule_id})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        Pending Execution
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {isDone && batchSummary && (
          <div className="p-4 sm:p-6 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4 text-xs">
              <div>
                <span className="text-slate-400">Recovered: </span>
                <span className="text-emerald-400 font-bold text-sm">
                  ₹{batchSummary.smartMetrics.recoveredAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="h-4 w-px bg-slate-700" />
              <div>
                <span className="text-slate-400">Uplift: </span>
                <span className="text-emerald-400 font-bold text-sm">
                  +{batchSummary.uplift.percent}%
                </span>
              </div>
              <div className="h-4 w-px bg-slate-700" />
              <div>
                <span className="text-slate-400">Compliance: </span>
                <span className="text-blue-400 font-bold text-sm">0 NPCI Violations</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition"
            >
              View Detailed Audit Trail
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
