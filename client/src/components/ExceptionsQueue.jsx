import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Send, ShieldAlert, Clock, ArrowRight, UserCheck } from 'lucide-react';

export default function ExceptionsQueue({ onRefreshStats }) {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchExceptions = () => {
    setLoading(true);
    fetch('/api/exceptions')
      .then((res) => res.json())
      .then((data) => {
        setExceptions(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch exceptions:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchExceptions();
  }, []);

  const handleResolve = async (actionId, resolutionType) => {
    setResolvingId(actionId);
    try {
      const res = await fetch(`/api/exceptions/${actionId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolutionAction: resolutionType,
          notes: `Merchant Operations Specialist manually selected: ${resolutionType}`
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Action "${resolutionType}" applied successfully! Audit entry recorded.`);
        setTimeout(() => setSuccessMsg(null), 4000);
        fetchExceptions();
        if (onRefreshStats) onRefreshStats();
      }
    } catch (err) {
      console.error('Failed to resolve exception:', err);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Merchant Operations
            </span>
            <span className="text-xs text-slate-400">Low-Confidence & Guardrail Escalations</span>
          </div>
          <h3 className="text-xl font-bold text-white mt-1">Exceptions & Manual Review Queue</h3>
          <p className="text-xs text-slate-400">
            Cases where AI confidence is low (&lt;70%) or repeated bank timeouts exceeded safe automated retry limits.
          </p>
        </div>

        <button
          onClick={fetchExceptions}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition w-fit"
        >
          Refresh Queue
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Exception Cards */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
          <Clock className="h-4 w-4 animate-spin text-amber-400" />
          <span>Loading exceptions queue...</span>
        </div>
      ) : exceptions.length === 0 ? (
        <div className="p-10 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
          <div className="h-10 w-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-bold text-white">Exceptions Queue is Clear!</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            All failed charges have been classified with high confidence and processed through deterministic policy guardrails.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {exceptions.map((item) => (
            <div
              key={item.action_id}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-sm">{item.customer_name}</span>
                      <span className="text-xs text-slate-400 font-mono">({item.mandate_id})</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Merchant: <span className="text-slate-200">{item.merchant_name}</span> &bull; Amount: <span className="font-mono font-bold text-white">₹{item.amount}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    Rule: {item.policy_rule_id}
                  </span>
                </div>
              </div>

              {/* Diagnosis details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 font-mono space-y-1">
                  <div className="text-slate-400 text-[11px]">Raw Bank Failure Code:</div>
                  <div className="text-amber-300 font-semibold">{item.failure_code}</div>
                  <div className="text-slate-500 text-[10px] truncate">{item.raw_bank_response}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">AI Diagnosis Reason:</span>
                    <span className="text-amber-400 font-mono font-bold">{Math.round(item.confidence * 100)}% Conf</span>
                  </div>
                  <div className="text-slate-200 italic">"{item.diagnosis_reasoning}"</div>
                </div>
              </div>

              {/* Manual Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => handleResolve(item.action_id, 'FORCE_RETRY_T_PLUS_1H')}
                  disabled={resolvingId === item.action_id}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition"
                >
                  Approve 1-Time Retry
                </button>

                <button
                  onClick={() => handleResolve(item.action_id, 'SEND_DIRECT_PAY_LINK')}
                  disabled={resolvingId === item.action_id}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition"
                >
                  Send Payment Link (WhatsApp)
                </button>

                <button
                  onClick={() => handleResolve(item.action_id, 'MARK_UNRECOVERABLE_TERMINAL')}
                  disabled={resolvingId === item.action_id}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                >
                  Mark Terminal (0 Retries)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
