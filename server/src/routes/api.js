import express from 'express';
import { getDb, resetDatabase } from '../db/database.js';
import { seedSyntheticData } from '../db/seedData.js';
import { runBatchRecovery } from '../services/batchRunner.js';
import { diagnoseFailure } from '../services/classifier.js';
import { evaluatePolicyDecision } from '../services/policyEngine.js';
import { generateHinglishNudge, narrateAuditReasoning } from '../services/llmService.js';

const router = express.Router();

// -------------------------------------------------------------
// 1. DASHBOARD AGGREGATE STATS
// -------------------------------------------------------------
router.get('/dashboard/stats', (req, res) => {
  try {
    const db = getDb();

    const totalChargesRow = db.prepare('SELECT COUNT(*) as count, SUM(amount) as total_amount FROM charge_attempts').get();
    const processedChargesRow = db.prepare('SELECT COUNT(*) as count FROM charge_attempts WHERE is_processed = 1').get();
    const pendingChargesRow = db.prepare('SELECT COUNT(*) as count FROM charge_attempts WHERE is_processed = 0').get();

    const recoveredRow = db.prepare(`
      SELECT COUNT(*) as count, SUM(simulated_recovery_amount) as amount
      FROM recovery_actions
      WHERE status = 'recovered'
    `).get();

    const exceptionsRow = db.prepare(`
      SELECT COUNT(*) as count
      FROM recovery_actions
      WHERE action_type = 'escalate_manual' OR status = 'manual_review'
    `).get();

    const rootCauseBreakdown = db.prepare(`
      SELECT root_cause, COUNT(*) as count
      FROM failure_diagnoses
      GROUP BY root_cause
    `).all();

    const actionBreakdown = db.prepare(`
      SELECT action_type, COUNT(*) as count
      FROM recovery_actions
      GROUP BY action_type
    `).all();

    const latestBatch = db.prepare(`
      SELECT * FROM batch_runs ORDER BY started_at DESC LIMIT 1
    `).get();

    res.json({
      totalCharges: totalChargesRow?.count || 0,
      totalAmountAtRisk: totalChargesRow?.total_amount || 0,
      processedCharges: processedChargesRow?.count || 0,
      pendingCharges: pendingChargesRow?.count || 0,
      recoveredCount: recoveredRow?.count || 0,
      recoveredAmount: recoveredRow?.amount || 0,
      recoveryRate: totalChargesRow?.count > 0 ? ((recoveredRow?.count || 0) / totalChargesRow.count) * 100 : 0,
      exceptionsCount: exceptionsRow?.count || 0,
      complianceScore: 100, // 0 violations by MandateGuard
      rootCauseBreakdown,
      actionBreakdown,
      latestBatch
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 2. RUN BATCH RECOVERY (Standard REST)
// -------------------------------------------------------------
router.post('/batch/run', async (req, res) => {
  try {
    const result = await runBatchRecovery();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 3. RUN BATCH RECOVERY STREAM (Server-Sent Events)
// -------------------------------------------------------------
router.get('/batch/run-stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    sendEvent('start', { message: 'Initiating MandateGuard AI Recovery Batch Run...' });

    const result = await runBatchRecovery((progressItem) => {
      sendEvent('item', progressItem);
    });

    sendEvent('complete', result);
    res.end();
  } catch (err) {
    sendEvent('error', { message: err.message });
    res.end();
  }
});

// -------------------------------------------------------------
// 4. RESET & RE-SEED DATABASE (Demo convenience)
// -------------------------------------------------------------
router.post('/batch/reset', (req, res) => {
  try {
    const seedResult = seedSyntheticData();
    res.json({ message: 'Database reset and re-seeded successfully', ...seedResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 5. GET MANDATES & CHARGES LIST
// -------------------------------------------------------------
router.get('/mandates', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT
        c.id as charge_id, c.amount, c.attempted_at, c.failure_code, c.raw_bank_response, c.is_processed,
        m.id as mandate_id, m.status as mandate_status, m.max_amount, m.attempts_used_this_cycle, m.consecutive_timeouts,
        cust.id as customer_id, cust.name as customer_name, cust.phone as customer_phone, cust.vpa as customer_vpa,
        merch.name as merchant_name, merch.category as merchant_category,
        diag.root_cause, diag.confidence, diag.reasoning as diagnosis_reasoning, diag.classifier_type,
        act.action_type, act.status as action_status, act.message_text, act.policy_rule_id, act.simulated_recovery_amount, act.scheduled_at
      FROM charge_attempts c
      JOIN mandates m ON c.mandate_id = m.id
      JOIN customers cust ON m.customer_id = cust.id
      JOIN merchants merch ON m.merchant_id = merch.id
      LEFT JOIN failure_diagnoses diag ON diag.charge_attempt_id = c.id
      LEFT JOIN recovery_actions act ON act.failure_diagnosis_id = diag.id
      ORDER BY c.attempted_at DESC
    `).all();

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 6. GET MANDATE AUDIT TRAIL DRILLDOWN
// -------------------------------------------------------------
router.get('/mandates/:id/history', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    // Mandate & Customer details
    const mandate = db.prepare(`
      SELECT
        m.*,
        cust.name as customer_name, cust.phone as customer_phone, cust.email as customer_email, cust.vpa as customer_vpa,
        merch.name as merchant_name, merch.category as merchant_category
      FROM mandates m
      JOIN customers cust ON m.customer_id = cust.id
      JOIN merchants merch ON m.merchant_id = merch.id
      WHERE m.id = ?
    `).get(id);

    if (!mandate) {
      return res.status(404).json({ error: 'Mandate not found' });
    }

    // Charges & Diagnoses
    const charges = db.prepare(`
      SELECT
        c.*,
        diag.root_cause, diag.confidence, diag.reasoning as diagnosis_reasoning, diag.classifier_type,
        act.action_type, act.status as action_status, act.message_text, act.policy_rule_id, act.simulated_recovery_amount, act.scheduled_at
      FROM charge_attempts c
      LEFT JOIN failure_diagnoses diag ON diag.charge_attempt_id = c.id
      LEFT JOIN recovery_actions act ON act.failure_diagnosis_id = diag.id
      WHERE c.mandate_id = ?
      ORDER BY c.attempted_at ASC
    `).all(id);

    // Audit Log Entries (match either mandate_id or charge_attempt_id)
    const auditLogs = db.prepare(`
      SELECT * FROM audit_log_entries
      WHERE mandate_id = ? OR charge_attempt_id IN (SELECT id FROM charge_attempts WHERE mandate_id = ?)
      ORDER BY timestamp ASC
    `).all(id, id);

    res.json({
      mandate,
      charges,
      auditLogs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Single Mandate On-Demand Recovery
router.post('/mandates/:id/recover', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const charge = db.prepare(`
      SELECT
        c.id, c.mandate_id, c.amount, c.attempted_at, c.status, c.failure_code, c.raw_bank_response,
        m.customer_id, m.merchant_id, m.status as mandate_status, m.max_amount, m.attempts_used_this_cycle, m.consecutive_timeouts,
        cust.name as customer_name, cust.phone as customer_phone, cust.vpa as customer_vpa,
        merch.name as merchant_name, merch.category as merchant_category
      FROM charge_attempts c
      JOIN mandates m ON c.mandate_id = m.id
      JOIN customers cust ON m.customer_id = cust.id
      JOIN merchants merch ON m.merchant_id = merch.id
      WHERE m.id = ?
      ORDER BY c.attempted_at DESC
      LIMIT 1
    `).get(id);

    if (!charge) {
      return res.status(404).json({ error: 'No charge attempt found for this mandate' });
    }

    // 1. Diagnose
    const diagnosis = await diagnoseFailure(charge.failure_code, charge.raw_bank_response);
    const diagnosisId = `diag_${Date.now()}`;

    db.prepare(`
      INSERT OR REPLACE INTO failure_diagnoses (id, charge_attempt_id, root_cause, confidence, reasoning, classifier_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      diagnosisId,
      charge.id,
      diagnosis.root_cause,
      diagnosis.confidence,
      diagnosis.reasoning,
      diagnosis.classifier_type
    );

    // 2. Decide Policy
    const policyDecision = evaluatePolicyDecision({
      diagnosis,
      mandate: {
        id: charge.mandate_id,
        status: charge.mandate_status,
        attempts_used_this_cycle: charge.attempts_used_this_cycle,
        consecutive_timeouts: charge.consecutive_timeouts
      },
      chargeAttempt: charge
    });

    // 3. Nudge
    let messageText = null;
    if (policyDecision.message_required) {
      messageText = await generateHinglishNudge({
        customerName: charge.customer_name,
        merchantName: charge.merchant_name,
        amount: charge.amount,
        rootCause: diagnosis.root_cause,
        mandateId: charge.mandate_id
      });
    }

    // 4. Simulate Action
    const { simulateActionOutcome } = await import('../services/executionSimulator.js');
    const outcome = simulateActionOutcome({
      actionType: policyDecision.action_type,
      rootCause: diagnosis.root_cause,
      amount: charge.amount,
      guardrailCheck: policyDecision.guardrail_check
    });

    const actionId = `act_${Date.now()}`;
    db.prepare(`
      INSERT OR REPLACE INTO recovery_actions (id, failure_diagnosis_id, mandate_id, action_type, scheduled_at, message_text, policy_rule_id, status, simulated_recovery_amount, executed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      actionId,
      diagnosisId,
      charge.mandate_id,
      policyDecision.action_type,
      policyDecision.scheduled_at,
      messageText,
      policyDecision.policy_rule_id,
      outcome.status,
      outcome.recovered_amount,
      new Date().toISOString()
    );

    // 5. Audit Log
    const auditReasoning = narrateAuditReasoning({
      actionType: policyDecision.action_type,
      rootCause: diagnosis.root_cause,
      confidence: diagnosis.confidence,
      attemptsUsed: charge.attempts_used_this_cycle,
      maxAllowedAttempts: 3,
      guardrailStatus: policyDecision.guardrail_check,
      scheduledTime: policyDecision.scheduled_at
    });

    const auditId = `aud_${Date.now()}`;
    db.prepare(`
      INSERT INTO audit_log_entries (id, mandate_id, charge_attempt_id, related_entity_id, entity_type, decision, reasoning, policy_rule_id, guardrail_check, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      auditId,
      charge.mandate_id,
      charge.id,
      actionId,
      'RECOVERY_DECISION',
      `${policyDecision.action_type.toUpperCase()} (${policyDecision.policy_rule_id})`,
      auditReasoning,
      policyDecision.policy_rule_id,
      policyDecision.guardrail_check,
      new Date().toISOString()
    );

    db.prepare('UPDATE charge_attempts SET is_processed = 1 WHERE id = ?').run(charge.id);

    res.json({
      success: true,
      diagnosis,
      policyDecision,
      outcome,
      auditReasoning,
      messageText
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 7. EXCEPTIONS & MANUAL QUEUE
// -------------------------------------------------------------
router.get('/exceptions', (req, res) => {
  try {
    const db = getDb();
    const exceptions = db.prepare(`
      SELECT
        act.id as action_id, act.action_type, act.status as action_status, act.policy_rule_id,
        c.id as charge_id, c.amount, c.attempted_at, c.failure_code, c.raw_bank_response,
        m.id as mandate_id, m.status as mandate_status, m.attempts_used_this_cycle, m.consecutive_timeouts,
        cust.name as customer_name, cust.phone as customer_phone, cust.vpa as customer_vpa,
        merch.name as merchant_name,
        diag.root_cause, diag.confidence, diag.reasoning as diagnosis_reasoning, diag.classifier_type
      FROM recovery_actions act
      JOIN failure_diagnoses diag ON act.failure_diagnosis_id = diag.id
      JOIN charge_attempts c ON diag.charge_attempt_id = c.id
      JOIN mandates m ON act.mandate_id = m.id
      JOIN customers cust ON m.customer_id = cust.id
      JOIN merchants merch ON m.merchant_id = merch.id
      WHERE act.action_type = 'escalate_manual' OR act.status = 'manual_review'
      ORDER BY c.attempted_at DESC
    `).all();

    res.json(exceptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/exceptions/:id/resolve', (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionAction, notes } = req.body;
    const db = getDb();

    db.prepare(`
      UPDATE recovery_actions
      SET status = 'executed', message_text = ?
      WHERE id = ?
    `).run(`[MANUALLY RESOLVED: ${resolutionAction}] ${notes || ''}`, id);

    db.prepare(`
      INSERT INTO audit_log_entries (id, related_entity_id, entity_type, decision, reasoning, timestamp)
      VALUES (?, ?, 'MANUAL_RESOLUTION', ?, ?, ?)
    `).run(
      `aud_man_${Date.now()}`,
      id,
      `MANUAL_OVERRIDE_${resolutionAction}`,
      `Merchant Operations Agent manually reviewed and applied action: ${resolutionAction}. Notes: ${notes || 'Approved'}`,
      new Date().toISOString()
    );

    res.json({ success: true, message: 'Exception resolved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 8. INTERACTIVE PLAYGROUND / TEST BENCH
// -------------------------------------------------------------
router.post('/playground/test', async (req, res) => {
  try {
    const {
      failureCode = 'INSUFFICIENT_FUNDS',
      rawResponse = '',
      customerName = 'Aarav Sharma',
      merchantName = 'Cult.fit Elite',
      amount = 1499,
      attemptsUsed = 0,
      mandateStatus = 'active',
      consecutiveTimeouts = 0
    } = req.body;

    const dummyMandateId = 'UMN987654321098';

    // 1. Diagnose
    const diagnosis = await diagnoseFailure(failureCode, rawResponse);

    // 2. Policy Engine
    const policyDecision = evaluatePolicyDecision({
      diagnosis,
      mandate: {
        id: dummyMandateId,
        status: mandateStatus,
        attempts_used_this_cycle: Number(attemptsUsed),
        consecutive_timeouts: Number(consecutiveTimeouts)
      },
      chargeAttempt: { amount: Number(amount) }
    });

    // 3. Nudge Generation
    let nudgeMessage = null;
    if (policyDecision.message_required || mandateStatus === 'expired' || diagnosis.root_cause === 'insufficient_balance') {
      nudgeMessage = await generateHinglishNudge({
        customerName,
        merchantName,
        amount: Number(amount),
        rootCause: diagnosis.root_cause,
        mandateId: dummyMandateId
      });
    }

    // 4. Audit Narration
    const auditReasoning = narrateAuditReasoning({
      actionType: policyDecision.action_type,
      rootCause: diagnosis.root_cause,
      confidence: diagnosis.confidence,
      attemptsUsed: Number(attemptsUsed),
      maxAllowedAttempts: 3,
      guardrailStatus: policyDecision.guardrail_check,
      scheduledTime: policyDecision.scheduled_at
    });

    res.json({
      diagnosis,
      policyDecision,
      nudgeMessage,
      auditReasoning
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
