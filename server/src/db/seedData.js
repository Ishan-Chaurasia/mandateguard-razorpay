import { getDb, resetDatabase } from './database.js';
import { v4 as uuidv4 } from 'uuid';

const merchants = [
  { id: 'mch_netflix', name: 'Netflix India', category: 'OTT Entertainment' },
  { id: 'mch_hotstar', name: 'Disney+ Hotstar', category: 'OTT Entertainment' },
  { id: 'mch_cultfit', name: 'Cult.fit Elite', category: 'Fitness & Health' },
  { id: 'mch_swiggy', name: 'Swiggy One', category: 'Food & Quick Commerce' },
  { id: 'mch_zerodha', name: 'Zerodha Streak', category: 'FinTech & Trading' },
  { id: 'mch_timesprime', name: 'Times Prime', category: 'Lifestyle & Bundles' },
  { id: 'mch_spotify', name: 'Spotify Premium', category: 'Music Streaming' },
  { id: 'mch_urbancompany', name: 'Urban Company Plus', category: 'Home Services' }
];

const customerProfiles = [
  { name: 'Aarav Sharma', phone: '+91 98201 44123', email: 'aarav.sharma@example.com', vpa: 'aarav@okhdfcbank' },
  { name: 'Priya Patel', phone: '+91 98765 11234', email: 'priya.patel@example.com', vpa: 'priya@icici' },
  { name: 'Rohan Mehta', phone: '+91 99100 88765', email: 'rohan.mehta@example.com', vpa: 'rohan@oksbi' },
  { name: 'Ananya Iyer', phone: '+91 97412 33456', email: 'ananya.iyer@example.com', vpa: 'ananya@paytm' },
  { name: 'Vikram Singh', phone: '+91 98333 99881', email: 'vikram.singh@example.com', vpa: 'vikram@axl' },
  { name: 'Sneha Reddy', phone: '+91 96111 77662', email: 'sneha.reddy@example.com', vpa: 'sneha@ybl' },
  { name: 'Aditya Verma', phone: '+91 98990 12345', email: 'aditya.verma@example.com', vpa: 'aditya@kotak' },
  { name: 'Pooja Nair', phone: '+91 98450 67890', email: 'pooja.nair@example.com', vpa: 'pooja@okhdfcbank' },
  { name: 'Karan Malhotra', phone: '+91 98210 54321', email: 'karan.m@example.com', vpa: 'karan@oksbi' },
  { name: 'Neha Gupta', phone: '+91 97170 98765', email: 'neha.gupta@example.com', vpa: 'neha@icici' },
  { name: 'Siddharth Rao', phone: '+91 99000 45678', email: 'sid.rao@example.com', vpa: 'sid@axl' },
  { name: 'Meera Deshmukh', phone: '+91 98200 33445', email: 'meera.d@example.com', vpa: 'meera@ybl' },
  { name: 'Tanmay Joshi', phone: '+91 98190 22334', email: 'tanmay.j@example.com', vpa: 'tanmay@paytm' },
  { name: 'Divya Sundaram', phone: '+91 98400 99887', email: 'divya.s@example.com', vpa: 'divya@okhdfcbank' },
  { name: 'Varun Kapoor', phone: '+91 98111 55667', email: 'varun.k@example.com', vpa: 'varun@oksbi' },
  { name: 'Kavita Menon', phone: '+91 98455 66778', email: 'kavita.m@example.com', vpa: 'kavita@kotak' },
  { name: 'Arjun Das', phone: '+91 98300 11223', email: 'arjun.das@example.com', vpa: 'arjun@icici' },
  { name: 'Ritu Sen', phone: '+91 98311 44556', email: 'ritu.sen@example.com', vpa: 'ritu@axl' },
  { name: 'Abhishek Kumar', phone: '+91 99340 77889', email: 'abhishek.k@example.com', vpa: 'abhishek@ybl' },
  { name: 'Shruti Agarwal', phone: '+91 98290 88990', email: 'shruti.a@example.com', vpa: 'shruti@paytm' }
];

