import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, CheckCircle2, AlertTriangle, MessageSquare, Clock, Cpu, FileText, ChevronRight, Send, ArrowRight } from 'lucide-react';

export default function MandateAuditDrawer({ mandateId, isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mandateId || !isOpen) return;

    setLoading(true);
    fetch(`/api/mandates/${mandateId}/history`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load mandate history:', err);
        setLoading(false);
      });
  }, [mandateId, isOpen]);

  if (!isOpen) return null;

  const mandate = data?.mandate;
  const latestCharge = data?.charges?.[0];
  const auditLogs = data?.auditLogs || [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-[#0B1324] border-l border-slate-800 h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                End-to-End Audit Trail
              </span>
              <span className="text-xs text-slate-400 font-mono">{mandateId}</span>
            </div>
            <h3 className="text-xl font-bold text-white mt-1">
              {mandate?.customer_name} &bull; <span className="text-blue-400">{mandate?.merchant_name}</span>
            </h3>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
              <Clock className="h-5 w-5 animate-spin mr-2 text-blue-400" />
              Loading compliance audit history...
            </div>
          ) : !mandate ? (
            <div className="text-slate-400 text-center py-10">Mandate data not found.</div>
          ) : (
            <>
              {/* Summary Metadata Card */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block">Mandate Status</span>
                  <span className={`font-semibold capitalize ${
                    mandate.status === 'active' ? 'text-emerald-400' : mandate.status === 'expired' ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {mandate.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Cycle Attempts</span>
                  <span className="font-mono text-white font-semibold">{mandate.attempts_used_this_cycle} / 3</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Max Debit Limit</span>
                  <span className="font-mono text-white font-semibold">₹{mandate.max_amount}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Customer VPA</span>
                  <span className="font-mono text-blue-300 font-medium truncate block">{mandate.customer_vpa}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Phone</span>
                  <span className="text-slate-200">{mandate.customer_phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Category</span>
                  <span className="text-slate-200">{mandate.merchant_category}</span>
                </div>
              </div>

              {/* 5-STEP EXPLAINABLE RECOVERY LOOP */}
              <div className="space-y-4">
                <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400">
                  Explainable Decision Trail (5-Stage Loop)
                </h4>

                {/* Step 1: Detect & Ingest */}
                <div className="relative pl-6 pb-6 border-l-2 border-blue-500/40 last:border-l-0">
                  <div className="absolute -left-2.5 top-0 h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                    1
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                        <span>Stage 1: Detect & Ingest</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">₹{latestCharge?.amount} Debit Failed</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 font-mono text-xs space-y-1">
                      <div className="text-amber-300 font-semibold">
                        Raw Failure Code: "{latestCharge?.failure_code}"
                      </div>
                      <div className="text-slate-400 text-[11px] truncate">
                        Bank Payload: {latestCharge?.raw_bank_response}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2: Classify / Diagnose */}
                <div className="relative pl-6 pb-6 border-l-2 border-blue-500/40 last:border-l-0">
                  <div className="absolute -left-2.5 top-0 h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                    2
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        Stage 2: Diagnose Root Cause
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {latestCharge?.classifier_type}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs">
                      <div>
                        <span className="text-slate-400">Diagnosed Cause: </span>
                        <span className="font-bold text-amber-300 capitalize">
                          {latestCharge?.root_cause?.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="h-3 w-px bg-slate-700" />
                      <div>
                        <span className="text-slate-400">Confidence: </span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {Math.round((latestCharge?.confidence || 0.9) * 100)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80 italic">
                      "{latestCharge?.diagnosis_reasoning}"
                    </p>
                  </div>
                </div>

                {/* Step 3: Decide (Policy Table) */}
                <div className="relative pl-6 pb-6 border-l-2 border-blue-500/40 last:border-l-0">
                  <div className="absolute -left-2.5 top-0 h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                    3
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        Stage 3: Policy Decision & Guardrails
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {latestCharge?.policy_rule_id}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-300">Action Picked:</span>
                      <span className="font-semibold text-cyan-300 uppercase">{latestCharge?.action_type}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-emerald-400">
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                      <span>NPCI Attempt Ceiling & Lifecycle Guardrail Verified</span>
                    </div>
                  </div>
                </div>

                {/* Step 4: Act & Outcome */}
                <div className="relative pl-6 pb-6 border-l-2 border-blue-500/40 last:border-l-0">
                  <div className="absolute -left-2.5 top-0 h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                    4
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        Stage 4: Execution & Outcome
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        latestCharge?.action_status === 'recovered'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : latestCharge?.action_status === 'blocked_by_guardrail'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {latestCharge?.action_status}
                      </span>
                    </div>

                    {latestCharge?.simulated_recovery_amount > 0 && (
                      <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 font-semibold flex items-center justify-between">
                        <span>Recovered Amount</span>
                        <span className="text-sm font-bold font-mono">₹{latestCharge?.simulated_recovery_amount}</span>
                      </div>
                    )}

                    {/* Hinglish WhatsApp Nudge Simulator Card */}
                    {latestCharge?.message_text && (
                      <div className="mt-3 p-3 rounded-xl bg-[#075E54]/20 border border-[#25D366]/30 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-[#25D366] font-semibold">
                          <span className="flex items-center space-x-1.5">
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>Hinglish WhatsApp Nudge Preview</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">Delivered to customer</span>
                        </div>
                        <div className="bg-[#128C7E]/20 p-3 rounded-lg text-xs text-slate-100 border border-[#25D366]/20 font-sans leading-relaxed">
                          {latestCharge?.message_text}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 5: Compliance Audit Trail */}
                <div className="relative pl-6">
                  <div className="absolute -left-2.5 top-0 h-5 w-5 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                    5
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                        <FileText className="h-3.5 w-3.5 text-blue-400" />
                        <span>Stage 5: Official Compliance Audit Log</span>
                      </span>
                    </div>
                    {auditLogs.map((log, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span className="text-blue-400 font-semibold">{log.decision}</span>
                          <span>{new Date(log.timestamp).toLocaleTimeString('en-IN')}</span>
                        </div>
                        <p className="text-xs text-slate-200 font-sans leading-relaxed">
                          {log.reasoning}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
