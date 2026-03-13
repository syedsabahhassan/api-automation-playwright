/**
 * Form Validation — CLI Tests
 *
 * Tests client-side validation behaviour in the loan portal form.
 * All assertions happen in the browser — the API is never reached.
 *
 * These tests demonstrate one area where CLI has a clear structural advantage:
 * field-level validation checks require targeting specific DOM elements by their
 * test IDs and asserting visibility/content. An AI agent can check "errors appeared"
 * but struggles to enumerate which specific field errors appeared and confirm
 * that unrelated fields did NOT show errors.
 *
 * @smoke    — submit with no data: basic error rendering
 * @regression — boundary amounts, field-level error isolation
 */

import { test, expect } from '../../src/fixtures/hybridFixtures';
import * as loanScenarios from '../../src/data/loanScenarios';

// ─────────────────────────────────────────────────────────────────────────────
// Empty form submission @smoke
// ─────────────────────────────────────────────────────────────────────────────

test(
  'empty submission — all required field errors shown @smoke',
  async ({ portal }) => {
    await portal.navigateToApplyForm();
    await portal.submitApplication();

    // All required field errors should be visible
    const requiredErrors = [
      'loanProductError',
      'requestedAmountError',
      'termMonthsError',
      'repaymentFrequencyError',
      'firstNameError',
      'lastNameError',
      'dateOfBirthError',
      'emailError',
      'annualIncomeError',
      'employmentStatusError',
    ];

    for (const errorId of requiredErrors) {
      await portal.expectFieldError(errorId);
    }

    // Confirmation should not be shown
    await expect(portal.confirmationRefNumber).not.toBeVisible();
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Below minimum amount @regression
// ─────────────────────────────────────────────────────────────────────────────

test(
  'requested amount below minimum — field error shown @regression',
  async ({ portal }) => {
    await portal.navigateToApplyForm();
    await portal.fillLoanApplication(loanScenarios.belowMinimumLoan);
    await portal.submitApplication();

    // Amount-specific error should appear
    await portal.expectFieldError('requestedAmountError');

    // Other required fields were filled — their errors should NOT appear
    await expect(portal.page.locator('#loanProductError')).not.toHaveClass(/visible/);
    await expect(portal.page.locator('#firstNameError')).not.toHaveClass(/visible/);
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Invalid email format @regression
// ─────────────────────────────────────────────────────────────────────────────

test(
  'invalid applicant email — field error shown @regression',
  async ({ portal }) => {
    await portal.navigateToApplyForm();

    // Fill a valid form but with a bad email
    const invalidData = {
      ...loanScenarios.personalLoan,
      applicant: {
        ...loanScenarios.personalLoan.applicant,
        email: 'not-an-email',
      },
    };

    await portal.fillLoanApplication(invalidData);
    await portal.submitApplication();

    await portal.expectFieldError('emailError');
    await expect(portal.confirmationRefNumber).not.toBeVisible();
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Valid form clears errors on re-submit @regression
//
// COMPARISON NOTE:
// This test checks that error state is cleared when the user corrects their
// input and resubmits. It requires knowing which errors appeared before and
// which should disappear after. CLI handles this cleanly with targeted locators.
// An MCP agent would struggle: "verify that the error that appeared before
// is now gone" is vague and error-prone without explicit element references.
// ─────────────────────────────────────────────────────────────────────────────

test(
  'correcting invalid input clears field errors @regression',
  async ({ portal, loanApi }) => {
    await portal.navigateToApplyForm();

    // First: submit invalid form
    await portal.fillLoanApplication(loanScenarios.belowMinimumLoan);
    await portal.submitApplication();
    await portal.expectFieldError('requestedAmountError');

    // Correct the amount and resubmit
    await portal.requestedAmountInput.fill(String(loanScenarios.personalLoan.requestedAmount));
    await portal.submitApplication();

    // Error should now be gone — form submitted successfully
    await expect(portal.page.locator('#requestedAmountError')).not.toHaveClass(/visible/);
    await portal.expectConfirmationVisible();

    // Teardown
    const refNumber = await portal.getConfirmationReferenceNumber();
    const { body: list } = await loanApi.listApplications({ status: 'DRAFT' });
    const app = list.data.find(a => a.referenceNumber === refNumber);
    if (app?.applicationId) {
      await loanApi.withdrawApplication(app.applicationId);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Login validation @regression
// ─────────────────────────────────────────────────────────────────────────────

test(
  'login with empty fields shows validation errors @regression',
  async ({ page, testUser }) => {
    const { LoanPortalPage } = await import('../../src/page-objects/LoanPortalPage');
    const portalPage = new LoanPortalPage(page);
    await portalPage.goto();

    // Submit empty login form
    await portalPage.loginSubmitBtn.click();

    await portalPage.expectFieldError('loginEmailError');
    await portalPage.expectFieldError('loginPasswordError');
  }
);

test(
  'login with invalid email format shows validation error @regression',
  async ({ page }) => {
    const { LoanPortalPage } = await import('../../src/page-objects/LoanPortalPage');
    const portalPage = new LoanPortalPage(page);
    await portalPage.goto();

    await portalPage.loginEmailInput.fill('not-an-email');
    await portalPage.loginPasswordInput.fill('anypassword');
    await portalPage.loginSubmitBtn.click();

    await portalPage.expectFieldError('loginEmailError');
  }
);
