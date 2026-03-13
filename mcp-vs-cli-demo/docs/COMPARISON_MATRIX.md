# MCP vs CLI Comparison Matrix

This matrix covers the same loan application test scenario implemented two ways. The goal is to make the trade-offs concrete and honest — not to declare a winner, but to help you pick the right tool for your specific situation.

---

## At a Glance

| Dimension | MCP (AI-Driven) | CLI (Standard Playwright) |
|---|---|---|
| Setup effort | Low — describe and go | Medium — selectors, page objects, fixtures |
| Test readability | High for intent | High for implementation detail |
| Execution speed | Slow (AI roundtrips) | Fast (direct browser control) |
| Reliability / flakiness | Lower (AI can misread UI) | Higher (deterministic selectors) |
| Debugging experience | Hard (black box AI steps) | Good (traces, screenshots, step-by-step) |
| CI/CD suitability | Poor | Excellent |
| Team adoption curve | Easy for non-coders | Requires TypeScript familiarity |
| Cost per test run | High (LLM API calls) | Near zero |
| Maintenance burden | Low if UI changes a lot | Medium (selectors break on UI changes) |
| Structured assertion depth | Shallow | Deep (typed, schema-validated) |
| Parallel execution | Limited | Excellent (Playwright workers) |
| Reproducibility | Not guaranteed | Guaranteed |
| Handles dynamic content | Reasonably well | Requires explicit waits |
| Secrets / PII safety | Risk (prompts may leak) | Safe (code controls data flow) |

---

## Detailed Analysis by Dimension

### Setup Effort

**MCP:** You point the agent at a URL and describe what you want. No selectors, no imports, no `npm install`. For a 5-step flow you could be running in under 10 minutes. The cost is that you have zero visibility into how it selected elements or what it clicked.

**CLI:** You install dependencies, create a playwright.config.ts, write page objects, set up fixtures, and type out assertions. For a meaningful flow — login, form fill, submit, verify — you are looking at a day of work if you want it done properly. The benefit is that you understand exactly what runs and why.

**Verdict for setup:** MCP wins for speed-to-first-test. CLI wins for speed-to-trustworthy-test.

---

### Control and Flexibility

**MCP:** You say "fill in the loan amount field with 15000" and the AI decides which element to target, which interaction to use, and whether it succeeded. You have limited ability to override that decision. If the AI interprets your instruction in an unexpected way, you have to rephrase — there is no selector to fix.

**CLI:** You write `await this.amountInput.fill('15000')` and you control every parameter. You can add retries, custom waits, conditional logic. The code does exactly what you say.

**Verdict for control:** CLI wins clearly. The flexibility gap is large.

---

### Readability

**MCP tests look like this:**
```
await mcpAgent.act('Navigate to the loan portal and log in as alex.martinez@example.com');
await mcpAgent.act('Fill out a personal loan application for $15,000 over 36 months');
await mcpAgent.act('Submit the application and wait for the confirmation screen');
await mcpAgent.verify('A reference number starting with LN- is displayed');
```

**CLI tests look like this:**
```typescript
await portalPage.login(testUser.email, testUser.password);
await portalPage.fillLoanApplication(loanScenarios.personalLoan);
await portalPage.submitApplication();
const refNumber = await portalPage.getConfirmationReferenceNumber();
expect(refNumber).toMatch(/^LN-\d{8}-[A-Z0-9]{4}$/);
```

MCP is readable as *intent*. CLI is readable as *implementation*. For a non-technical stakeholder reviewing a test plan, MCP is clearer. For a developer debugging a failure, CLI is clearer. Both are readable — they are readable at different levels.

**Verdict for readability:** Depends on the audience. MCP wins for stakeholder communication. CLI wins for engineering use.

---

### Debugging Experience

**MCP:** When a step fails you get a message like "Could not complete action: fill loan amount." You do not know which element was targeted, what the DOM looked like, or why it failed. You can enable Playwright tracing, but the trace shows browser actions after the AI has already decided what to do. Reproducing a failure reliably is hard because the AI may make a different decision on the next run.

**CLI:** Playwright traces show every action: what was clicked, what was typed, what the DOM snapshot looked like, what the network requests were. Test steps map directly to lines of code. You can add a `page.pause()` anywhere to inspect state interactively. Failures are deterministic — the same input produces the same failure every time.

**Verdict for debugging:** CLI wins significantly. This is probably the biggest practical gap.

---

### Maintainability

**MCP:** If the portal redesigns the loan form — say, splitting "full name" into first and last name fields — the natural language prompt might still work. The AI adapts. If the UI terminology changes (e.g., "Submit" becomes "Send Application"), the prompt is still correct. This adaptability is real.

**CLI:** A selector change in the UI requires a selector update in the page object. This is work. It is also contained work — you update one file, run the tests, fix what broke. Refactoring page objects is well-understood.

**Verdict for maintainability:** MCP has an edge for teams with rapidly changing or poorly structured UIs. CLI is more maintainable for stable, well-designed applications because the maintenance work is predictable.

---

### CI/CD Friendliness

**MCP:** To run MCP tests in CI you need Claude API credentials (or another LLM API), network access to the AI provider, and acceptance that test execution time is longer (each step involves an LLM call). The cost scales with test count. A 50-test suite costs meaningfully more per run than a 5-test suite. The CI job is also slower — potentially 5–10x slower than equivalent CLI tests.

**CLI:** Playwright tests run in a Docker container with no external dependencies. They are fast (a 50-test suite runs in under 2 minutes with 4 workers). They cost essentially nothing to run. The CI setup is `npx playwright test` — no API keys, no network calls to external services.

