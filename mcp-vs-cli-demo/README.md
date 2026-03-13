# MCP vs CLI — A Practical Playwright Comparison

A side-by-side demo of the same test scenarios implemented two ways: using Playwright MCP (AI-driven, natural language) and standard Playwright CLI (TypeScript, page objects, fixtures). Built as a companion to the [API automation suite](../README.md) in this repo, extending the same loan application domain with a browser-based portal.

This is not a "here's the future of testing" piece. It is an honest comparison — both approaches running against the same application, the same mock server, and the same three business scenarios, so you can see exactly where each excels and where each breaks down.

---

## Why This Comparison Matters

AI-driven testing tools are moving fast. The pitch is appealing: describe your test in plain English and the AI handles the rest. That is genuinely useful in some situations. In others, it introduces flakiness, debugging opacity, and cost that you would never accept in a mature test suite.

Most articles on this topic are either "AI testing is the future" or "you still need to write code." This demo runs both approaches and shows you the trade-offs on concrete, realistic test scenarios — not toy examples.

---

## Architecture

```
mcp-vs-cli-demo/
├── portal/
│   └── index.html              # Loan application SPA (vanilla HTML/CSS/JS)
├── portal-server.js            # Lightweight static server for the portal
├── src/
│   ├── page-objects/
│   │   └── LoanPortalPage.ts   # Page object — all selectors and actions in one place
│   ├── fixtures/
│   │   └── hybridFixtures.ts   # Extended fixtures (portal + loanApi + mcpAgent)
│   └── data/
│       └── loanScenarios.ts    # Typed test data — same scenarios used by both suites
├── tests/
│   ├── cli/                    # Standard Playwright tests (TypeScript, deterministic)
│   │   ├── loan-application.cli.spec.ts
│   │   └── validation.cli.spec.ts
│   └── mcp/                    # MCP-style tests (natural language narration + simulation)
│       ├── loan-application.mcp.spec.ts
│       └── ABOUT_MCP_TESTS.md
├── docs/
│   ├── PROJECT_PROPOSAL.md     # Full project brief, implementation plan, portfolio notes
│   ├── COMPARISON_MATRIX.md    # Detailed trade-off analysis with side-by-side code
│   ├── DEMO_NARRATION.md       # Speaking script for video, interviews, LinkedIn
│   └── LINKEDIN_POST.md        # Ready-to-publish LinkedIn announcement
├── playwright.config.ts
└── package.json
```

The portal calls the existing `mock-server/server.js` at the parent level — no API code is duplicated. The `LoanApiClient`, `AuthApiClient`, and `BaseApiClient` from `../src/api/clients/` are reused directly.

---

## The Test Scenario

A loan applicant logs into a web portal, fills out a personal loan application, submits it, and receives a reference number. Tests then verify the outcome both through the UI and through the underlying REST API.

Three scenarios run in both test suites:

1. **Happy path** — valid personal loan application, confirmed reference number, cross-verified via API
2. **Form validation** — required fields, below-minimum amounts, invalid email format
3. **Hybrid flow** — API-seeded application verified on the portal dashboard, API teardown

These are the same scenarios. The point is to compare how each approach handles them, not to test different things.

---

## How to Run

### Prerequisites

```bash
node --version   # 18+
npm --version    # 8+
```

### Install

```bash
# From the repo root
cd mcp-vs-cli-demo
npm install
npx playwright install chromium
```

### Copy environment config

```bash
cp .env.example .env.local
```

### Start the servers

```bash
# Terminal 1: Mock API
node ../mock-server/server.js

# Terminal 2: Portal
node portal-server.js
```

Or, if you have `concurrently`:
```bash
npm run start
```

### Run tests

```bash
# All CLI tests
npm run test:cli

# Smoke only (fast)
npm run test:cli:smoke

# Full regression
npm run test:cli:regression

# MCP demo tests (demo mode — no API key needed)
npm run test:mcp

# View the HTML report
npm run report
```

