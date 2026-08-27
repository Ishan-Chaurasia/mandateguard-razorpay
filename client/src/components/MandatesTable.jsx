import React, { useState, useMemo } from 'react';
import { Search, Filter, ChevronRight, CheckCircle2, ShieldCheck, AlertTriangle, MessageSquare, Clock, ArrowUpDown } from 'lucide-react';

export default function MandatesTable({ mandates, onSelectMandate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [rootCauseFilter, setRootCauseFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredData = useMemo(() => {
    return (mandates || []).filter((item) => {
      // Search
      const searchStr = `${item.mandate_id} ${item.customer_name} ${item.merchant_name} ${item.failure_code}`.toLowerCase();
      if (searchTerm && !searchStr.includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Root Cause Filter
      if (rootCauseFilter !== 'ALL' && item.root_cause !== rootCauseFilter) {
        return false;
      }

      // Action Filter
      if (actionFilter !== 'ALL' && item.action_type !== actionFilter) {
        return false;
      }

      // Status Filter
      if (statusFilter !== 'ALL' && item.action_status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [mandates, searchTerm, rootCauseFilter, actionFilter, statusFilter]);

  return (
    <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
      {/* Table Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white">Mandates & Recovery Actions</h3>
          <p className="text-xs text-slate-400">
            Click any mandate row to inspect the complete 5-stage explainable audit timeline
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search UMN, customer, code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-48 sm:w-60"
            />
          </div>

          {/* Root Cause Filter */}
          <select
            value={rootCauseFilter}
            onChange={(e) => setRootCauseFilter(e.target.value)}
            className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Root Causes</option>
            <option value="insufficient_balance">Insufficient Balance</option>
            <option value="bank_timeout">Bank Timeout</option>
            <option value="mandate_expired">Mandate Expired</option>
            <option value="mandate_revoked">Mandate Revoked</option>
            <option value="technical_failure">Technical Failure</option>
            <option value="unknown">Unknown / Low Conf</option>
          </select>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Actions</option>
            <option value="smart_retry">Smart Retry</option>
            <option value="nudge_message">Nudge Message</option>
            <option value="no_action_terminal">Terminal (0 Retries)</option>
            <option value="escalate_manual">Manual Queue</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/40">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold text-[11px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Mandate (UMN)</th>
              <th className="py-3 px-4">Customer & Merchant</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Raw Failure Code</th>
              <th className="py-3 px-4">Diagnosed Cause</th>
              <th className="py-3 px-4">Policy Action</th>
              <th className="py-3 px-4">Outcome</th>
              <th className="py-3 px-4 text-right">Audit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  No matching mandate charge records found.
                </td>
              </tr>
            ) : (
              filteredData.map((row) => {
                const isRecovered = row.action_status === 'recovered';
                const isBlocked = row.action_status === 'blocked_by_guardrail';
                const isManual = row.action_type === 'escalate_manual';

                return (
                  <tr
                    key={row.charge_id}
                    onClick={() => onSelectMandate(row.mandate_id)}
                    className="hover:bg-slate-900/60 transition cursor-pointer group"
                  >
                    {/* Mandate ID */}
                    <td className="py-3 px-4 font-mono text-slate-300 font-medium">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-white group-hover:text-blue-400 transition">{row.mandate_id}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({row.attempts_used_this_cycle}/3)</span>
                      </div>
                    </td>

                    {/* Customer & Merchant */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{row.customer_name}</div>
                      <div className="text-[11px] text-slate-400">{row.merchant_name}</div>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 font-bold text-white font-mono">
                      ₹{row.amount}
                    </td>

                    {/* Raw Failure Code */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-300 max-w-[160px] truncate" title={row.failure_code}>
                      {row.failure_code}
                    </td>

                    {/* Diagnosed Cause */}
                    <td className="py-3 px-4">
                      {row.root_cause ? (
                        <div className="flex items-center space-x-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            row.root_cause === 'insufficient_balance' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : row.root_cause === 'bank_timeout' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : row.root_cause === 'mandate_expired' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : row.root_cause === 'mandate_revoked' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : row.root_cause === 'technical_failure' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-slate-700 text-slate-300'
                          }`}>
                            {row.root_cause.replace('_', ' ')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs italic">Pending Run</span>
                      )}
                    </td>

                    {/* Policy Action */}
                    <td className="py-3 px-4">
                      {row.action_type ? (
                        <div>
                          <span className="font-semibold text-slate-200 uppercase text-[11px]">
                            {row.action_type.replace('_', ' ')}
                          </span>
                          <span className="block text-[10px] font-mono text-indigo-400">{row.policy_rule_id}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs italic">-</span>
                      )}
                    </td>

                    {/* Outcome */}
                    <td className="py-3 px-4">
                      {isRecovered ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1 w-fit">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>₹{row.simulated_recovery_amount} Recovered</span>
                        </span>
                      ) : isBlocked ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/25 flex items-center space-x-1 w-fit">
                          <ShieldCheck className="h-3 w-3" />
                          <span>0 Violations (Terminal)</span>
                        </span>
                      ) : isManual ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1 w-fit">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Ops Review</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-medium">
                          {row.action_status || 'Pending Batch'}
                        </span>
                      )}
                    </td>

                    {/* Audit Link */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end text-slate-400 group-hover:text-blue-400 transition">
                        <span className="text-[11px] font-semibold hidden sm:inline mr-1">Inspect</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
