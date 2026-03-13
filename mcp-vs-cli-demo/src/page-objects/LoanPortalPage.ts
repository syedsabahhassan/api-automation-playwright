import { Page, Locator, expect } from '@playwright/test';

/**
 * LoanPortalPage — Page Object for the Loan Portal SPA
 *
 * Encapsulates all interactions with the portal UI.
 * Tests receive an instance via fixture and call typed methods —
 * no test file ever references a selector directly.
 *
 * Locator strategy: data-testid attributes are preferred so that
 * CSS or text changes in the UI do not break tests.
 */
export class LoanPortalPage {
  readonly page: Page;

  // ── Login form ──────────────────────────────────────────────────────────────
  readonly loginEmailInput:    Locator;
  readonly loginPasswordInput: Locator;
  readonly loginSubmitBtn:     Locator;
  readonly loginErrorAlert:    Locator;

  // ── Dashboard ───────────────────────────────────────────────────────────────
  readonly newApplicationBtn:  Locator;
  readonly applicationsList:   Locator;

  // ── Application form ─────────────────────────────────────────────────────────
  readonly loanProductSelect:        Locator;
  readonly requestedAmountInput:     Locator;
  readonly termMonthsInput:          Locator;
  readonly repaymentFrequencySelect: Locator;
  readonly loanPurposeInput:         Locator;
  readonly firstNameInput:           Locator;
  readonly lastNameInput:            Locator;
  readonly dateOfBirthInput:         Locator;
  readonly applicantEmailInput:      Locator;
  readonly annualIncomeInput:        Locator;
  readonly employmentStatusSelect:   Locator;
  readonly submitApplicationBtn:     Locator;
  readonly applyErrorAlert:          Locator;

  // ── Confirmation ─────────────────────────────────────────────────────────────
  readonly confirmationRefNumber:    Locator;
  readonly viewDashboardBtn:         Locator;

  constructor(page: Page) {
    this.page = page;

    // Login
    this.loginEmailInput    = page.getByTestId('login-email');
    this.loginPasswordInput = page.getByTestId('login-password');
    this.loginSubmitBtn     = page.getByTestId('login-submit');
    this.loginErrorAlert    = page.locator('#loginError');

    // Dashboard
    this.newApplicationBtn = page.getByTestId('new-application-btn');
    this.applicationsList  = page.getByTestId('applications-list');

    // Application form
    this.loanProductSelect        = page.getByTestId('loan-product');
    this.requestedAmountInput     = page.getByTestId('requested-amount');
    this.termMonthsInput          = page.getByTestId('term-months');
    this.repaymentFrequencySelect = page.getByTestId('repayment-frequency');
    this.loanPurposeInput         = page.getByTestId('loan-purpose');
    this.firstNameInput           = page.getByTestId('applicant-first-name');
    this.lastNameInput            = page.getByTestId('applicant-last-name');
    this.dateOfBirthInput         = page.getByTestId('applicant-dob');
    this.applicantEmailInput      = page.getByTestId('applicant-email');
    this.annualIncomeInput        = page.getByTestId('applicant-annual-income');
    this.employmentStatusSelect   = page.getByTestId('applicant-employment-status');
    this.submitApplicationBtn     = page.getByTestId('submit-application');
    this.applyErrorAlert          = page.locator('#applyError');

    // Confirmation
    this.confirmationRefNumber = page.getByTestId('confirmation-ref-number');
    this.viewDashboardBtn      = page.getByTestId('view-dashboard-btn');
  }

  // ── Navigation ───────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.loginEmailInput.waitFor({ state: 'visible' });
  }

  // ── Login actions ────────────────────────────────────────────────────────────

  async login(email: string, password: string): Promise<void> {
    await this.loginEmailInput.fill(email);
    await this.loginPasswordInput.fill(password);
    await this.loginSubmitBtn.click();
    // Wait for dashboard to appear, confirming successful login
    await this.newApplicationBtn.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async attemptLogin(email: string, password: string): Promise<void> {
    await this.loginEmailInput.fill(email);
    await this.loginPasswordInput.fill(password);
    await this.loginSubmitBtn.click();
  }

  // ── Form fill ────────────────────────────────────────────────────────────────

  /**
   * Fills the entire loan application form from a typed data object.
   * Call after navigating to the apply form (click newApplicationBtn first).
   */
  async fillLoanApplication(data: LoanApplicationFormData): Promise<void> {
    await this.loanProductSelect.selectOption(data.product);
    await this.requestedAmountInput.fill(String(data.requestedAmount));
    await this.termMonthsInput.fill(String(data.termMonths));
    await this.repaymentFrequencySelect.selectOption(data.repaymentFrequency);

    if (data.purpose) {
      await this.loanPurposeInput.fill(data.purpose);
    }

    await this.firstNameInput.fill(data.applicant.firstName);
    await this.lastNameInput.fill(data.applicant.lastName);
    await this.dateOfBirthInput.fill(data.applicant.dateOfBirth);
    await this.applicantEmailInput.fill(data.applicant.email);
    await this.annualIncomeInput.fill(String(data.applicant.annualIncome));
    await this.employmentStatusSelect.selectOption(data.applicant.employmentStatus);
  }

  async submitApplication(): Promise<void> {
    await this.submitApplicationBtn.click();
  }

  // ── Confirmation helpers ──────────────────────────────────────────────────────

  async getConfirmationReferenceNumber(): Promise<string> {
    await this.confirmationRefNumber.waitFor({ state: 'visible', timeout: 10_000 });
    const text = await this.confirmationRefNumber.textContent();
    return text?.trim() ?? '';
  }

  async expectConfirmationVisible(): Promise<void> {
    await expect(this.confirmationRefNumber).toBeVisible();
    const ref = await this.getConfirmationReferenceNumber();
    expect(ref).toMatch(/^LN-\d{8}-[A-Z0-9]{4}$/);
  }

  // ── Dashboard helpers ─────────────────────────────────────────────────────────

  async navigateToApplyForm(): Promise<void> {
    await this.newApplicationBtn.click();
    await this.loanProductSelect.waitFor({ state: 'visible' });
  }

  async getApplicationRows(): Promise<string[]> {
    await this.applicationsList.waitFor({ state: 'visible', timeout: 10_000 });
    const rows = this.applicationsList.getByTestId('application-ref');
    return rows.allTextContents();
  }

  // ── Assertion helpers ─────────────────────────────────────────────────────────

  async expectLoginErrorVisible(): Promise<void> {
    await expect(this.loginErrorAlert).toBeVisible();
  }

  async expectFieldError(fieldErrorId: string): Promise<void> {
    await expect(this.page.locator(`#${fieldErrorId}`)).toHaveClass(/visible/);
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LoanApplicationFormData {
  product: string;
  requestedAmount: number;
  termMonths: number;
  repaymentFrequency: string;
  purpose?: string;
  applicant: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    email: string;
    annualIncome: number;
    employmentStatus: string;
  };
}
