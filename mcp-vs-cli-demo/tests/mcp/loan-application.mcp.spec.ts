/**
 * Loan Application — MCP-style Tests
 *
 * APPROACH: Each test is written as a series of natural-language instructions
 * that describe *what* to do, not *how* to do it. In a real MCP setup, these
 * instructions are forwarded to an LLM (e.g. Claude) which calls Playwright
 * tools to execute them.
 *
 * In demo mode (default, no API key required), simulation code executes the
 * same underlying actions while the natural-language narration is logged.
 * See tests/mcp/ABOUT_MCP_TESTS.md for full details.
 *
 * Compare these tests with tests/cli/loan-application.cli.spec.ts to see
 * the same scenarios implemented in the CLI approach.
 *
 * KEY OBSERVATION: The MCP tests are shorter and describe intent. The CLI
 * tests are longer and describe implementation. Each has its place.
 */

import { expect } from '@playwright/test';
import { mcpTest, McpAgent } from '../../src/fixtures/hybridFixtures';
import { LoanPortalPage } from '../../src/page-objects/LoanPortalPage';
import * as loanScenarios from '../../src/data/loanScenarios';

// ── Helper: simulation layer ──────────────────────────────────────────────────
//
// In real MCP mode, these steps are handled by the LLM.
// In demo mode, we execute them directly so the tests actually run and pass.
//
// The simulation uses the same page objects the CLI tests use — which is itself
// a useful insight: under the hood, MCP and CLI end up doing the same thing.
// The difference is in WHO decides which element to target: you or the AI.

async function simulateLogin(agent: McpAgent, email: string): Promise<void> {
  const page = agent.rawPage;
  await page.goto('/');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill('TestPass123!');
  await page.getByTestId('login-submit').click();
  await page.getByTestId('new-application-btn').waitFor({ state: 'visible' });
}

