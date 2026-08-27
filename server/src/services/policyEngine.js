/**
 * MandateGuard Bounded & Gated Decision Policy Engine
 * Implements Section 6.3 of the Razorpay Buildathon Specification:
 * Deterministic policy table with NPCI retry ceiling and mandate lifecycle guardrails.
 */

export const NPCI_MAX_ATTEMPTS_PER_CYCLE = 3;
export const MAX_CONSECUTIVE_TIMEOUTS = 2;
export const MIN_CONFIDENCE_THRESHOLD = 0.70;

export function evaluatePolicyDecision({
  diagnosis,
  mandate,
  chargeAttempt
}) {
  const { root_cause, confidence, reasoning } = diagnosis;
  const attemptsUsed = mandate.attempts_used_this_cycle || 0;
  const consecutiveTimeouts = mandate.consecutive_timeouts || 0;
  const mandateStatus = mandate.status || 'active';

  const now = new Date();

  // -------------------------------------------------------------
  // GUARDRAIL 1: MANDATE LIFECYCLE REVOCATION (Compliance-Critical)
  // -------------------------------------------------------------
  if (mandateStatus === 'revoked' || root_cause === 'mandate_revoked') {
    return {
      action_type: 'no_action_terminal',
      policy_rule_id: 'RULE_MR_01',
      guardrail_check: 'BLOCKED_LIFECYCLE_REVOKED',
      scheduled_at: null,
      message_required: true,
      nudge_type: 'winback',
      guardrail_notes: 'Compliance-Critical: Customer revoked mandate. Zero debit attempts permitted by RBI/NPCI. Logged for non-invasive win-back only.',
      is_compliant: true
    };
  }

  // -------------------------------------------------------------
  // GUARDRAIL 2: MANDATE LIFECYCLE EXPIRATION
  // -------------------------------------------------------------
  if (mandateStatus === 'expired' || root_cause === 'mandate_expired') {
    return {
      action_type: 'nudge_message',
      policy_rule_id: 'RULE_ME_01',
      guardrail_check: 'BLOCKED_LIFECYCLE_EXPIRED',
      scheduled_at: null,
      message_required: true,
      nudge_type: 'renewal',
      guardrail_notes: 'Retrying an expired mandate is a hard regulatory violation. Direct debit suppressed; dispatched 1-click Hinglish renewal nudge.',
      is_compliant: true
    };
  }

  // -------------------------------------------------------------
  // GUARDRAIL 3: NPCI MAXIMUM ATTEMPT CEILING (3x per billing cycle)
  // -------------------------------------------------------------
  if (attemptsUsed >= NPCI_MAX_ATTEMPTS_PER_CYCLE) {
    return {
      action_type: 'no_action_terminal',
      policy_rule_id: 'RULE_NPCI_CAP_01',
      guardrail_check: 'BLOCKED_NPCI_LIMIT',
      scheduled_at: null,
      message_required: true,
      nudge_type: 'manual_payment',
      guardrail_notes: `NPCI Guardrail Triggered: Mandate has reached maximum limit of ${attemptsUsed}/${NPCI_MAX_ATTEMPTS_PER_CYCLE} attempts this cycle. Further retries blocked.`,
      is_compliant: true
    };
  }

  // -------------------------------------------------------------
  // GUARDRAIL 4: UNKNOWN OR LOW CLASSIFIER CONFIDENCE
  // -------------------------------------------------------------
  if (root_cause === 'unknown' || confidence < MIN_CONFIDENCE_THRESHOLD) {
    return {
      action_type: 'escalate_manual',
      policy_rule_id: 'RULE_UNK_01',
      guardrail_check: 'ESCALATED_LOW_CONFIDENCE',
      scheduled_at: null,
      message_required: false,
      nudge_type: null,
      guardrail_notes: `Low classifier confidence (${Math.round(confidence * 100)}%) or unknown failure code. Automated retry suspended; routed to Merchant Ops queue.`,
      is_compliant: true
    };
  }

  // -------------------------------------------------------------
  // RULE 1: INSUFFICIENT BALANCE (Attempts < 3)
  // -------------------------------------------------------------
  if (root_cause === 'insufficient_balance') {
    // Schedule for Salary Window (1st-5th of month) or T+2 days
    const currentDay = now.getDate();
    let scheduledDate;

    if (currentDay >= 25 || currentDay <= 3) {
      // Near salary cycle (end of month to 1st) -> schedule for 1st of month 10:00 AM
      const targetMonth = currentDay >= 25 ? now.getMonth() + 1 : now.getMonth();
      const targetYear = now.getFullYear();
      scheduledDate = new Date(targetYear, targetMonth, 1, 10, 0, 0);
    } else {
      // General salary window: T+2 days at 11:30 AM (optimal debit liquidity hour in India)
      scheduledDate = new Date(now.getTime() + 2 * 86400000);
      scheduledDate.setHours(11, 30, 0, 0);
    }

    return {
      action_type: 'smart_retry',
      policy_rule_id: 'RULE_IB_01',
      guardrail_check: 'PASSED',
      scheduled_at: scheduledDate.toISOString(),
      message_required: true,
      nudge_type: 'balance_alert',
      guardrail_notes: `Smart Retry scheduled for ${scheduledDate.toLocaleDateString('en-IN')} (Salary/liquidity window). Attempt ${attemptsUsed + 1}/${NPCI_MAX_ATTEMPTS_PER_CYCLE}.`,
      is_compliant: true
    };
  }

  // -------------------------------------------------------------
  // RULE 2: BANK / ISSUER TIMEOUT (Attempts < 3)
  // -------------------------------------------------------------
  if (root_cause === 'bank_timeout') {
    if (consecutiveTimeouts >= MAX_CONSECUTIVE_TIMEOUTS) {
      return {
        action_type: 'escalate_manual',
        policy_rule_id: 'RULE_BT_GUARD',
        guardrail_check: 'ESCALATED_REPEATED_TIMEOUT',
        scheduled_at: null,
        message_required: false,
        nudge_type: null,
        guardrail_notes: `Consecutive Timeout Guardrail: Issuer bank failed with ${consecutiveTimeouts} repeated timeouts. Escalated to prevent customer friction.`,
        is_compliant: true
      };
    }

    // Immediate retry: T+15 minutes
    const retryDate = new Date(now.getTime() + 15 * 60 * 1000);
    return {
      action_type: 'smart_retry',
      policy_rule_id: 'RULE_BT_01',
      guardrail_check: 'PASSED',
      scheduled_at: retryDate.toISOString(),
      message_required: false,
      nudge_type: null,
      guardrail_notes: `Transient bank timeout detected. Scheduled immediate retry at T+15m. Attempt ${attemptsUsed + 1}/${NPCI_MAX_ATTEMPTS_PER_CYCLE}.`,
      is_compliant: true
    };
  }

  // -------------------------------------------------------------
  // RULE 5: TECHNICAL FAILURE (Gateway / Network)
  // -------------------------------------------------------------
  if (root_cause === 'technical_failure') {
    if (attemptsUsed >= 2) {
      return {
        action_type: 'escalate_manual',
        policy_rule_id: 'RULE_TF_GUARD',
        guardrail_check: 'ESCALATED_TECHNICAL_THRESHOLD',
        scheduled_at: null,
        message_required: false,
        nudge_type: null,
        guardrail_notes: `Technical failure threshold reached (${attemptsUsed} fails). Escalated to technical support engineering.`,
        is_compliant: true
      };
    }

    // Retry in 1 hour
    const retryDate = new Date(now.getTime() + 60 * 60 * 1000);
    return {
      action_type: 'smart_retry',
      policy_rule_id: 'RULE_TF_01',
      guardrail_check: 'PASSED',
      scheduled_at: retryDate.toISOString(),
      message_required: false,
      nudge_type: null,
      guardrail_notes: `Gateway glitch diagnosed. Scheduled retry in 1 hour. Attempt ${attemptsUsed + 1}/${NPCI_MAX_ATTEMPTS_PER_CYCLE}.`,
      is_compliant: true
    };
  }

  // Fallback catch-all
  return {
    action_type: 'escalate_manual',
    policy_rule_id: 'RULE_DEFAULT_MANUAL',
    guardrail_check: 'ESCALATED_FALLBACK',
    scheduled_at: null,
    message_required: false,
    nudge_type: null,
    guardrail_notes: 'Routed to merchant manual operations.',
    is_compliant: true
  };
}
