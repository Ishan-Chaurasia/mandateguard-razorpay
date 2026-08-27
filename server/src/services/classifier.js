import { classifyAmbiguousFailure } from './llmService.js';

/**
 * Standard NPCI / UPI Autopay Rule Table
 * Maps high-volume, standardized bank response codes with 100% deterministic precision
 */
const STANDARD_RULE_MAP = {
  // 1. Insufficient Balance Codes
  'INSUFFICIENT_FUNDS': {
    root_cause: 'insufficient_balance',
    confidence: 0.99,
    reasoning: 'Standard NPCI code: Payer account had inadequate funds at debit presentment time.'
  },
  'U30': {
    root_cause: 'insufficient_balance',
    confidence: 0.99,
    reasoning: 'Standard NPCI UPI response code U30: Debit declined due to insufficient balance.'
  },
  'DECLINED_LOW_BALANCE': {
    root_cause: 'insufficient_balance',
    confidence: 0.98,
    reasoning: 'Issuer core banking declined debit due to insufficient available funds in operative account.'
  },
  'ERR_NPCI_BAL_01': {
    root_cause: 'insufficient_balance',
    confidence: 0.98,
    reasoning: 'NPCI balance validation error: Account balance below mandate debit amount.'
  },

  // 2. Bank / Issuer Timeout Codes
  'TIMEOUT_91': {
    root_cause: 'bank_timeout',
    confidence: 0.99,
    reasoning: 'Standard NPCI response code 91: Remitter/Issuer bank switch response timeout.'
  },
  'U69': {
    root_cause: 'bank_timeout',
    confidence: 0.99,
    reasoning: 'NPCI UPI response code U69: Remitter bank CBS/network temporarily unavailable.'
  },
  'BANK_DEBIT_TIMEOUT': {
    root_cause: 'bank_timeout',
    confidence: 0.98,
    reasoning: 'Issuer bank did not respond within the mandatory 30-second clearing window.'
  },
  'ISSUER_TIMEOUT': {
    root_cause: 'bank_timeout',
    confidence: 0.98,
    reasoning: 'Transient communication timeout with issuer authorization endpoint.'
  },

  // 3. Mandate Expired Codes
  'MANDATE_EXPIRED': {
    root_cause: 'mandate_expired',
    confidence: 1.0,
    reasoning: 'Mandate validity end-date has elapsed. Debit attempts strictly prohibited.'
  },
  'U28': {
    root_cause: 'mandate_expired',
    confidence: 0.99,
    reasoning: 'NPCI response code U28: Mandate validity period has expired.'
  },
  'VALIDITY_EXPIRED': {
    root_cause: 'mandate_expired',
    confidence: 0.99,
    reasoning: 'Mandate validity expired. Mandate is no longer executable.'
  },
  'ERR_MANDATE_DATE_PASSED': {
    root_cause: 'mandate_expired',
    confidence: 0.99,
    reasoning: 'Validity timestamp in past. Mandate marked as elapsed.'
  },

  // 4. Mandate Revoked Codes
  'MANDATE_REVOKED': {
    root_cause: 'mandate_revoked',
    confidence: 1.0,
    reasoning: 'Customer has actively paused or revoked the standing mandate on PSP/UPI app.'
  },
  'U19': {
    root_cause: 'mandate_revoked',
    confidence: 0.99,
    reasoning: 'NPCI response code U19: Mandate revoked/cancelled by customer.'
  },
  'CUSTOMER_CANCELLED': {
    root_cause: 'mandate_revoked',
    confidence: 0.99,
    reasoning: 'Customer cancelled the autopay mandate authorization directly.'
  },
  'MANDATE_CANCELLED_BY_PAYER': {
    root_cause: 'mandate_revoked',
    confidence: 1.0,
    reasoning: 'Standing instruction revoked by customer at their remitter bank.'
  },

  // 5. Technical Failure Codes
  'GATEWAY_502': {
    root_cause: 'technical_failure',
    confidence: 0.98,
    reasoning: 'Upstream gateway or payment switch returned HTTP 502 Bad Gateway.'
  },
  'TECH_FAIL_GATEWAY_502': {
    root_cause: 'technical_failure',
    confidence: 0.98,
    reasoning: 'Acquirer gateway network failure during debit routing.'
  },
  'SYSTEM_MALFUNCTION': {
    root_cause: 'technical_failure',
    confidence: 0.95,
    reasoning: 'NPCI switch internal processing exception.'
  },
  'NPCI_NETWORK_ERROR': {
    root_cause: 'technical_failure',
    confidence: 0.96,
    reasoning: 'Network packet drop between merchant gateway and NPCI central switch.'
  }
};

/**
 * Hybrid Diagnostic Classifier
 * Step 1: Check high-speed deterministic rule table (~70% standard traffic)
 * Step 2: Fall back to AI Diagnostic Classifier for unstructured / ambiguous bank codes
 */
export async function diagnoseFailure(failureCode, rawBankResponse = '') {
  const cleanCode = (failureCode || '').trim();

  // 1. Check exact match in rule engine
  if (STANDARD_RULE_MAP[cleanCode]) {
    const match = STANDARD_RULE_MAP[cleanCode];
    return {
      root_cause: match.root_cause,
      confidence: match.confidence,
      reasoning: match.reasoning,
      classifier_type: 'RULE_ENGINE'
    };
  }

  // 2. Check upper-case normalized match in rule engine
  const upperCode = cleanCode.toUpperCase();
  if (STANDARD_RULE_MAP[upperCode]) {
    const match = STANDARD_RULE_MAP[upperCode];
    return {
      root_cause: match.root_cause,
      confidence: match.confidence,
      reasoning: match.reasoning,
      classifier_type: 'RULE_ENGINE'
    };
  }

  // 3. Fall back to AI Classifier for ambiguous or noisy bank codes
  const aiResult = await classifyAmbiguousFailure(cleanCode, rawBankResponse);
  return {
    root_cause: aiResult.root_cause,
    confidence: aiResult.confidence,
    reasoning: aiResult.reasoning,
    classifier_type: 'AI_CLASSIFIER'
  };
}
