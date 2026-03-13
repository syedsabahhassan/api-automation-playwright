# Project Proposal: MCP vs CLI — A Practical Playwright Comparison

## What This Demo Is

This demo places two approaches to Playwright test automation side by side and runs the same realistic test scenarios through both. One side uses the **Playwright MCP (Model Context Protocol)** approach, where an AI agent interprets natural language instructions and drives the browser. The other uses **standard Playwright CLI** tests: TypeScript, page objects, fixtures, and deterministic assertions.

The scenario is a **hybrid API + UI loan application flow** built on top of an existing API automation suite. An applicant logs into a web portal, fills out a loan application form, submits it, and receives a reference number. The tests then verify the outcome both through the UI and through the underlying REST API — the kind of end-to-end coverage you actually need in production.

This is not a toy counter-app or a hello-world test. It is the same domain and the same mock server used in the companion API automation repo, extended with a browser-based portal. Both sides test real business logic.

---

## Why It Matters

AI-assisted testing tools are moving fast. A lot of engineers are hearing about MCP, about "just describe your test in plain English," about the idea that you might not need to write Playwright code yourself anymore. Some of that is real. A lot of it is hype.

This demo gives you something honest: a working side-by-side comparison where you can see exactly where the AI-driven approach saves time, where it introduces uncertainty, and where good old TypeScript is still the right answer.

If you are a QA lead trying to decide whether to adopt MCP tooling, a senior SDET being asked by your manager about "AI testing," or an engineer who wants to explain the trade-offs clearly in an interview — this demo gives you something concrete to point to.

---

## Who This Is For

- **QA engineers and SDETs** evaluating modern tooling choices
- **Automation architects** designing test frameworks for new or growing teams
- **Technical leads** who need to explain these trade-offs to stakeholders
- **Junior engineers** trying to understand when to reach for which tool
- **Hiring managers and interviewers** looking for candidates who understand nuance

---

## What the Audience Will Learn

1. How Playwright MCP works in practice, not just in theory
2. How it compares to a well-structured CLI test suite on the same scenario
3. The specific situations where each approach genuinely excels
4. What breaks, what is hard to debug, and what is hard to maintain in each
5. How to extend an existing API automation suite with UI tests in a consistent style
6. A concrete architectural pattern for hybrid API + UI testing

---

## Scenario: Loan Application Flow (Hybrid API + UI)

The chosen scenario is a personal loan application through a web portal. This flow was selected because it:

- Already has a rich API layer in the companion repo (same mock server, same domain)
- Involves both structured form input and dynamic API responses
- Has meaningful validation rules to test (required fields, amount limits, affordability)
- Combines UI interaction with API verification — exactly where the two approaches diverge most clearly

**Test Flow:**

1. Navigate to the loan application portal
2. Log in with credentials
3. Fill out the personal loan form (product, amount, term, applicant details)
4. Submit the application
5. Verify the confirmation screen shows a reference number
6. Verify the application exists in the API with the expected status
7. (Cleanup) Withdraw the application via API

The same three test scenarios run in both the MCP and CLI implementations:
- Happy path: valid personal loan application
- Validation: required field omissions and boundary amounts
- Hybrid: API-created seed data, UI verification, API teardown

---

## How This Extends the Companion API Repo

The existing `api-automation-playwright` repo tests the Loan Applications API directly. This demo adds one layer on top: a browser-based portal that surfaces the same API through a UI.

The `LoanApiClient`, `BaseApiClient`, `AuthApiClient`, and test data builders are all reused as-is. The `hybridFixtures.ts` extends the existing `apiFixtures.ts`. The mock server is extended with static file serving so the portal HTML loads without a separate server. The CI workflow follows the same job structure: validate → smoke → regression → report.

Nothing in the existing repo is modified. This demo lives in its own subdirectory and is designed to feel like a natural next chapter in the same project.

---

## Implementation Plan

### Phase 1 — Setup (Day 1)

- [ ] Create `mcp-vs-cli-demo/` directory structure inside the existing repo
- [ ] Extend `mock-server/server.js` with static file serving for the portal
- [ ] Write `portal/index.html` — the browser-based loan application portal
- [ ] Create `playwright.config.ts` with browser projects (Chromium) and API project
- [ ] Configure `.env.example` and `package.json`
- [ ] Validate the portal loads and submits a loan correctly against the mock server

