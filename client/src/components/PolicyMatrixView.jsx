import React from 'react';
import { ShieldCheck, Cpu, CheckCircle2, AlertOctagon, Lock } from 'lucide-react';

const POLICY_RULES = [
  {
    ruleId: 'RULE_IB_01',
    rootCause: 'insufficient_balance',
    attemptsCondition: '< 3 attempts',
    action: 'Smart Retry (Salary Window)',
    timing: '1st-5th of month or T+2 days (11:30 AM)',
    guardrail: 'Never retry more than 3x per billing cycle. Stops uncollectible debt churn.',
    complianceLevel: 'High'
  },
  {
    ruleId: 'RULE_BT_01',
    rootCause: 'bank_timeout',
    attemptsCondition: '< 3 attempts (consecutive timeouts < 2)',
    action: 'Immediate Retry',
    timing: 'T+15 minutes',
    guardrail: 'Cap retries; if 2 consecutive timeouts occur, escalate immediately to manual ops.',
    complianceLevel: 'High'
  },
  {
    ruleId: 'RULE_ME_01',
    rootCause: 'mandate_expired',
    attemptsCondition: 'Any attempts',
    action: 'Renewal Nudge (Hinglish Message)',
    timing: 'Immediate WhatsApp / SMS',
    guardrail: 'Retrying an expired mandate is a hard regulatory violation — direct debit is strictly terminal.',
    complianceLevel: 'Critical'
  },
  {
    ruleId: 'RULE_MR_01',
    rootCause: 'mandate_revoked',
    attemptsCondition: 'Any attempts',
    action: 'Terminal State (Win-back Only)',
    timing: 'No automated debits',
    guardrail: 'Compliance-Critical: Never attempt to charge a revoked mandate under RBI guidelines.',
    complianceLevel: 'Strict Compliance'
  },
  {
    ruleId: 'RULE_TF_01',
    rootCause: 'technical_failure',
    attemptsCondition: '< 2 attempts',
    action: 'Gateway Retry',
    timing: 'T+1 hour',
    guardrail: 'Escalate to merchant engineering if 2 consecutive gateway fails occur.',
    complianceLevel: 'Medium'
  },
  {
    ruleId: 'RULE_UNK_01',
    rootCause: 'unknown / low confidence',
    attemptsCondition: 'Any',
    action: 'Escalate to Manual Queue',
    timing: 'Ops Review',
    guardrail: 'Never auto-retry on low classifier confidence (<70%). Requires human confirmation.',
    complianceLevel: 'Safety Gate'
  }
];

export default function PolicyMatrixView() {
  return (
    <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-6">
      <div>
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
            NPCI Regulatory Framework
          </span>
          <span className="text-xs text-slate-400">Deterministic Guardrails & Gating</span>
        </div>
        <h3 className="text-xl font-bold text-white mt-1 flex items-center space-x-2">
          <span>Decision Policy Table & Guardrail Matrix</span>
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
        </h3>
        <p className="text-xs text-slate-400">
          This table is MandateGuard's explainability layer — every AuditLogEntry references exactly which row fired and why.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold text-[11px] border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4">Rule ID</th>
              <th className="py-3.5 px-4">Root Cause</th>
              <th className="py-3.5 px-4">Attempt Ceiling</th>
              <th className="py-3.5 px-4">Action & Timing</th>
              <th className="py-3.5 px-4">Regulatory Guardrail</th>
              <th className="py-3.5 px-4 text-right">Standard</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {POLICY_RULES.map((rule) => (
              <tr key={rule.ruleId} className="hover:bg-slate-900/40 transition">
                <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                  {rule.ruleId}
                </td>

                <td className="py-3.5 px-4 font-semibold text-white capitalize">
                  {rule.rootCause.replace('_', ' ')}
                </td>

                <td className="py-3.5 px-4 font-mono text-slate-300">
                  {rule.attemptsCondition}
                </td>

                <td className="py-3.5 px-4">
                  <div className="font-semibold text-cyan-300">{rule.action}</div>
                  <div className="text-[11px] text-slate-400">{rule.timing}</div>
                </td>

                <td className="py-3.5 px-4 text-slate-300 max-w-sm">
                  {rule.guardrail}
                </td>

                <td className="py-3.5 px-4 text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    rule.complianceLevel.includes('Critical') || rule.complianceLevel.includes('Strict')
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {rule.complianceLevel}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
