# About the MCP Tests

## What These Tests Are

The files in this directory show what a Playwright MCP (Model Context Protocol) test looks like when you describe steps in natural language rather than writing explicit TypeScript selectors and assertions.

Each test uses a `mcpAgent` fixture that exposes two methods:
- `mcpAgent.act(instruction)` — describes an action the AI agent should perform
- `mcpAgent.verify(instruction)` — describes something the AI agent should confirm

## How MCP Testing Actually Works

In a real MCP setup, your test runner connects to a running LLM (such as Claude) via the Model Context Protocol. The test sends each `act` instruction as a prompt, and the LLM calls Playwright tools — `page.click()`, `page.fill()`, `page.goto()` — to execute it. The LLM decides which elements to interact with by reading the page DOM, screenshots, or accessibility tree.

The Playwright team maintains `@playwright/mcp`, which runs a Playwright-backed MCP server that any MCP-compatible client (Claude Desktop, Claude Code, custom integrations) can connect to.

## Demo Mode vs Real MCP Mode

These demo tests run in two modes:

### Demo Mode (default — no API key required)

The `mcpAgent.act()` and `mcpAgent.verify()` calls are logged for narrative purposes, but the actual browser interaction is done by simulation code written directly in the test body. This lets you run the tests and see them pass without a Claude API key — the point is to show the **shape** and **style** of MCP tests, not to require a live AI to run the demo.

To run in demo mode:
```bash
npm run test:mcp
```

### Real MCP Mode (requires Claude API key)

To run these tests with a live Claude instance making the decisions:

1. Install the MCP server: `npm install @playwright/mcp`
2. Set your API key: `export ANTHROPIC_API_KEY=sk-ant-...`
3. Set `USE_REAL_MCP=true` in your `.env.local`
4. Run: `npm run test:mcp`

In real MCP mode, the simulation code is bypassed and each `act` instruction is sent directly to Claude, which decides how to execute it.

## What You Will Notice

When you run both test suites (`npm run test:cli` and `npm run test:mcp`) against the same scenario, you will see:

**CLI tests:**
- Pass or fail deterministically
- Report exact failure locations (line numbers, selectors)
- Run in ~3–5 seconds per test
- Produce clean traces

**MCP tests (demo mode):**
- Pass reliably because the simulation uses the same selectors internally
- Log natural-language narration of each step
- Run slightly slower due to logging overhead

**MCP tests (real MCP mode):**
- Non-deterministic: the AI might interpret instructions differently on different runs
- Slower: each step involves an LLM roundtrip (add ~2–5s per step)
- Produce different kinds of failure messages ("agent could not find element")
- Occasionally succeed on UIs that would break a selector-based test

## Why This Matters

The test code in `loan-application.mcp.spec.ts` is intentionally written to look like what you would send to an AI agent. It is readable as *intent*. The test in `tests/cli/loan-application.cli.spec.ts` is written to be read as *implementation*.

Look at the same scenario side by side:

**MCP:**
```typescript
await mcpAgent.act('Navigate to the loan portal and log in as alex.martinez@example.com');
await mcpAgent.act('Start a new personal loan application for $15,000 over 36 months');
await mcpAgent.verify('The confirmation screen shows a reference number starting with LN-');
```

**CLI:**
```typescript
await portal.goto();
await portal.login(testUser.email, testUser.password);
await portal.navigateToApplyForm();
await portal.fillLoanApplication(loanScenarios.personalLoan);
await portal.submitApplication();
const ref = await portal.getConfirmationReferenceNumber();
expect(ref).toMatch(/^LN-\d{8}-[A-Z0-9]{4}$/);
```

The MCP version is shorter and more readable to a non-developer. The CLI version is more precise, more assertable, and completely deterministic.

Neither is universally better. This is the point of the demo.
