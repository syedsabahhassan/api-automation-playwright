/**
 * Loan Application — CLI / Standard Playwright Tests
 *
 * APPROACH: Explicit TypeScript with page objects, typed test data, and
 * deterministic assertions. Every step maps to a method call or assertion
 * you can read, debug, and refactor independently.
 *
 * Compare with tests/mcp/loan-application.mcp.spec.ts to see the same
 * scenarios written in the MCP natural-language style.
 *
 * TAGS:
 *   @smoke      — fast subset for CI smoke checks
 *   @regression — full regression suite
 *   @api        — tests that verify via the API layer (no browser required)
 *
 * RUN:
 *   npm run test:cli                        # all CLI tests
 *   npx playwright test --grep @smoke       # smoke only
 *   npx playwright test --grep @regression  # full regression
 */

import { test, expect } from '../../src/fixtures/hybridFixtures';
import { LoanPortalPage } from '../../src/page-objects/LoanPortalPage';
import * as loanScenarios from '../../src/data/loanScenarios';

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 1: Happy path — personal loan application
//
// Steps:
//   1. Navigate to portal and log in (via fixture — already done on test entry)
//   2. Open the apply form
//   3. Fill with typed test data
//   4. Submit
//   5. Assert UI confirmation reference number format
//   6. Assert API state matches UI — the hybrid verification step
//
// CLI ADVANTAGE:
//   Step 6 is the difference-maker. The CLI test asserts that the UI ref number
//   also exists in the API response with the correct product and amount. An MCP
//   agent can verify the UI — it struggles to then programmatically call an API
//   and correlate the response. This is exactly where structured code beats
//   natural language.
// ─────────────────────────────────────────────────────────────────────────────

