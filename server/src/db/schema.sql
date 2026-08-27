-- MandateGuard Database Schema (SQLite)
-- AI Revenue Recovery Agent for Failed UPI Autopay / Mandates

CREATE TABLE IF NOT EXISTS merchants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  vpa TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id)
);

CREATE TABLE IF NOT EXISTS mandates (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  merchant_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'revoked')),
  max_amount REAL NOT NULL,
  frequency TEXT DEFAULT 'MONTHLY',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  attempts_used_this_cycle INTEGER DEFAULT 0,
  consecutive_timeouts INTEGER DEFAULT 0,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (merchant_id) REFERENCES merchants(id)
);

CREATE TABLE IF NOT EXISTS charge_attempts (
  id TEXT PRIMARY KEY,
  mandate_id TEXT NOT NULL,
  amount REAL NOT NULL,
  attempted_at DATETIME NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('failed', 'success')),
  failure_code TEXT NOT NULL,
  raw_bank_response TEXT,
  is_processed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mandate_id) REFERENCES mandates(id)
);

CREATE TABLE IF NOT EXISTS failure_diagnoses (
  id TEXT PRIMARY KEY,
  charge_attempt_id TEXT NOT NULL UNIQUE,
  root_cause TEXT NOT NULL CHECK (root_cause IN ('insufficient_balance', 'bank_timeout', 'mandate_expired', 'mandate_revoked', 'technical_failure', 'unknown')),
  confidence REAL NOT NULL,
  reasoning TEXT NOT NULL,
  classifier_type TEXT NOT NULL CHECK (classifier_type IN ('RULE_ENGINE', 'AI_CLASSIFIER')),
  diagnosed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (charge_attempt_id) REFERENCES charge_attempts(id)
);

CREATE TABLE IF NOT EXISTS recovery_actions (
  id TEXT PRIMARY KEY,
  failure_diagnosis_id TEXT NOT NULL UNIQUE,
  mandate_id TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('smart_retry', 'nudge_message', 'escalate_manual', 'no_action_terminal')),
  scheduled_at DATETIME,
  message_text TEXT,
  policy_rule_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'executed', 'recovered', 'failed', 'expired', 'blocked_by_guardrail', 'manual_review')),
  simulated_recovery_amount REAL DEFAULT 0,
  executed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (failure_diagnosis_id) REFERENCES failure_diagnoses(id),
  FOREIGN KEY (mandate_id) REFERENCES mandates(id)
);

CREATE TABLE IF NOT EXISTS audit_log_entries (
  id TEXT PRIMARY KEY,
  mandate_id TEXT,
  charge_attempt_id TEXT,
  related_entity_id TEXT,
  entity_type TEXT NOT NULL,
  decision TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  policy_rule_id TEXT,
  guardrail_check TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS batch_runs (
  id TEXT PRIMARY KEY,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  total_charges INTEGER DEFAULT 0,
  total_amount_at_risk REAL DEFAULT 0,
  smart_recovered_count INTEGER DEFAULT 0,
  smart_recovered_amount REAL DEFAULT 0,
  naive_recovered_count INTEGER DEFAULT 0,
  naive_recovered_amount REAL DEFAULT 0,
  revenue_uplift_amount REAL DEFAULT 0,
  revenue_uplift_percent REAL DEFAULT 0,
  smart_compliance_violations INTEGER DEFAULT 0,
  naive_compliance_violations INTEGER DEFAULT 0,
  exceptions_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'completed'
);

CREATE INDEX IF NOT EXISTS idx_mandates_customer ON mandates(customer_id);
CREATE INDEX IF NOT EXISTS idx_charge_attempts_mandate ON charge_attempts(mandate_id);
CREATE INDEX IF NOT EXISTS idx_recovery_actions_mandate ON recovery_actions(mandate_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_mandate ON audit_log_entries(mandate_id);