**Verdict for CI/CD:** CLI wins decisively. This is not a close comparison.

---

### Reliability and Repeatability

**MCP:** The same prompt may produce different behaviour on different runs. An AI agent interprets the UI — if the page renders slightly differently due to a timing issue, the agent may respond differently. This introduces a category of flakiness that does not exist in CLI tests: not "the selector timed out" but "the AI decided to click the wrong thing."

**CLI:** Playwright has built-in auto-waiting, configurable retry logic, and deterministic selector resolution. Flakiness is well-understood and addressable (explicit waits, retries, `waitForLoadState`). The test either passes or fails for a reason you can identify.

**Verdict for reliability:** CLI wins clearly.

---

### Team Adoption

**MCP:** A BA, a product manager, or a junior tester with no TypeScript experience can write an MCP test scenario. The barrier to authoring is low. The barrier to maintaining and debugging, however, is high — it requires understanding how the AI agent works, which is a different but still real skill.

**CLI:** Requires TypeScript, Playwright API knowledge, and understanding of page object patterns. This is standard skills for any SDET but is a real barrier for non-engineers. On the other hand, every senior QA/dev on the team can contribute, review, and debug tests without needing to understand AI agent behaviour.

**Verdict for adoption:** MCP wins for broadening who can write tests. CLI wins for deepening how well tests can be owned.

---

### Where Each Approach Breaks Down

**MCP breaks down when:**
- The UI has many similar elements (two "Submit" buttons, ambiguous labels) and the AI cannot disambiguate
- You need to assert precise structured data (e.g., "the reference number matches this exact regex")
- The test needs to interact with multiple systems (UI + API + database) in sequence
- The AI is not updated to know about your application's domain-specific terminology
- Test infrastructure costs are a concern (API calls per step add up)
- You need a test audit trail for compliance or regulatory reasons

**CLI breaks down when:**
- The UI is changing faster than you can update selectors
- No one on the team has the bandwidth to write proper page objects
- You need fast coverage of a large, varied UI surface with limited automation resource
- The application is in early development and the UI is not stable enough to write deterministic tests against

---

## Best Use Cases

**Use MCP when:**
- You want to quickly validate that a new feature is navigable before writing proper tests
- You are generating test coverage for a UI that changes frequently and selector maintenance is unsustainable
- Non-technical team members need to write or review test scenarios
- You are doing exploratory/accessibility testing where human-like navigation matters
- You are generating a first draft of tests that a developer will then refactor into CLI code

**Use CLI when:**
- Tests run in CI and their result must be trusted completely
- You are testing business-critical flows where a flaky result is unacceptable
- The test involves structured data assertions, API verification, or schema validation
- Your team has TypeScript skills and cares about maintainability
- You need fast, parallel, cheap test execution at scale
- You need clear debugging output when something goes wrong in production

---

## Recommendation Summary

For most teams building a production test suite, the default should be **CLI**. It is faster, cheaper, more reliable, and easier to debug. The investment in page objects and fixtures pays off within weeks on any reasonably stable application.

**MCP is worth adding as a layer on top**, not as a replacement. Use it for:
- Initial test scaffolding (let the AI generate a first draft, then review and refactor)
- Exploratory coverage on new features
- Scenarios where selector maintenance would cost more than the AI API calls

The most honest framing is this: MCP is a productivity tool for test *authoring*. CLI is the foundation for test *execution*. Teams that understand this distinction will get value from both without getting burned by either.

---

## Side-by-Side: Same Scenario, Two Approaches

### Scenario: Submit a valid personal loan application

**MCP:**
```typescript
test('personal loan application — MCP', async ({ mcpAgent }) => {
  await mcpAgent.act('Go to http://localhost:3001 and log in as alex.martinez@example.com');
  await mcpAgent.act('Start a new personal loan application for $15,000 over 36 months');
  await mcpAgent.act('Fill in the applicant details with date of birth 1985-06-15 and annual income of $95,000');
  await mcpAgent.act('Select monthly repayment and set the purpose to debt consolidation');
  await mcpAgent.act('Submit the application');
  await mcpAgent.verify('The page shows a confirmation with a reference number starting with LN-');
});
```

Lines of test code: **7**
Requires: Claude API key, `@playwright/mcp` or equivalent, configured MCP server
Execution time: ~30–60 seconds per test (LLM roundtrips)
Determinism: Not guaranteed

---

**CLI:**
```typescript
test('personal loan application — CLI @smoke @regression', async ({
  page, loanApi, testUser
}) => {
  const portal = new LoanPortalPage(page);

  await portal.goto();
  await portal.login(testUser.email, testUser.password);
  await portal.fillLoanApplication(loanScenarios.personalLoan);
  await portal.submitApplication();

  const refNumber = await portal.getConfirmationReferenceNumber();
  expect(refNumber).toMatch(/^LN-\d{8}-[A-Z0-9]{4}$/);

  // Verify via API — confirms UI and backend are in sync
  const { body } = await loanApi.listApplications({ status: 'DRAFT' });
  const created = body.data.find(a => a.referenceNumber === refNumber);
  expect(created).toBeDefined();
  expect(created!.product).toBe('PERSONAL_LOAN');
  expect(created!.requestedAmount).toBe(15_000);
});
```

Lines of test code: **18**
Requires: Playwright, TypeScript, `npm install`
Execution time: ~3–5 seconds per test
Determinism: Guaranteed

---

The CLI test is longer. It is also verifying more — the API assertion at the end is something an MCP test struggles to do cleanly. That extra depth is not complexity for its own sake; it is coverage that catches backend bugs the UI test alone would miss.