// 52 realistic test cases with realistic NPCI / Bank error variations
const syntheticFailurePrototypes = [
  // 1. INSUFFICIENT BALANCE (Archetype 1)
  {
    expectedRoot: 'insufficient_balance',
    amount: 649,
    failureCode: 'INSUFFICIENT_FUNDS',
    rawResponse: '{"npci_code": "U30", "bank_status": "DEBIT_REJECT_LOW_BALANCE", "switch_ts": "2026-08-27T06:12:00Z"}',
    mandateStatus: 'active',
    attemptsUsed: 0,
    consecutiveTimeouts: 0,
    notes: 'Standard NPCI U30 code'
  },
  {
    expectedRoot: 'insufficient_balance',
    amount: 899,
    failureCode: 'U30',
    rawResponse: '{"response_code": "U30", "description": "CUSTOMER_ACCOUNT_LOW_FUNDS"}',
    mandateStatus: 'active',
    attemptsUsed: 1,
    consecutiveTimeouts: 0,
    notes: 'Clean U30 code, 1 attempt used'
  },
  {
    expectedRoot: 'insufficient_balance',
    amount: 1499,
    failureCode: 'DECLINED_LOW_BALANCE',
    rawResponse: '{"issuer_msg": "DECLINED: INSUFFICIENT BALANCE IN OPERATIVE ACCOUNT"}',
    mandateStatus: 'active',
    attemptsUsed: 0,
    consecutiveTimeouts: 0,
    notes: 'Issuer decline low balance'
  },
  {
    expectedRoot: 'insufficient_balance',
    amount: 199,
    failureCode: 'AC_BAL_INSUFFICIENT_DR_FAIL',
    rawResponse: '{"bank_err": "HDFC_ERR_51: AC_BAL_INSUFFICIENT_DR_FAIL", "auth_status": "FAILED"}',
    mandateStatus: 'active',
    attemptsUsed: 1,
    consecutiveTimeouts: 0,
    notes: 'Messy HDFC bank error string'
  },
  {
    expectedRoot: 'insufficient_balance',
    amount: 499,
    failureCode: 'ISSUER DECLINED - RESTRICTED OR INSUFFICIENT LIQUIDITY',
    rawResponse: '{"gateway_raw": "ISSUER DECLINED - RESTRICTED OR INSUFFICIENT LIQUIDITY ON PRESENTMENT"}',
    mandateStatus: 'active',
    attemptsUsed: 0,
    consecutiveTimeouts: 0,
    notes: 'Ambiguous bank message requiring AI classification'
  },
  {
    expectedRoot: 'insufficient_balance',
    amount: 2499,
    failureCode: 'SBI_UPI_ERR_U30_ACC_LOW_BAL',
    rawResponse: '{"sbi_cbs_code": "51", "npci_ref": "SBI_UPI_ERR_U30_ACC_LOW_BAL"}',
    mandateStatus: 'active',
    attemptsUsed: 2,
    consecutiveTimeouts: 0,
    notes: '2 attempts already used - will be 3rd (last allowed) attempt'
  },
  {
    expectedRoot: 'insufficient_balance',
    amount: 999,
    failureCode: 'DEBIT FAILED: CUSTOMER ACCOUNT HAS INADEQUATE FUNDS AT TIME OF PRESENTMENT',
    rawResponse: '{"cbs_resp": "INADEQUATE_FUNDS_PRESENTMENT_ERR_30"}',
    mandateStatus: 'active',
    attemptsUsed: 0,
    consecutiveTimeouts: 0,
    notes: 'Noisy bank sentence'
  },
  {
    expectedRoot: 'insufficient_balance',
    amount: 799,
    failureCode: 'INSUFFICIENT_FUNDS',
    rawResponse: '{"npci_code": "U30", "cycle_attempts": 3}',
    mandateStatus: 'active',
    attemptsUsed: 3, // Already hit NPCI ceiling!
    consecutiveTimeouts: 0,
    notes: 'NPCI CEILING TEST: 3 attempts used already. Guardrail MUST block retry!'
  },
  {
    expectedRoot: 'insufficient_balance',
    amount: 349,
    failureCode: 'ERR_NPCI_BAL_01',
    rawResponse: '{"error": "ERR_NPCI_BAL_01 - OPERATIVE BAL LESS THAN AMOUNT"}',
    mandateStatus: 'active',
    attemptsUsed: 1,
    consecutiveTimeouts: 0,
    notes: 'NPCI balance error code'
  },
  {
    expectedRoot: 'insufficient_balance',
    amount: 1199,
    failureCode: 'HDFC_CORE: 51 NOT SUFFICIENT BALANCE',
    rawResponse: '{"hdfc_core": "RC_51_NOT_SUFFICIENT_BALANCE"}',
    mandateStatus: 'active',
    attemptsUsed: 0,
    consecutiveTimeouts: 0,
    notes: 'Core banking string 51'
  },

  // 2. BANK / ISSUER TIMEOUT (Archetype 2)
  {
    expectedRoot: 'bank_timeout',
    amount: 899,
    failureCode: 'TIMEOUT_91',
    rawResponse: '{"npci_resp": "91", "description": "ISSUER_SWITCH_TIMEOUT"}',
    mandateStatus: 'active',
    attemptsUsed: 0,
    consecutiveTimeouts: 0,
    notes: 'Standard NPCI 91 timeout'
  },
  {
    expectedRoot: 'bank_timeout',
    amount: 1499,
    failureCode: 'U69',
    rawResponse: '{"npci_code": "U69", "status": "REMITTER_BANK_UNAVAILABLE"}',
    mandateStatus: 'active',
    attemptsUsed: 1,
    consecutiveTimeouts: 0,
    notes: 'NPCI U69 remitter unavailable'
  },
  {
    expectedRoot: 'bank_timeout',
    amount: 649,
    failureCode: 'BANK_DEBIT_TIMEOUT',
    rawResponse: '{"error": "BANK_DEBIT_TIMEOUT - NO RESPONSE FROM ISSUER WITHIN 30S"}',
    mandateStatus: 'active',
    attemptsUsed: 0,
    consecutiveTimeouts: 0,
    notes: 'Direct bank debit timeout'
  },
  {
    expectedRoot: 'bank_timeout',
    amount: 499,
    failureCode: 'NPCI RES: 92 ROUTING TIMEOUT ON ACQUIRER END',
    rawResponse: '{"gateway_err": "NPCI RES: 92 ROUTING TIMEOUT ON ACQUIRER END"}',
    mandateStatus: 'active',
    attemptsUsed: 0,
    consecutiveTimeouts: 0,
    notes: 'Noisy acquirer timeout string'
  },
  {
    expectedRoot: 'bank_timeout',
    amount: 1999,
    failureCode: 'HDFC_CORE_GW: DEBIT_TIMEOUT_STAGE_2',
    rawResponse: '{"stage": "STAGE_2", "hdfc_status": "TIMEOUT"}',
    mandateStatus: 'active',
    attemptsUsed: 1,
    consecutiveTimeouts: 0,
    notes: 'HDFC gateway stage 2 timeout'
  },
  {
    expectedRoot: 'bank_timeout',
    amount: 299,
    failureCode: 'ICICI_CBS_UNAVAILABLE_HTTP_504',
    rawResponse: '{"http_code": 504, "icici_service": "CBS_AUTOPAY_ENGINE"}',
    mandateStatus: 'active',
    attemptsUsed: 1,
    consecutiveTimeouts: 2, // 2 consecutive timeouts -> Escalation guardrail!
    notes: '2 CONSECUTIVE TIMEOUTS: Guardrail MUST escalate to manual review!'
  },
  {
    expectedRoot: 'bank_timeout',
    amount: 799,
    failureCode: 'TIMEOUT ON REMITTER BANK SWITCH DURING DEBIT CLEARING',
    rawResponse: '{"switch_log": "REMITTER_TIMEOUT_CLEARING_WINDOW_EXCEEDED"}',
    mandateStatus: 'active',
    attemptsUsed: 0,
    consecutiveTimeouts: 0,
    notes: 'Remitter switch timeout'
  },

  // 3. MANDATE EXPIRED (Archetype 3)
  {
    expectedRoot: 'mandate_expired',
    amount: 999,
    failureCode: 'MANDATE_EXPIRED',
    rawResponse: '{"npci_code": "U28", "mandate_validity": "EXPIRED"}',
    mandateStatus: 'expired',
    attemptsUsed: 0,
    consecutiveTimeouts: 0,
    notes: 'Clean expired mandate'
  },
  {
    expectedRoot: 'mandate_expired',
    amount: 1499,
    failureCode: 'U28',
    rawResponse: '{"response_code": "U28", "description": "MANDATE_VALIDITY_PERIOD_EXPIRED"}',
    mandateStatus: 'expired',
    attemptsUsed: 1,
    consecutiveTimeouts: 0,
    notes: 'NPCI U28 error'
  },
  {
    expectedRoot: 'mandate_expired',
    amount: 499,
    failureCode: 'VALIDITY_EXPIRED',
    rawResponse: '{"error": "VALIDITY_EXPIRED - END_DATE_PASSED"}',
    mandateStatus: 'expired',
    attemptsUsed: 0,
    consecutiveTimeouts: 0,
    notes: 'Validity period elapsed'
  },
  {
    expectedRoot: 'mandate_expired',
    amount: 1299,
    failureCode: 'NPCI: MANDATE VALIDITY EXPIRED ON 2026-08-15',
    rawResponse: '{"npci_log": "NPCI: MANDATE VALIDITY EXPIRED ON 2026-08-15 - REJECT DR"}',
    mandateStatus: 'expired',
    attemptsUsed: 0,
    consecutiveTimeouts: 0,
    notes: 'Expired mandate free text'
  },
  {
    expectedRoot: 'mandate_expired',
    amount: 199,
    failureCode: 'ISSUER_REJECT: U28_MANDATE_VALIDITY_OVER',
    rawResponse: '{"issuer": "KOTAK", "code": "U28_MANDATE_VALIDITY_OVER"}',
    mandateStatus: 'expired',
    attemptsUsed: 0,
    consecutiveTimeouts: 0,
    notes: 'Kotak expired response'
  },

  // 4. MANDATE REVOKED BY USER (Archetype 4)
  {
    expectedRoot: 'mandate_revoked',
    amount: 1499,
    failureCode: 'MANDATE_REVOKED',
    rawResponse: '{"npci_code": "U19", "payer_action": "MANDATE_PAUSED_OR_CANCELLED"}',
    mandateStatus: 'revoked',
    attemptsUsed: 0,
    consecutiveTimeouts: 0,
    notes: 'Clean revoked mandate'
  },
  {
    expectedRoot: 'mandate_revoked',
    amount: 649,
    failureCode: 'U19',
    rawResponse: '{"code": "U19", "desc": "MANDATE_REVOKED_BY_CUSTOMER"}',
    mandateStatus: 'revoked',
    attemptsUsed: 0,
    consecutiveTimeouts: 0,
    notes: 'NPCI U19 revoked'
  },
  {
    expectedRoot: 'mandate_revoked',
    amount: 899,
    failureCode: 'CUSTOMER BLOCKED AUTOPAY FROM BHIM / GPAY APP',
    rawResponse: '{"psp_event": "CUSTOMER_CANCELLED_SI_BHIM_GPAY"}',
    mandateStatus: 'revoked',
    attemptsUsed: 0,
    consecutiveTimeouts: 0,
    notes: 'Customer revoked at PSP app'
  },
  {
    expectedRoot: 'mandate_revoked',
    amount: 2499,
    failureCode: 'PAYER REVOKED STANDING INSTRUCTION AT PSP',
    rawResponse: '{"audit": "PAYER REVOKED STANDING INSTRUCTION AT PSP - TERMINAL"}',
    mandateStatus: 'revoked',
    attemptsUsed: 0,
    consecutiveTimeouts: 0,
    notes: 'Revoked standing instruction'
  },
  {
    expectedRoot: 'mandate_revoked',
    amount: 399,
    failureCode: 'MANDATE_STATUS_REVOKED_BY_USER_AT_ISSUER',
    rawResponse: '{"status": "REVOKED_ISSUER_NETBANKING"}',
    mandateStatus: 'revoked',
    attemptsUsed: 0,
    consecutiveTimeouts: 0,
    notes: 'Revoked at netbanking'
  },

  // 5. TECHNICAL FAILURE (Merchant / Gateway / Switch) (Archetype 5)
  {
    expectedRoot: 'technical_failure',
    amount: 1199,
    failureCode: 'GATEWAY_502',
    rawResponse: '{"http_code": 502, "msg": "BAD_GATEWAY_UPSTREAM_ROUTER"}',
    mandateStatus: 'active',
    attemptsUsed: 0,
    consecutiveTimeouts: 0,
    notes: 'Gateway 502'
  },
  {
    expectedRoot: 'technical_failure',
    amount: 749,
    failureCode: 'TECH_FAIL_GATEWAY_502',
    rawResponse: '{"gateway": "PG_INTERNAL", "error": "TECH_FAIL_GATEWAY_502"}',
    mandateStatus: 'active',
    attemptsUsed: 1,
    consecutiveTimeouts: 0,
    notes: 'Tech fail 1 attempt'
  },
  {
    expectedRoot: 'technical_failure',
    amount: 1599,
    failureCode: 'RAZORPAY_GW_ERROR: INTERNAL_ROUTING_500',
    rawResponse: '{"rzp_err": "RAZORPAY_GW_ERROR: INTERNAL_ROUTING_500"}',
    mandateStatus: 'active',
    attemptsUsed: 0,
    consecutiveTimeouts: 0,
    notes: 'Internal routing error'
  },
  {
    expectedRoot: 'technical_failure',
    amount: 999,
    failureCode: 'PAYMENT_SWITCH_SOCKET_HANGUP_ERR_52',
    rawResponse: '{"socket": "ECONNRESET", "code": "ERR_52"}',
    mandateStatus: 'active',
    attemptsUsed: 2, // 2 tech fails already -> manual escalation guardrail
    consecutiveTimeouts: 0,
    notes: '2 technical fails already -> Escalate guardrail'
  },

  // 6. UNKNOWN / AMBIGUOUS BANK CODES (Archetype 6)
  {
    expectedRoot: 'unknown',
    amount: 1899,
    failureCode: 'UNRECOGNIZED CLEARING EXCEPTION 404',
    rawResponse: '{"raw_hex": "0x7F4A_UNKNOWN_ERR", "msg": "UNRECOGNIZED CLEARING EXCEPTION 404"}',
    mandateStatus: 'active',
    attemptsUsed: 0,
    consecutiveTimeouts: 0,
    notes: 'Unknown clearing exception -> Manual queue'
  },
  {
    expectedRoot: 'unknown',
    amount: 3200,
    failureCode: 'BANK_REJECT_STRANGE_CODE_9999',
    rawResponse: '{"issuer_raw": "9999_MISCELLANEOUS_REJECT_UNSPECIFIED"}',
    mandateStatus: 'active',
    attemptsUsed: 0,
    consecutiveTimeouts: 0,
    notes: 'Strange bank code -> Manual queue'
  }
];

