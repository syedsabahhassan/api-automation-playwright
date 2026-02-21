# RESTful API Automation Suite — Playwright + TypeScript

> End-to-end API test automation for a lending platform, demonstrating production-grade patterns for schema validation, OAuth 2.0 auth flows, boundary testing, and CI/CD integration.

---

## Overview

This suite automates the full lifecycle of a **Loan Applications API** — from service health pre-flight checks through to contract validation and business-rule verification. It is designed to run both locally during development and in a GitHub Actions pipeline as a regression gate before sprint releases.

**Tech stack:** Playwright · TypeScript · JSON Schema (AJV) · GitHub Actions · Winston logging

---

## Architecture

```
api-automation-playwright/
├── .github/workflows/ci.yml    # 5-job GitHub Actions pipeline (validate → smoke → regression → contract → report)
├── playwright.config.ts        # Multi-project config (smoke / regression / contract)
├── src/
│   ├── api/
│   │   ├── clients/
│   │   │   ├── baseApiClient.ts      # Generic GET/POST/PATCH/DELETE wrapper
│   │   │   ├── authApiClient.ts      # OAuth 2.0 client-credentials + token caching
│   │   │   └── loanApiClient.ts      # Domain client — Loan Applications API
│   │   └── types/                    # TypeScript interfaces mirroring API contracts
│   ├── fixtures/
│   │   ├── apiFixtures.ts            # Playwright fixture extension (DI for API clients)
│   │   └── testData.ts               # Canonical test data builders
│   └── utils/
│       ├── schemaValidator.ts        # AJV-powered JSON Schema assertion helper
│       └── logger.ts                 # Structured Winston logger (JSON in CI, pretty local)
├── tests/
│   ├── auth/                         # OAuth token lifecycle tests
│   ├── loans/                        # CRUD + business rule tests
│   └── health/                       # Service availability smoke tests
└── schemas/
    └── loan-application.json         # JSON Schema contract for loan responses
```

---

## Key Design Decisions

### Playwright for API Testing
Playwright's `APIRequestContext` was chosen over dedicated REST clients (e.g. SuperTest, RestAssured) to consolidate tooling — the same framework handles both API and UI layers, reducing cognitive overhead and enabling hybrid test scenarios where API setup precedes UI assertions.

### Layered Client Architecture
A three-tier client hierarchy (`BaseApiClient → AuthApiClient → LoanApiClient`) separates transport concerns from authentication from domain logic. Tests interact only with the domain client — changing the auth mechanism or base URL requires a single-file change.

### OAuth Token Caching
The `AuthApiClient` proactively caches access tokens and refreshes them 30 seconds before expiry. This prevents redundant `/oauth/token` calls across a parallel test run (up to 4 workers), cutting suite setup time by ~20% in benchmarks against the demo environment.

### Playwright Fixtures for Dependency Injection
Rather than instantiating clients in `beforeAll` blocks, the suite uses Playwright's `test.extend()` fixture mechanism. This ensures each worker gets its own properly scoped client and eliminates shared-state race conditions in parallel runs.

### JSON Schema Contract Testing
A dedicated `@contract` test project validates every API response against versioned JSON Schema files in `/schemas`. This acts as a lightweight consumer-driven contract layer — any breaking change to the API shape fails the pipeline before it reaches staging.

### CI Pipeline Design
The 4-stage pipeline implements a progressive execution model:
- **validate** — fast lint/typecheck gate (fails in <30s on bad TS)
- **smoke** — health + auth pre-flight (aborts pipeline if API is down)
- **regression** — parallelised suites via `strategy.matrix` across loan and auth
- **contract** — JSON schema validation run in parallel with regression
- **report** — merges results and uploads Playwright HTML report as a workflow artifact

---

## Running Locally

### Prerequisites
- Node.js 20+
- Access to the target API environment

```bash
# Install dependencies and Playwright browsers
npm ci
npx playwright install --with-deps chromium

# Configure local environment
cp .env.local.example .env.local
# Edit .env.local with your BASE_URL, CLIENT_ID, CLIENT_SECRET
```

### Run the full suite
```bash
npm test
```

### Run only smoke tests
```bash
npm run test:smoke
```

### Run a specific test file
```bash
npx playwright test tests/loans/createLoan.spec.ts
```

### View the HTML report
```bash
npm run report
```

---

## CI/CD Pipeline

The pipeline is triggered on:
- **Merge requests** — smoke + regression + contract
- **Default branch push** — full suite + Pages report publish
- **Scheduled (nightly)** — complete regression across all environments

Environment variables (`BASE_URL`, `CLIENT_ID`, `CLIENT_SECRET`) are stored as **GitHub Actions Secrets** under _Settings → Secrets and variables → Actions_ — never committed to source control.

The pipeline also supports `workflow_dispatch` so you can trigger a manual run against a specific environment (dev / staging / uat) directly from the GitHub Actions UI.

---

## Test Coverage

| Suite | Scope | Tags |
|---|---|---|
| `health/` | Service availability, readiness probe | `@smoke` |
| `auth/` | Token issuance, caching, refresh | `@smoke` `@regression` |
| `loans/createLoan` | Happy path, BVA, mandatory fields, business rules | `@smoke` `@regression` `@contract` |
| `loans/getLoan` | Retrieval, pagination, filtering, 401/404 | `@regression` `@contract` |
| `loans/updateLoan` | PATCH, idempotency, withdraw (DELETE) | `@regression` |

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `BASE_URL` | API gateway base URL | Yes |
| `CLIENT_ID` | OAuth client ID | Yes |
| `CLIENT_SECRET` | OAuth client secret | Yes |
| `LOG_LEVEL` | Winston log level (`debug`/`info`/`warn`) | No (default: `info`) |
| `NODE_ENV` | Environment name used for `.env.<name>` file | No (default: `local`) |

---

## Contributing

1. Branch from `main` using `feature/<ticket-id>-short-description`
2. Run `npm run lint && npm run typecheck` before pushing
3. Pull requests must pass the smoke job before review
4. New API endpoints must include both regression and contract tests

---

## Author

**Syed Sabah Hassan** — Senior Quality Engineering Consultant
18+ years in test automation, API testing, and QE leadership across banking and government sectors.
