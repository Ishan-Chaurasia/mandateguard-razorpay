/**
 * MandateGuard Simulated Execution & Benchmark Engine
 * Simulates real-world recovery outcomes and benchmarks MandateGuard against the Naive Baseline ("Retry everything once immediately").
 */

/**
 * Simulates recovery outcome for an individual MandateGuard action
 */
export function simulateActionOutcome({ actionType, rootCause, amount, guardrailCheck }) {
  // If action is terminal / blocked by compliance guardrail
  if (actionType === 'no_action_terminal' || guardrailCheck.startsWith('BLOCKED_')) {
    return {
      status: 'blocked_by_guardrail',
      recovered: false,
      recovered_amount: 0,
      notes: 'No direct debit attempted. 100% compliant with NPCI rules.'
    };
  }

  // If escalated to manual review queue
  if (actionType === 'escalate_manual') {
    return {
      status: 'manual_review',
      recovered: false,
      recovered_amount: 0,
      notes: 'Pending human operations review in exceptions queue.'
    };
  }

  // If smart retry (scheduled based on cause)
  if (actionType === 'smart_retry') {
    let successProbability = 0.75;

    if (rootCause === 'insufficient_balance') {
      // Smart salary-window retry: High success rate because debit is aligned with Indian liquidity cycles
      successProbability = 0.78;
    } else if (rootCause === 'bank_timeout') {
      // Immediate transient retry: High success once issuer switch clears
      successProbability = 0.85;
    } else if (rootCause === 'technical_failure') {
      // Gateway error resolved: High success
      successProbability = 0.80;
    }

    // Deterministic simulation based on amount/id seed or controlled probability
    const isSuccess = Math.random() < successProbability;
    return {
      status: isSuccess ? 'recovered' : 'failed',
      recovered: isSuccess,
      recovered_amount: isSuccess ? amount : 0,
      notes: isSuccess
        ? `Smart retry executed successfully. ₹${amount} recovered.`
        : `Smart retry executed; account remained uncollectible.`
    };
  }

  // If customer nudge message (e.g. for expired mandate renewal)
  if (actionType === 'nudge_message') {
    const isSuccess = Math.random() < 0.52; // ~52% of customers click 1-click renewal link
    return {
      status: isSuccess ? 'recovered' : 'failed',
      recovered: isSuccess,
      recovered_amount: isSuccess ? amount : 0,
      notes: isSuccess
        ? `Customer completed 1-click mandate renewal via Hinglish WhatsApp nudge. ₹${amount} recovered.`
        : `Nudge delivered; customer has not yet renewed mandate.`
    };
  }

  return {
    status: 'failed',
    recovered: false,
    recovered_amount: 0,
    notes: 'Unresolved state.'
  };
}

/**
 * Simulates the Naive Baseline strategy:
 * "Blindly retry every failed charge once immediately without checking root cause or limits"
 */
export function simulateNaiveBaseline(charges) {
  let naiveRecoveredCount = 0;
  let naiveRecoveredAmount = 0;
  let naiveViolations = 0;
  const violationDetails = [];

  for (const charge of charges) {
    const { amount, failure_code, mandate_status, attempts_used_this_cycle } = charge;
    const code = (failure_code || '').toUpperCase();

    // 1. Check if naive retry causes NPCI Compliance Violations:
    if (mandate_status === 'revoked' || code.includes('REVOKED') || code.includes('U19')) {
      naiveViolations++;
      violationDetails.push({
        charge_id: charge.id,
        reason: 'Violated RBI guidelines: Retried a revoked mandate'
      });
      continue; // Blind retry fails + triggers violation
    }

    if (mandate_status === 'expired' || code.includes('EXPIRED') || code.includes('U28')) {
      naiveViolations++;
      violationDetails.push({
        charge_id: charge.id,
        reason: 'Violated NPCI rule: Retried an expired mandate'
      });
      continue; // Blind retry fails + triggers violation
    }

    if (attempts_used_this_cycle >= 3) {
      naiveViolations++;
      violationDetails.push({
        charge_id: charge.id,
        reason: 'Exceeded NPCI 3-attempt ceiling for current billing cycle'
      });
      continue; // Blind retry fails + triggers penalty
    }

    // 2. Immediate naive retry outcome (poor success for insufficient balance because done immediately)
    let naiveSuccessProb = 0.25;
    if (code.includes('TIMEOUT') || code.includes('U69') || code.includes('91')) {
      naiveSuccessProb = 0.60;
    } else if (code.includes('GATEWAY') || code.includes('502')) {
      naiveSuccessProb = 0.40;
    } else {
      // Insufficient balance blindly retried immediately (same day before salary) -> very low ~18%
      naiveSuccessProb = 0.18;
    }

    const isRecovered = Math.random() < naiveSuccessProb;
    if (isRecovered) {
      naiveRecoveredCount++;
      naiveRecoveredAmount += amount;
    }
  }

  return {
    naiveRecoveredCount,
    naiveRecoveredAmount,
    naiveViolations,
    violationDetails
  };
}
