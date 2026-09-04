# 🛡️ MandateGuard

### AI Revenue Recovery Agent for Failed UPI Autopay & e-Mandate Charges

**Track**: AI Revenue Recovery — **Razorpay AI Buildathon 2026**

---

## 📌 Executive Summary

Subscriptions and recurring payments in India powered by **UPI Autopay** suffer from recurring debit failures — insufficient balance, expired mandates, bank timeouts, and customer revocations.

Today, most merchants either **blindly retry** on a fixed schedule (wasting NPCI-throttled retry attempts, annoying customers, and risking regulatory penalties) or **do nothing** until the subscriber churns.

**MandateGuard** closes that loop through a fintech-native, **explainable, bounded, and gated** agentic loop:

$$\text{Detect} \longrightarrow \text{Diagnose} \longrightarrow \text{Decide} \longrightarrow \text{Recover} \longrightarrow \text{Measure}$$

> **A note on the numbers below**: All metrics in this README (success rates, recovery %, uplift) are measured against a **synthetic, AI-generated test dataset of 52 UPI Autopay failure records** (see `npm run seed`), not live production data. They're meant to demonstrate the policy engine's relative behavior — bounded retries vs. naive retries — not real-world performance claims.

---

## 🚀 Key Differentiators & Pitch Proof Points

| Feature | Naive Blind Retry | **MandateGuard Agent** |
|---|---|---|
| **NPCI Attempt Ceiling** | Blindly exhausts retries (>3×) | **Strict 3-attempt ceiling (0 violations)** |
| **Mandate Lifecycle Gating** | Retries revoked/expired mandates | **Hard gating: 0 retries on revoked/expired** |
| **Timing Alignment** | Blind immediate retries (18% success, synthetic) | **Smart Salary Window (1st–5th / T+2d: 78% success, synthetic)** |
| **Expired Mandates** | Dropped / unrecoverable churn | **1-Click Hinglish WhatsApp Nudge (52% recovery, synthetic)** |
| **Explainability** | Black-box / none | **5-stage regulatory compliance audit trail** |
| **Revenue Uplift** | Baseline | **+139.6% net revenue uplift (synthetic dataset)** |

*All percentages above are computed on the synthetic seed dataset for demo purposes — see [Limitations](#-limitations--whats-next) below.*

---

## 🏗️ Architecture & 5-Stage Agent Loop

```
flowchart LR
    A[Failed Autopay Charge] --> B[1. INGEST]
    B --> C[2. DIAGNOSE<br/>Rule Engine + AI Fallback]
    C --> D[3. DECIDE<br/>Bounded Policy Table]
    D --> E[4. ACT<br/>Smart Retry / Hinglish Nudge]
    E --> F[5. AUDIT LOG<br/>Compliance Narration]
    F --> G[Financial Reporting & Uplift Metric]
```

### The 3 Distinct AI Capabilities

1. **AI Diagnostic Classifier** — Interprets unstructured, vendor-specific, or ambiguous bank clearing strings into 6 normalized root causes with calibrated confidence scores.
2. **Hinglish WhatsApp / SMS Nudge Generator** — Generates high-converting, culturally nuanced localized Hinglish recovery messages with 1-click renewal/pay links.
3. **Regulatory Audit Narrator** — Translates mathematical policy rule triggers into plain-English compliance notes for RBI / NPCI regulatory audit readiness.

---

## ⚡ Decision Policy Table (Bounded & Gated Logic)

| Root Cause | Attempt Ceiling | Action Picked | Regulatory Guardrail |
|---|---|---|---|
| `insufficient_balance` | < 3 attempts | **Smart Retry** (Salary window 1st–5th or T+2d) | Never retry > 3× per cycle |
| `bank_timeout` | < 3 attempts | **Immediate Retry** (T+15m) | Cap retries; 2 consecutive timeouts → escalate |
| `mandate_expired` | Any | **Renewal Nudge** (Hinglish WhatsApp) | Retrying expired mandate is strictly forbidden |
| `mandate_revoked` | Any | **Terminal State** (win-back only) | Never attempt to charge a revoked mandate |
| `technical_failure` | < 2 attempts | **Gateway Retry** (T+1h) | Escalate to engineering after 2 fails |
| `unknown / low confidence` | Any | **Escalate to Manual Ops Queue** | Never auto-retry unconfident cases (<70%) |

---

## 🧯 What Broke, and How It Was Fixed

Building the bounded policy engine surfaced a few real failure modes worth documenting:

- **[Describe issue #1 — e.g. race condition in retry counter, or classifier misfiring on ambiguous bank strings]**: what happened, how you noticed it, and the fix.
- **[Describe issue #2 — e.g. AI classifier initially retried expired mandates because confidence scoring didn't hard-gate lifecycle state]**: what happened and the fix (e.g. moved lifecycle gating *before* the AI classifier instead of after, so a low-confidence AI call can never override a hard regulatory rule).
- **[Describe issue #3, optional]**.

*(Replace the above with your actual debugging story — even 2–3 concrete examples give the panel something real to ask about, and it's one of the four official evaluation criteria.)*

---

## 🧪 Limitations & What's Next

- Metrics are computed on a **52-record synthetic dataset**, generated to model realistic UPI Autopay failure distributions — not live merchant data.
- No real Razorpay production API calls are made; the app uses Razorpay's **test-mode APIs / mocked responses**.
- Next steps if selected: validate policy thresholds against real anonymized failure data, add human-in-the-loop review for the "unknown/low confidence" queue, and load-test the retry scheduler under concurrent mandate volumes.

---

## 💻 Quick Start & Running Locally

### 1. Install & Seed

```bash
# Clone or navigate to the directory
cd mandateguard

# Install and start the backend & frontend
npm run dev
```

The application will start at:

- **Frontend Dashboard**: `http://localhost:5173` (or `http://localhost:3001` in production mode)
- **Backend API**: `http://localhost:3001/api/dashboard/stats`

### 2. CLI Batch Recovery Mode

To run the automated recovery agent over the synthetic dataset directly in your terminal:

```bash
npm run recover
```

### 3. Re-seed Synthetic Dataset

To reset and re-seed 52 realistic UPI Autopay failure records:

```bash
npm run seed
```

---

## 🔗 Live Demo

[mandateguard.onrender.com](https://mandateguard.onrender.com/)

*(Note: hosted on Render's free tier — may take 20–30s to spin up on first load.)*

---

## About

AI Revenue Recovery Agent for Failed UPI Autopay & e-Mandate Charges (Razorpay Buildathon 2026)
