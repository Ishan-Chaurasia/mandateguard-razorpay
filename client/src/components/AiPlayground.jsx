import React, { useState } from 'react';
import { Sparkles, Send, ShieldCheck, CheckCircle2, MessageSquare, FileText, ArrowRight, Play, RefreshCw } from 'lucide-react';

const PRESET_TEST_CASES = [
  {
    label: 'Noisy Insufficient Liquidity',
    code: 'ISSUER DECLINED - RESTRICTED OR INSUFFICIENT LIQUIDITY ON PRESENTMENT',
    customer: 'Aarav Sharma',
    merchant: 'Cult.fit Elite',
    amount: 1499,
    attempts: 0,
    status: 'active'
  },
  {
    label: 'Transient CBS Timeout',
    code: 'NPCI RES: 92 ROUTING TIMEOUT ON ACQUIRER END',
    customer: 'Priya Patel',
    merchant: 'Netflix India',
    amount: 649,
    attempts: 1,
    status: 'active'
  },
  {
    label: 'Expired Mandate (Hard Gated)',
    code: 'NPCI: MANDATE VALIDITY EXPIRED ON 2026-08-15',
    customer: 'Rohan Mehta',
    merchant: 'Swiggy One',
    amount: 499,
    attempts: 0,
    status: 'expired'
  },
  {
    label: 'Customer Revoked on GPay',
    code: 'CUSTOMER BLOCKED AUTOPAY FROM BHIM / GPAY APP',
    customer: 'Sneha Reddy',
    merchant: 'Spotify Premium',
    amount: 999,
    attempts: 0,
    status: 'revoked'
  },
  {
    label: 'NPCI 3-Attempt Limit Ceiling',
    code: 'INSUFFICIENT_FUNDS (Attempt 3 already exhausted)',
    customer: 'Vikram Singh',
    merchant: 'Times Prime',
    amount: 2499,
    attempts: 3,
    status: 'active'
  }
];

export default function AiPlayground() {
  const [failureCode, setFailureCode] = useState(PRESET_TEST_CASES[0].code);
  const [customerName, setCustomerName] = useState(PRESET_TEST_CASES[0].customer);
  const [merchantName, setMerchantName] = useState(PRESET_TEST_CASES[0].merchant);
  const [amount, setAmount] = useState(PRESET_TEST_CASES[0].amount);
  const [attemptsUsed, setAttemptsUsed] = useState(PRESET_TEST_CASES[0].attempts);
  const [mandateStatus, setMandateStatus] = useState(PRESET_TEST_CASES[0].status);
  const [consecutiveTimeouts, setConsecutiveTimeouts] = useState(0);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/playground/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          failureCode,
          customerName,
          merchantName,
          amount,
          attemptsUsed,
          mandateStatus,
          consecutiveTimeouts
        })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Playground test failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset) => {
    setFailureCode(preset.code);
    setCustomerName(preset.customer);
    setMerchantName(preset.merchant);
    setAmount(preset.amount);
    setAttemptsUsed(preset.attempts);
    setMandateStatus(preset.status);
    setConsecutiveTimeouts(0);
    setResult(null);
  };

  return (
    <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Interactive Testbed
          </span>
          <span className="text-xs text-slate-400">Razorpay Buildathon Judge Sandbox</span>
        </div>
        <h3 className="text-xl font-bold text-white mt-1 flex items-center space-x-2">
          <span>AI Recovery Playground & Bank Code Simulator</span>
          <Sparkles className="h-4 w-4 text-amber-400" />
        </h3>
        <p className="text-xs text-slate-400">
          Inject arbitrary non-standard bank strings or edge cases to see real-time AI diagnosis, bounded policy evaluation, Hinglish WhatsApp generation, and compliance logging.
        </p>
      </div>

      {/* Preset Buttons */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-300">Quick Test Archetypes:</span>
        <div className="flex flex-wrap gap-2">
          {PRESET_TEST_CASES.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(preset)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition flex items-center space-x-1.5"
            >
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Raw Bank Failure Code / Error String
            </label>
            <textarea
              rows={2}
              value={failureCode}
              onChange={(e) => setFailureCode(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
              placeholder="e.g. U30, TIMEOUT_91, or custom noisy bank error..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Merchant Name</label>
              <input
                type="text"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Debit Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Attempts Used</label>
              <select
                value={attemptsUsed}
                onChange={(e) => setAttemptsUsed(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value={0}>0 (First Attempt)</option>
                <option value={1}>1 (Second Attempt)</option>
                <option value={2}>2 (Third Attempt)</option>
                <option value={3}>3 (NPCI Limit Reached)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Mandate Status</label>
              <select
                value={mandateStatus}
                onChange={(e) => setMandateStatus(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 capitalize"
              >
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="revoked">Revoked</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleTest}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-200" />
                  <span>Evaluating AI Recovery Loop...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>Execute Diagnostic & Policy Loop</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Output Results */}
      {result && (
        <div className="space-y-4 pt-2 animate-in fade-in duration-200">
          <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400">
            Agent Output & Explainability Matrix
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Diagnosis & Policy */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white">1. AI Root Cause Diagnosis</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-500/20 text-indigo-300">
                  {result.diagnosis?.classifier_type}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-slate-400">Classified Cause:</span>
                <span className="font-bold text-amber-300 font-mono capitalize">
                  {result.diagnosis?.root_cause?.replace('_', ' ')}
                </span>
                <span className="text-slate-500 font-mono">
                  ({Math.round((result.diagnosis?.confidence || 0.9) * 100)}% confidence)
                </span>
              </div>
              <p className="text-slate-300 italic bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                "{result.diagnosis?.reasoning}"
              </p>

              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">2. Bounded Policy Rule</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300">
                    {result.policyDecision?.policy_rule_id}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Action:</span>
                  <span className="font-bold text-cyan-300 uppercase">{result.policyDecision?.action_type}</span>
                </div>
                <div className="flex items-center space-x-1.5 text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Guardrail: {result.policyDecision?.guardrail_check}</span>
                </div>
              </div>
            </div>

            {/* Right: Hinglish WhatsApp Nudge & Compliance Log */}
            <div className="space-y-4">
              {/* WhatsApp Mockup */}
              {result.nudgeMessage ? (
                <div className="p-4 rounded-2xl bg-[#075E54]/20 border border-[#25D366]/30 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[#25D366] font-semibold">
                    <span className="flex items-center space-x-1.5">
                      <MessageSquare className="h-4 w-4" />
                      <span>3. Generated Hinglish Recovery Nudge</span>
                    </span>
                    <span className="text-[10px] text-slate-400">WhatsApp / SMS</span>
                  </div>
                  <div className="bg-[#128C7E]/25 p-3.5 rounded-xl text-xs text-white leading-relaxed border border-[#25D366]/20 font-sans">
                    {result.nudgeMessage}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 text-center py-6">
                  Direct retry picked; no customer message required for this cause.
                </div>
              )}

              {/* Compliance Log Note */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center space-x-1.5 text-blue-400 font-bold">
                  <FileText className="h-3.5 w-3.5" />
                  <span>4. Compliance Audit Narration Note</span>
                </div>
                <p className="text-slate-300 font-sans leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  {result.auditReasoning}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
