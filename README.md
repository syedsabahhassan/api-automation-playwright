# RESTful API Automation Suite — Playwright + TypeScript

> End-to-end API test automation for a lending platform, demonstrating production-grade patterns for schema validation, OAuth 2.0 auth flows, boundary testing, and CI/CD integration.

---

## Overview

This suite automates the full lifecycle of a **Loan Applications API** — from service health pre-flight checks through to contract validation and business-rule verification. It is self-contained: a lightweight Express mock server ships with the repo so the full suite runs green in CI with zero external dependencies.

**Tech stack:** Playwright · TypeScript · JSON Schema (AJV) · GitHub Actions · Winston · Express (mock server)

---

## Architecture

```
api-automation-playwright/
├── .github/workflows/ci.yml    # 5-job GitHub Actions pipeline
├── mock-server/server.js       # Express mock — full Loan API contract in ~180 lines
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
│       └── logger.ts                 # Structured Winston logger
├── tests/
│   ├── auth/                         # OAuth token lifecycle tests
│   ├── loans/                        # CRUD + business rule tests
│   └── health/                       # Service availability smoke tests
└── schemas/
    └── loan-application.json         # JSON Schema contract for loan responses
```

---

## Key Design Decisions

**Playwright for API testing** — Playwright's `APIRequestContext` consolidates tooling across API and UI layers, enabling hybrid test scenarios where API setup precedes UI assertions.

**Layered client architecture** — `BaseApiClient → AuthApiClient → LoanApiClient` separates transport, auth, and domain logic. Tests interact only with the domain client.

**OAuth token caching** — `AuthApiClient` caches tokens and refreshes 30s before expiry, preventing redundant `/oauth/token` calls across parallel workers.

**Playwright fixtures for DI** — `test.extend()` scopes clients per worker, eliminating shared-state race conditions in parallel runs.

**JSON Schema contract testing** — A `@contract` project validates every response against versioned schemas in `/schemas`, catching breaking API changes before staging.

**Self-contained CI** — The mock server starts as a background process before each test job. No external infrastructure needed — push and go green immediately.

---

## Running Locally

```bash
# Install dependencies
npm ci
npx playwright install --with-deps chromium

# Copy and configure environment
cp .env.local.example .env.local

# Terminal 1 — start mock server
npm run mock

# Terminal 2 — run tests
npm test
```

Run specific subsets:
```bash
npm run test:smoke          # smoke tests only
npm run test:regression     # regression only
npx playwright test tests/loans/createLoan.spec.ts   # single file
npm run report              # open HTML report
```

---

## CI/CD Pipeline

| Job | Trigger | What it does |
|---|---|---|
| `validate` | All pushes / PRs | Lint + typecheck |
| `smoke` | After validate | Health + auth pre-flight |
| `regression` | After smoke (parallel: loans, auth) | Full regression suite |
| `contract` | After smoke | JSON schema validation |
| `report` | After regression + contract | Merge & upload HTML report |
| `nightly` | Scheduled 02:00 AEST | Full suite run |

Each test job starts the mock server, waits for `/health` to respond, runs tests, then stops the server.

---

## Test Coverage

| Suite | Scope | Tags |
|---|---|---|
| `health/` | Service availability, readiness probe | `@smoke` |
| `auth/` | Token issuance, caching, refresh | `@smoke` `@regression` |
| `loans/createLoan` | Happy path, BVA, mandatory fields, affordability rule | `@smoke` `@regression` `@contract` |
| `loans/getLoan` | Retrieval, pagination, filtering, 401/404 | `@regression` `@contract` |
| `loans/updateLoan` | PATCH, idempotency, withdraw (DELETE) | `@regression` |

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `BASE_URL` | API base URL | `http://localhost:3000` |
| `CLIENT_ID` | OAuth client ID | `test-client-id` |
| `CLIENT_SECRET` | OAuth client secret | `test-client-secret` |
| `LOG_LEVEL` | Winston log level | `info` |

---

## Author

**Syed Sabah Hassan** — Senior Quality Engineering Consultant
18+ years in test automation, API testing, and QE leadership across banking and government sectors.