async function simulateFillPersonalLoan(agent: McpAgent): Promise<void> {
  const page = agent.rawPage;
  await page.getByTestId('new-application-btn').click();
  await page.getByTestId('loan-product').selectOption('PERSONAL_LOAN');
  await page.getByTestId('requested-amount').fill('15000');
  await page.getByTestId('term-months').fill('36');
  await page.getByTestId('repayment-frequency').selectOption('FORTNIGHTLY');
  await page.getByTestId('loan-purpose').fill('Debt consolidation');
  await page.getByTestId('applicant-first-name').fill('Alex');
  await page.getByTestId('applicant-last-name').fill('Martinez');
  await page.getByTestId('applicant-dob').fill('1985-06-15');
  await page.getByTestId('applicant-email').fill('alex.martinez+test@example.com');
  await page.getByTestId('applicant-annual-income').fill('95000');
  await page.getByTestId('applicant-employment-status').selectOption('EMPLOYED_FULL_TIME');
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 1: Happy path — personal loan application
//
// COMPARISON NOTE:
//   MCP tests describe the scenario in 5 high-level instructions.
//   The CLI version of this test (loan-application.cli.spec.ts) uses typed
//   method calls with explicit data objects. Both test the same flow.
//
//   MCP advantage here: anyone can read these steps without knowing Playwright.
//   MCP disadvantage: the reference number assertion is imprecise — the AI
//   cannot easily validate a specific regex pattern without extra prompting.
// ─────────────────────────────────────────────────────────────────────────────

mcpTest('personal loan — happy path (MCP style)', async ({ mcpAgent }) => {
  // ── Step narration (what you would send to the AI agent) ──────────────────
  await mcpAgent.act(
    `Navigate to the loan portal at ${process.env.PORTAL_URL || 'http://localhost:3001'}`
  );
  await mcpAgent.act(
    `Log in with email "${loanScenarios.TEST_USER.email}" and password`
  );
  await mcpAgent.act(
    'Click the "New application" button to start a fresh loan application'
  );
  await mcpAgent.act(
    'Fill in a personal loan for $15,000 over 36 months with fortnightly repayments. ' +
    'Applicant: Alex Martinez, born 1985-06-15, $95,000 annual income, full-time employed. ' +
    'Purpose: debt consolidation.'
  );
  await mcpAgent.act('Submit the application');
  await mcpAgent.verify(
    'The confirmation screen is visible and shows a reference number in the format LN-XXXXXXXX-XXXX'
  );

  // ── Simulation (demo mode) ─────────────────────────────────────────────────
  await simulateLogin(mcpAgent, loanScenarios.TEST_USER.email);
  await simulateFillPersonalLoan(mcpAgent);
  await mcpAgent.rawPage.getByTestId('submit-application').click();

  const refLocator = mcpAgent.rawPage.getByTestId('confirmation-ref-number');
  await refLocator.waitFor({ state: 'visible' });
  const ref = await refLocator.textContent();

  // ── What MCP would do: approximate text check ─────────────────────────────
  // An MCP agent would typically do: "verify the reference number is visible"
  // — it would not assert the exact regex unless explicitly prompted.
  // This is a real limitation of AI-driven assertions vs typed assertions.
  expect(ref).toBeTruthy();                             // What MCP does
  expect(ref).toMatch(/^LN-\d{8}-[A-Z0-9]{4}$/);      // What CLI does (shown for comparison)

  console.log('\n── MCP Step Narration ──────────────────────────────────────');
  console.log(mcpAgent.getStepNarration());
  console.log('────────────────────────────────────────────────────────────\n');
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 2: Validation — missing required fields
//
// COMPARISON NOTE:
//   MCP tests can describe validation scenarios naturally. But the assertion
//   "verify that error messages appear" is hard for an AI to make precise —
//   it can see that errors are shown but cannot easily enumerate which specific
//   errors appeared and map them to field names without extra prompting.
//
//   CLI tests can assert exact field-level validation with testid targeting.
// ─────────────────────────────────────────────────────────────────────────────

mcpTest('form validation — empty submission shows errors (MCP style)', async ({ mcpAgent }) => {
  await mcpAgent.act(
    `Navigate to the loan portal and log in as "${loanScenarios.TEST_USER.email}"`
  );
  await mcpAgent.act(
    'Click "New application" to open the application form'
  );
  await mcpAgent.act(
    'Click the "Submit application" button without filling in any fields'
  );
  await mcpAgent.verify(
    'The form shows validation error messages next to the required fields'
  );

  // ── Simulation ──────────────────────────────────────────────────────────────
  await simulateLogin(mcpAgent, loanScenarios.TEST_USER.email);
  await mcpAgent.rawPage.getByTestId('new-application-btn').click();
  await mcpAgent.rawPage.getByTestId('submit-application').click();

  // MCP-style assertion: visible errors exist somewhere on the page
  const visibleErrors = mcpAgent.rawPage.locator('.field-error.visible');
  const count = await visibleErrors.count();
  expect(count).toBeGreaterThan(0);

  // Note: CLI equivalent would check each specific error by testid:
  //   await portal.expectFieldError('loanProductError');
  //   await portal.expectFieldError('requestedAmountError');
  //   ... etc.
  // MCP assertion is weaker — it knows errors appeared, not which ones specifically.
  console.log(`[MCP verify] ${count} validation error(s) visible — as expected`);
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 3: Hybrid — API seed data, UI verification
//
// COMPARISON NOTE:
//   This is where MCP shows its biggest weakness. The test needs to:
//     1. Call the API directly to create a seeded application
//     2. Navigate the UI to verify it appears on the dashboard
//     3. Clean up via API after the test
//
//   An MCP agent can do step 2 reasonably well. Steps 1 and 3 require
//   structured API calls — something you have to do in code anyway.
//   The hybrid scenario is awkward in pure MCP. You end up writing code
//   for the API parts and using MCP only for the UI parts, which raises
//   the question: why not just write code for everything?
//
//   This scenario is the clearest argument for the CLI approach.
// ─────────────────────────────────────────────────────────────────────────────

mcpTest(
  'hybrid — API-seeded application appears on dashboard (MCP style)',
  async ({ mcpAgent }) => {
    // ── Setup via API (code, not MCP — this is the honest limitation) ──────────
    // There is no good way to do this step through MCP natural language.
    // You would need: "call POST /v1/loans with these fields and capture the ref number"
    // — but the MCP agent cannot reliably parse a JSON response and store a value
    // for use in a later step without explicit tool scaffolding.
    //
    // So we do it in code. This is exactly what you'd do in a CLI test anyway.
    const apiUrl   = process.env.API_BASE_URL || 'http://localhost:3000';
    const tokenRes = await mcpAgent.rawPage.request.post(`${apiUrl}/oauth/token`, {
      data: { clientId: 'test-client-id', clientSecret: 'test-client-secret', grantType: 'client_credentials' },
    });
    const { accessToken } = await tokenRes.json();

    const loanRes = await mcpAgent.rawPage.request.post(`${apiUrl}/v1/loans`, {
      headers: { Authorization: `Bearer ${accessToken}`, 'x-api-version': '1.0' },
      data: {
        product: 'AUTO_LOAN', requestedAmount: 25_000, termMonths: 48,
        repaymentFrequency: 'MONTHLY', purpose: 'Seeded for MCP dashboard test',
        applicant: {
          firstName: 'Seeded', lastName: 'User', dateOfBirth: '1978-11-01',
          email: 'seeded.user@example.com', annualIncome: 120_000,
          employmentStatus: 'EMPLOYED_FULL_TIME',
        },
      },
    });
    const { referenceNumber, applicationId } = await loanRes.json();

    // ── UI verification via MCP ───────────────────────────────────────────────
    await mcpAgent.act(
      `Log in to the portal as "${loanScenarios.TEST_USER.email}" and go to the dashboard`
    );
    await mcpAgent.verify(
      `The dashboard shows an application with reference number "${referenceNumber}"`
    );

    // ── Simulation ─────────────────────────────────────────────────────────────
    await simulateLogin(mcpAgent, loanScenarios.TEST_USER.email);
    await mcpAgent.rawPage.getByTestId('applications-list').waitFor({ state: 'visible' });

    const refCells = await mcpAgent.rawPage.getByTestId('application-ref').allTextContents();
    expect(refCells).toContain(referenceNumber);

    // ── Teardown via API ──────────────────────────────────────────────────────
    await mcpAgent.rawPage.request.delete(`${apiUrl}/v1/loans/${applicationId}`, {
      headers: { Authorization: `Bearer ${accessToken}`, 'x-api-version': '1.0' },
    });

    console.log(`[MCP hybrid] Seeded ref: ${referenceNumber} — found on dashboard — cleaned up`);

    // ── Post-test reflection ──────────────────────────────────────────────────
    // Notice that in this test, the MCP-style `act` and `verify` calls were
    // sandwiched between code for API setup and teardown. The "MCP part" was
    // only 2 of 7 logical steps. For this kind of hybrid scenario, CLI wins
    // clearly: everything is consistent, everything is typed, everything is
    // visible in the same language.
  }
);