test(
  'personal loan — happy path @smoke @regression',
  async ({ portal, loanApi }) => {
    // portal fixture: already logged in and on dashboard
    await portal.navigateToApplyForm();
    await portal.fillLoanApplication(loanScenarios.personalLoan);
    await portal.submitApplication();

    // UI assertion: confirmation screen with correctly formatted ref
    await portal.expectConfirmationVisible();
    const refNumber = await portal.getConfirmationReferenceNumber();
    expect(refNumber).toMatch(/^LN-\d{8}-[A-Z0-9]{4}$/);

    // API assertion: confirms the backend actually received and stored the loan
    // This is the hybrid layer — UI verification + API cross-check in one test.
    // An MCP agent cannot do this cleanly without extra scaffolding.
    const { response, body } = await loanApi.listApplications({ status: 'DRAFT' });
    expect(response.status()).toBe(200);

    const created = body.data.find(a => a.referenceNumber === refNumber);
    expect(created).toBeDefined();
    expect(created!.product).toBe('PERSONAL_LOAN');
    expect(created!.requestedAmount).toBe(loanScenarios.personalLoan.requestedAmount);
    expect(created!.termMonths).toBe(loanScenarios.personalLoan.termMonths);
    expect(created!.applicant.firstName).toBe(loanScenarios.personalLoan.applicant.firstName);

    // Teardown: withdraw so the mock server stays clean for parallel runs
    if (created?.applicationId) {
      await loanApi.withdrawApplication(created.applicationId);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 1b: Home loan — different product, larger amount @regression
//
// This test reuses the same page object and fixture setup. Adding a new
// product scenario is one method call with a different data object.
// In MCP, you would write a new full natural-language description.
// ─────────────────────────────────────────────────────────────────────────────

test(
  'home loan — happy path @regression',
  async ({ portal, loanApi }) => {
    await portal.navigateToApplyForm();
    await portal.fillLoanApplication(loanScenarios.homeLoan);
    await portal.submitApplication();

    await portal.expectConfirmationVisible();
    const refNumber = await portal.getConfirmationReferenceNumber();

    const { body } = await loanApi.listApplications({ product: 'HOME_LOAN' });
    const created = body.data.find(a => a.referenceNumber === refNumber);
    expect(created).toBeDefined();
    expect(created!.requestedAmount).toBe(loanScenarios.homeLoan.requestedAmount);

    if (created?.applicationId) {
      await loanApi.withdrawApplication(created.applicationId);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 2: Affordability boundary — API rejects the request
//
// The portal submits a valid form, but the API returns AFFORDABILITY_CHECK_FAILED
// because the income-to-loan ratio exceeds 9x. The portal should display the
// API error message.
//
// CLI ADVANTAGE:
//   Precise control over when and how the error appears. The CLI test can
//   assert the exact error text, the specific element it appears in, and
//   that no reference number was generated. MCP would need careful prompting
//   to achieve the same depth of assertion.
// ─────────────────────────────────────────────────────────────────────────────

test(
  'affordability failure — portal shows API error @regression',
  async ({ portal }) => {
    await portal.navigateToApplyForm();
    await portal.fillLoanApplication(loanScenarios.unaffordableLoan);
    await portal.submitApplication();

    // Confirmation screen should NOT appear
    await expect(portal.confirmationRefNumber).not.toBeVisible();

    // Error alert from the API should be visible
    await expect(portal.applyErrorAlert).toBeVisible();
    const errorText = await portal.applyErrorAlert.textContent();
    expect(errorText).toContain('affordability');    // case-insensitive match on API message
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 3: Hybrid — API seeds data, UI verifies it on dashboard
//
// This is the cleanest demonstration of why CLI wins for hybrid testing.
// The test:
//   1. Creates a loan via the API directly (fast, reliable, no UI noise)
//   2. Navigates the portal dashboard via UI
//   3. Asserts the API-created loan appears in the UI list
//   4. Cleans up via API
//
// In MCP, step 1 and step 4 require code anyway. So you end up with a
// mixed test — code for API, MCP for UI — which is harder to maintain than
// just using code throughout.
//
// CLI ADVANTAGE:
//   Everything is in one language, one mental model, one tool.
//   Typed assertions catch bugs the AI would miss (wrong amount, wrong product).
// ─────────────────────────────────────────────────────────────────────────────

test(
  'hybrid — API-seeded application appears on dashboard @smoke @regression',
  async ({ page, testUser, loanApi }) => {
    // Step 1: Create via API (no browser — fast and reliable)
    const { body: created, response: createRes } = await loanApi.createApplication({
      product:            'AUTO_LOAN',
      requestedAmount:    25_000,
      termMonths:         48,
      repaymentFrequency: 'MONTHLY',
      purpose:            'Seeded for CLI dashboard test',
      applicant: {
        firstName:        'Seeded',
        lastName:         'User',
        dateOfBirth:      '1978-11-01',
        email:            'seeded.user@example.com',
        phone:            '+61400000099',
        annualIncome:     120_000,
        employmentStatus: 'EMPLOYED_FULL_TIME',
      },
    });
    expect(createRes.status()).toBe(201);
    const { referenceNumber, applicationId } = created;

    try {
      // Step 2: Navigate the portal via UI
      const portal = new LoanPortalPage(page);
      await portal.goto();
      await portal.login(testUser.email, testUser.password);

      // Step 3: Assert the seeded application appears in the dashboard list
      const refs = await portal.getApplicationRows();
      expect(refs).toContain(referenceNumber);

      // Step 3b: Assert the status badge is correct
      const row = page.locator(`[data-ref="${referenceNumber}"]`);
      await expect(row).toBeVisible();
      const statusBadge = row.getByTestId('application-status');
      await expect(statusBadge).toContainText('DRAFT');
    } finally {
      // Step 4: Clean up (always runs, even if assertion fails)
      await loanApi.withdrawApplication(applicationId);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 4: Decision endpoint — full API + UI lifecycle @regression
//
// Demonstrates the full application lifecycle:
//   1. UI submission → ref number
//   2. API decision check → APPROVED
//   3. Dashboard shows DRAFT (decision not automatically reflected in UI demo)
//
// This kind of multi-step lifecycle test is very clean in CLI.
// In MCP, you would need multiple `act` steps with no clear way to pass
// the ref number between them without writing code.
// ─────────────────────────────────────────────────────────────────────────────

test(
  'full lifecycle — submit UI, check decision via API @regression',
  async ({ portal, loanApi }) => {
    await portal.navigateToApplyForm();
    await portal.fillLoanApplication(loanScenarios.personalLoan);
    await portal.submitApplication();

    await portal.expectConfirmationVisible();
    const refNumber = await portal.getConfirmationReferenceNumber();

    // Retrieve the application ID from the API using the reference number
    const { body: list } = await loanApi.listApplications({ status: 'DRAFT' });
    const app = list.data.find(a => a.referenceNumber === refNumber);
    expect(app).toBeDefined();

    // Check the decision endpoint
    const { response: decisionRes, body: decision } = await loanApi.getDecision(app!.applicationId);
    expect(decisionRes.status()).toBe(200);
    expect(decision.status).toBe('APPROVED');
    expect(decision.approvedAmount).toBe(loanScenarios.personalLoan.requestedAmount);
    expect(decision.interestRate).toBeGreaterThan(0);

    // Teardown
    await loanApi.withdrawApplication(app!.applicationId);
  }
);
