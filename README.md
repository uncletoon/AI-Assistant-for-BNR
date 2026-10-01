# AgriCredit AI: AI-Assisted Agricultural Credit Risk Assessment

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4-indigo.svg)](https://www.prisma.io/)
[![Google Gemini API](https://img.shields.io/badge/Google%20Gemini-3%20Flash-orange.svg)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-38bdf8.svg)](https://tailwindcss.com/)

AgriCredit AI is an enterprise-grade, explainable AI credit underwriting assistant developed for agricultural lending in Rwanda (pilot focused on Gasabo District maize cooperatives). It empowers credit officers at institutions like the Bank of Kigali and local Umurenge SACCOs to assess creditworthiness, extract loan and off-take contracts, evaluate multi-pillar risk, and generate regulatory audit-compliant credit memos under National Bank of Rwanda (BNR) prudential guidelines.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Four-Pillar Risk Scoring Engine](#four-pillar-risk-scoring-engine)
- [Data Model & Database Schema](#data-model--database-schema)
- [Prerequisites & Environment](#prerequisites--environment)
- [Installation & Quick Start](#installation--quick-start)
- [API Reference (`/api/v1`)](#api-reference-apiv1)
- [Development & Testing Commands](#development--testing-commands)
- [Regulatory Compliance & Governance](#regulatory-compliance--governance)

---

## Overview

Agricultural cooperatives in Rwanda often face significant financing barriers due to informal documentation, variable seasonal cash flows, and fragmented credit histories across SACCOs and commercial banks.

AgriCredit AI bridges this gap through:

1. **Triangulating Cross-Institutional Data**: Blending historical SACCO credit ledgers, commercial bank accounts, RCA (Rwanda Cooperative Agency) registry data, and buyer off-take contracts.
2. **Multimodal Document Extraction**: Ingesting scanned loan applications, PDFs, DOCX agreements, and forward sales contracts using Gemini 3 Flash with human-in-the-loop validation.
3. **Calibrated Credit Scorecard**: Generating a transparent score (0 to 100) with key score drivers and risk bands (Low, Moderate, High, Very High).
4. **Explainable Chronological Proof**: Providing full traceability for every factor point awarded, linking to verifiable ledgers and counterparties.
5. **Interactive Natural Language AI**: Answering credit committee queries directly via Gemini Function Calling against live PostgreSQL data.

---

## Key Features

- **Gemini-First Conversational Assistant**: Natural language querying with automated database tool-calling for cooperative details, cash flow sweeps, repayment ledgers, and fairness metrics.
- **Multimodal Document Parser**: Instant structured extraction from `.docx`, `.pdf`, `.xlsx`, `.txt`, `.csv`, `.png`, and `.jpg` application files.
- **Human-in-the-Loop Review**: Pre-scoring parameter verification modal allowing loan officers to inspect and refine extracted terms before assessment execution.
- **Antigravity-Inspired Centered UI**: Clean, high-contrast, centered responsive chat interface with equal margin spacing, dark readable typography, and quick-check prompts.
- **Chronological Evidence Timeline**: Visual timeline tracing historical loan disbursements, on-time settlements, grain deliveries, and forward contracts.
- **What-If Sensitivity Simulator**: Counterfactual scenario simulator testing facility amount changes, tenor extensions, price fluctuations, and storage upgrades without altering baseline records.
- **BNR Compliance & Override Governance**: Mandatory justification logging for human decision overrides with immutable database audit trails.
- **Fairness & ESG Monitoring**: Sector-level and women-led cooperative lending analytics ensuring equitable credit distribution.

---

## System Architecture

```
                               ┌──────────────────────────────────────────────┐
                               │             React 19 Frontend                │
                               │   (Centered Feed, AI Renderers, Modals)      │
                               └──────────────────────┬───────────────────────┘
                                                      │ HTTP / REST (/api/v1)
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │           Express.js & TypeScript            │
                               │         Controllers & Middleware Pipeline    │
                               └──────┬───────────────────────────────┬───────┘
                                      │                               │
            Tool Calling / Extraction │                               │ Prisma ORM
                                      ▼                               ▼
       ┌──────────────────────────────────────────────┐  ┌───────────────────────────────────┐
       │             Google Gemini API                │  │            PostgreSQL             │
       │    (@google/genai · Gemini 3 Flash)          │  │   Cooperatives, Loans, Scores,    │
       │    - Multimodal Document Extraction          │  │   Repayments, Off-take, Audits    │
       │    - Function Calling & Query Routing        │  │   (Views, Triggers, Constraints)  │
       └──────────────────────────────────────────────┘  └───────────────────────────────────┘
```

---

## Tech Stack

### Backend

- **Runtime**: Node.js 20+ (ES Modules)
- **Framework**: Express.js 4
- **Language**: TypeScript 5.7
- **Database & ORM**: PostgreSQL with Prisma ORM 6.4
- **AI Integration**: Official `@google/genai` SDK
- **Data Validation & Parsing**: Zod 3.24, Multer, Node.js `zlib` OpenXML decompression
- **Testing**: Vitest 3.0, Supertest 7.0

### Frontend

- **Framework**: React 19
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Typography**: High-contrast, clean dark slate/black palette optimized for readability

---

## Four-Pillar Risk Scoring Engine

The calibrated credit risk engine evaluates applications across four deterministic pillars (100 total points max):

| Pillar                                 | Max Points | Evaluation Scope & Data Evidence                                                                                                                                        |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Repayment Discipline**            | **35 pts** | Historical settlement across SACCOs & banks, on-time installment ratio, maximum days past due (DPD), and debt service track record.                                     |
| **2. Commercial Off-Take Security**    | **25 pts** | Binding forward purchase contracts with verified buyers (e.g., Africa Improved Foods, Minimex), floor prices, contracted volume coverage, and escrow account covenants. |
| **3. Operating Cash Flow & Liquidity** | **25 pts** | Grain aggregation revenue, seasonal operating expense ratio, net cash flow trends, and Debt Service Coverage Ratio (DSCR ≥ 1.25x).                                      |
| **4. Operational & Storage Capacity**  | **15 pts** | Hectares under cultivation, farmer membership size, RCA audit record quality (0–100), aerated warehouse infrastructure, and post-harvest loss controls.                 |

### Score Bands & Recommendations

- **Low Risk (75–100 pts)**: Recommended for standard approval with structured escrow sweeps.
- **Moderate Risk (60–74 pts)**: Recommended with enhanced covenants (e.g. NAIS crop insurance, co-signers).
- **High Risk (<60 pts)**: Requires credit committee review or credit restructuring.

---

## Data Model & Database Schema

The PostgreSQL database (managed via Prisma) enforces banking constraints and relational integrity:

- **`cooperatives`**: Core entity (Rwandan TIN, registration number, sector, member count, hectares, storage capacity, women-led status, record quality).
- **`lenders`**: Financial institutions (Bank of Kigali, Bumbogo Umurenge SACCO, Gikomero SACCO, etc.).
- **`users`**: Role-based access control (`LOAN_OFFICER`, `RISK_ANALYST`, `BRANCH_MANAGER`, `SYSTEM_ADMIN`).
- **`loan_cases`**: Loan application dossiers (`DRAFT`, `DOCUMENTS_COMPLETE`, `SCORED`, `DECIDED`).
- **`documents`**: Ingested files with JSON-extracted metadata and storage paths.
- **`loan_records` & `repayment_history`**: Cross-institutional prior credit lines and payment ledgers.
- **`account_transactions`**: Money-in (grain sales) and money-out cash flow transactions.
- **`offtake_agreements`**: Forward buyer contracts, volumes, floor prices, and verification flags.
- **`scores` & `score_reasons`**: Persisted model outputs, factor point breakdowns, and simulation flags (`isWhatIf`).
- **`decisions`**: Final officer decisions (`APPROVE`, `REJECT`, `OVERRIDE_APPROVE`, `OVERRIDE_REJECT`) with mandatory justification enforcement.
- **`audit_log`**: Append-only compliance log capturing all document evaluations and officer actions.
- **`fairness_summary`**: SQL view aggregating sector and gender distribution metrics.

---

## Prerequisites & Environment

- **Node.js**: v20.0.0 or higher
- **PostgreSQL**: v14.0 or higher
- **npm**: v10.0 or higher
- **Google Gemini API Key**: from [Google AI Studio](https://aistudio.google.com/)

### Environment Configuration

Create a `.env` file in `backend/`:

```ini
# Server Port
PORT=5000

# PostgreSQL Connection String
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/agricredit_db?schema=public"

# Google Gemini API
GEMINI_API_KEY="your_gemini_api_key_here"
GEMINI_MODEL="gemini-3.8-flash"

# Node Environment
NODE_ENV="development"
```

---

## Installation & Quick Start

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-org/ai-assistant-for-bnr.git
cd ai-assistant-for-bnr

# Install root, backend, and frontend dependencies
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 2. Setup Database & Seed Data

```bash
# Push database schema to PostgreSQL
npm --prefix backend run prisma:push

# Seed Gasabo cooperatives, historical SACCO loans, transactions, and users
npm --prefix backend run prisma:seed
```

### 3. Run Development Servers

```bash
# Start backend (port 5000)
npm --prefix backend run dev

# In another terminal, start frontend (port 5173 with Vite proxy)
npm --prefix frontend run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## API Reference (`/api/v1`)

| Endpoint                             | Method   | Description                                                       |
| ------------------------------------ | -------- | ----------------------------------------------------------------- |
| `/api/v1/health`                     | `GET`    | Health check and database connectivity latency                    |
| `/api/v1/cooperatives`               | `GET`    | List Gasabo cooperatives with sector and search filters           |
| `/api/v1/cooperatives/:id`           | `GET`    | Detailed institutional profile, cash flows, and loan history      |
| `/api/v1/cases`                      | `GET`    | List loan case dossiers with latest scores and status             |
| `/api/v1/cases/:id`                  | `GET`    | Retrieve complete loan case docket with score breakdown           |
| `/api/v1/scoring/extract`            | `POST`   | Multipart document extraction for human-in-the-loop review        |
| `/api/v1/scoring/evaluate`           | `POST`   | End-to-end evaluation: parse, score, persist case and audit trail |
| `/api/v1/scoring/cases/:id/score`    | `POST`   | Re-score an existing case from database parameters                |
| `/api/v1/scoring/cases/:id/simulate` | `POST`   | Run What-If counterfactual scenario sensitivity analysis          |
| `/api/v1/scoring/cases/:id/decision` | `POST`   | Record committee approval/override with compliance check          |
| `/api/v1/scoring/cases/:id`          | `DELETE` | Cascade delete assessment docket and related records              |
| `/api/v1/chat`                       | `POST`   | Conversational Gemini retrieval with Function Calling             |
| `/api/v1/monitoring/fairness`        | `GET`    | BNR fairness summary by sector and gender leadership              |

---

## Development & Testing Commands

### Backend

```bash
# Run test suite (unit and integration tests with Vitest)
npm --prefix backend test

# TypeScript typecheck
npm --prefix backend run lint

# Compile to dist/
npm --prefix backend run build
```

### Frontend

```bash
# Run frontend typecheck
npm --prefix frontend run lint

# Build production bundle
npm --prefix frontend run build
```

---

## Regulatory Compliance & Governance

- **National Bank of Rwanda (BNR) Alignment**: Evaluated under BNR Prudential Guidelines on Agricultural Credit Risk (Regulation No. 04/2021).
- **Explainability First**: Every risk score output is fully deterministic and explainable; AI generates structured parameters and natural language narratives backed by numerical pillar formulas.
- **Decision Override Constraints**: Officers can override automated scorecard recommendations, but database trigger rules strictly enforce a non-empty audit justification.
- **Append-Only Audit Trail**: All scoring runs, document uploads, and credit decisions are permanently recorded in the `audit_log` table with user attribution.

---

## License

This project is licensed under the Apache-2.0 License.