export function seedSyntheticData() {
  const db = resetDatabase();
  console.log('🌱 Seeding MandateGuard database with 50+ realistic UPI Autopay records...');

  // 1. Insert Merchants
  const insertMerchant = db.prepare(`
    INSERT INTO merchants (id, name, category) VALUES (?, ?, ?)
  `);
  for (const m of merchants) {
    insertMerchant.run(m.id, m.name, m.category);
  }

  // 2. Generate 52 complete mandate records
  const insertCustomer = db.prepare(`
    INSERT INTO customers (id, merchant_id, name, phone, email, vpa, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMandate = db.prepare(`
    INSERT INTO mandates (id, customer_id, merchant_id, status, max_amount, frequency, created_at, expires_at, attempts_used_this_cycle, consecutive_timeouts)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCharge = db.prepare(`
    INSERT INTO charge_attempts (id, mandate_id, amount, attempted_at, status, failure_code, raw_bank_response, is_processed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  const now = new Date();

  // We loop to generate 52 rich records
  for (let i = 0; i < 52; i++) {
    const proto = syntheticFailurePrototypes[i % syntheticFailurePrototypes.length];
    const customerProf = customerProfiles[i % customerProfiles.length];
    const merchant = merchants[i % merchants.length];

    const customerId = `cust_${String(i + 1).padStart(3, '0')}`;
    const mandateId = `UMN${(100000000000 + i * 1337).toString()}`;
    const chargeId = `chg_${String(i + 1).padStart(4, '0')}`;

    // Vary attempted_at slightly (within past 24-48 hours)
    const attemptedAt = new Date(now.getTime() - (i * 28 + 15) * 60 * 1000).toISOString();
    const expiresAt = proto.mandateStatus === 'expired'
      ? new Date(now.getTime() - 15 * 86400000).toISOString()
      : new Date(now.getTime() + 180 * 86400000).toISOString();

    // Insert customer
    insertCustomer.run(
      customerId,
      merchant.id,
      customerProf.name,
      customerProf.phone,
      customerProf.email,
      customerProf.vpa,
      new Date(now.getTime() - 90 * 86400000).toISOString()
    );

    // Insert mandate
    insertMandate.run(
      mandateId,
      customerId,
      merchant.id,
      proto.mandateStatus,
      Math.max(proto.amount * 2, 5000),
      'MONTHLY',
      new Date(now.getTime() - 60 * 86400000).toISOString(),
      expiresAt,
      proto.attemptsUsed,
      proto.consecutiveTimeouts
    );

    // Insert failed charge attempt
    insertCharge.run(
      chargeId,
      mandateId,
      proto.amount,
      attemptedAt,
      'failed',
      proto.failureCode,
      proto.rawResponse,
      0 // is_processed = 0 (pending batch recovery)
    );

    count++;
  }

  console.log(`✅ Successfully seeded ${merchants.length} merchants and ${count} failed UPI Autopay charge records.`);
  return { merchantsCount: merchants.length, chargesCount: count };
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('seedData.js')) {
  seedSyntheticData();
  process.exit(0);
}