### Viewing the comparison side by side

Open these two files together in your editor:

```
tests/cli/loan-application.cli.spec.ts
tests/mcp/loan-application.mcp.spec.ts
```

Both files test Scenario 1 (personal loan happy path) and Scenario 3 (hybrid dashboard). Read the inline comments — they explain the specific trade-offs at each step.

---

## Key Findings

### MCP is genuinely useful for

- Getting first coverage on a new UI feature quickly
- Writing test scenarios that non-technical stakeholders can read and review
- Exploratory testing where you are not sure what elements to target
- Adapting to UIs that change frequently without updating selectors

### CLI is still the right default for

- Any test that runs in CI and whose result you need to trust
- Hybrid tests that combine API and UI steps in one flow
- Precise assertions on structured data (regex, schema, response body)
- Debugging — CLI gives you exact failure locations; MCP gives you "the agent couldn't do it"
- Teams that care about test ownership, review, and long-term maintainability

### The honest summary

MCP works best as a *test authoring tool* — use it to generate a first draft, then refactor into proper page objects and typed assertions. Treating it as a permanent *test execution runtime* is a high-risk choice for any suite that runs in production CI.

The cost per run (API calls), the latency (LLM roundtrips), and the non-determinism (AI can misinterpret the same UI differently on different runs) are real constraints that do not go away as the tooling matures. They are properties of the approach, not bugs to be fixed.

---

## Connection to the Companion API Repo

This demo was built to extend, not duplicate, the [API automation suite](../README.md) in this repo:

- **Same domain**: Both repos test the Loan Applications API and the same applicant data
- **Shared clients**: `LoanApiClient`, `AuthApiClient`, and `BaseApiClient` are imported directly — no copies
- **Same mock server**: `mock-server/server.js` runs unchanged; this demo adds a portal on top
- **Same CI structure**: The 5-job pipeline (validate → smoke → regression → report) mirrors the parent repo
- **Same test data patterns**: `buildPersonalLoanRequest()` and the applicant factories are extended, not replaced

If you are evaluating this repo as a portfolio piece, the connection between the two is part of the point: a well-structured API suite can grow to support UI testing without starting over.

---

## Lessons Learned

**On MCP:** The natural language interface is genuinely readable and genuinely fast to write. The limitation is that it front-loads the authoring convenience and back-loads the debugging pain. When tests fail in CI, you want a precise error message and a stack trace — not "the agent could not complete the action."

**On page objects:** The `LoanPortalPage` class is the most important file in this demo. A good page object is what makes CLI tests readable. Without it, CLI tests are a wall of selectors. With it, they read almost as naturally as MCP tests — and they run deterministically.

**On hybrid testing:** The hybrid scenario (API setup + UI verification + API teardown) is the strongest argument for CLI. When you need to orchestrate multiple systems in sequence and assert structured state at each step, code is the right tool. MCP can navigate the UI but cannot cleanly capture, store, and use structured data across steps.

**On trade-offs:** The right answer depends on your team, your application stability, your CI budget, and how much you trust your test results. Both approaches are valid in the right context. The mistake is treating either as universally correct.

---

## Future Enhancements

- Add a real MCP integration using `@playwright/mcp` and the Claude API
- Add contract tests that validate the portal's API calls against the JSON Schema
- Add visual regression tests (screenshot comparison) as a third approach layer
- Extend the mock server with WebSocket support to simulate real-time status updates

---

## Related

- [Root repo README](../README.md) — the API automation suite this extends
- [docs/COMPARISON_MATRIX.md](./docs/COMPARISON_MATRIX.md) — full trade-off analysis
- [docs/PROJECT_PROPOSAL.md](./docs/PROJECT_PROPOSAL.md) — project brief and implementation plan
- [tests/mcp/ABOUT_MCP_TESTS.md](./tests/mcp/ABOUT_MCP_TESTS.md) — how the MCP tests work in demo vs real mode