### Phase 2 — CLI Demo (Days 2–3)

- [ ] Write `LoanPortalPage.ts` page object with typed selectors and action methods
- [ ] Write `ApplicationDashboard.ts` page object for the status screen
- [ ] Write `hybridFixtures.ts` extending the existing API fixtures with a page fixture
- [ ] Write `loanScenarios.ts` with the three test data sets
- [ ] Write `loan-application.cli.spec.ts` — happy path and hybrid scenarios
- [ ] Write `validation.cli.spec.ts` — form validation edge cases
- [ ] Run locally, confirm all pass, check trace files look clean

### Phase 3 — MCP Demo (Days 3–4)

- [ ] Research current Playwright MCP integration options (`@playwright/mcp`, Claude API)
- [ ] Write `mcpAgent` fixture wrapper that represents the MCP interaction model
- [ ] Write `loan-application.mcp.spec.ts` — same three scenarios in natural language style
- [ ] Add `ABOUT_MCP_TESTS.md` with honest notes on what runs vs what is conceptual
- [ ] Document the setup steps required for a real MCP-connected run

### Phase 4 — Comparison Artifacts (Day 4)

- [ ] Write `COMPARISON_MATRIX.md` with detailed trade-off analysis
- [ ] Add inline code comments across both test files highlighting key contrasts
- [ ] Create a side-by-side diff table showing the same scenario written both ways

### Phase 5 — GitHub Polish (Day 5)

- [ ] Write the main `README.md` with full project overview, how-to-run, and architecture
- [ ] Add `demo-ci.yml` GitHub Actions workflow following the same 5-job structure
- [ ] Add `.gitignore` entries for MCP API keys and portal build artefacts
- [ ] Final review: do all tests pass? Is the README accurate? Do all links work?

### Phase 6 — Portfolio Assets (Day 6)

- [ ] Write `DEMO_NARRATION.md` — speaking scripts for LinkedIn video, interviews, meetups
- [ ] Write `LINKEDIN_POST.md` — polished announcement post
- [ ] Review `PORTFOLIO_NOTES.md` for positioning advice

---

## Portfolio Angle

This project sits at the intersection of three things that matter in 2025 and beyond: test architecture, AI tooling, and honest engineering judgement.

Most portfolio projects demonstrate that you can write tests. This one demonstrates that you understand trade-offs. The fact that you ran both approaches against the same scenario and documented what each does well and where each breaks down signals the thinking of a senior engineer, not a practitioner who learned one tool and declared it the answer.

For **LinkedIn visibility**: the "AI testing tool comparison" topic generates real engagement from other QA professionals trying to navigate the same choices.

For **GitHub portfolio quality**: the project is structured, documented, and directly connected to existing work — it reads like a real engineering decision, not a practice exercise.

For **interview discussions**: "Tell me about a time you evaluated competing technical approaches" — this is a concrete, detailed answer.

For **automation architecture conversations**: you can walk through the trade-off matrix confidently, having actually built and run both sides.

---

## Final Recommendation

### Where MCP Genuinely Helps

- Early-stage projects where you don't have page objects yet and need exploratory coverage fast
- Ad-hoc test generation for unstable UIs that would require constant selector maintenance
- Non-technical stakeholders or BAs who want to describe test scenarios and have them executed
- Spike testing: "can this flow work at all?" before you invest in proper automation
- Accessibility and UX verification where the point is human-like navigation, not pixel-perfect selectors

### Where CLI Is Still the Better Default

- Any test that runs in CI — MCP adds latency, cost (API calls), and non-determinism
- Regression suites where you need to trust the test result completely
- Large teams where test ownership, code review, and maintainability matter
- Financial or healthcare systems where flaky tests have real consequences
- Any scenario requiring precise assertion against structured data (API responses, DB state)

### The Balanced Engineering Recommendation

Use MCP as an accelerator for getting to first coverage, and use CLI as the foundation you build on. The pattern that makes most sense: generate a draft test with an MCP tool, review the output, refactor it into proper page objects and typed fixtures, then run it in CI as standard Playwright code.

Treating MCP as a permanent runtime test executor is a risky choice for any suite that matters. Treating it as a productivity tool for the authoring phase is probably where most teams will land.
