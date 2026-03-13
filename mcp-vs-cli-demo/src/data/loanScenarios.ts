import { LoanApplicationFormData } from '../page-objects/LoanPortalPage';

/**
 * Typed test data for the loan portal demo.
 *
 * These are the same three scenarios used in both the CLI and MCP test files,
 * making the comparison honest — both sides test identical business cases.
 *
 * Extends the test data patterns from the companion API repo (testData.ts),
 * adding the UI-specific fields the portal form requires.
 */

// ── Portal test credentials ─────────────────────────────────────────────────

export const TEST_USER = {
  email:    process.env.TEST_USER_EMAIL    || 'alex.martinez@example.com',
  password: process.env.TEST_USER_PASSWORD || 'TestPass123!',
};

// ── Happy path: Personal loan ────────────────────────────────────────────────
//
// Standard, valid application that should reach the confirmation screen
// and return an LN- reference number.

export const personalLoan: LoanApplicationFormData = {
  product:            'PERSONAL_LOAN',
  requestedAmount:    15_000,
  termMonths:         36,
  repaymentFrequency: 'FORTNIGHTLY',
  purpose:            'Debt consolidation',
  applicant: {
    firstName:        'Alex',
    lastName:         'Martinez',
    dateOfBirth:      '1985-06-15',
    email:            'alex.martinez+test@example.com',
    annualIncome:     95_000,
    employmentStatus: 'EMPLOYED_FULL_TIME',
  },
};

// ── Happy path: Home loan ────────────────────────────────────────────────────
//
// Larger amount, longer term. Tests that the portal handles different
// product types and the API enforces HOME_LOAN limits correctly.

export const homeLoan: LoanApplicationFormData = {
  product:            'HOME_LOAN',
  requestedAmount:    550_000,
  termMonths:         360,
  repaymentFrequency: 'MONTHLY',
  purpose:            'Purchase of primary residence',
  applicant: {
    firstName:        'Jordan',
    lastName:         'Chen',
    dateOfBirth:      '1980-03-22',
    email:            'jordan.chen+test@example.com',
    annualIncome:     250_000,
    employmentStatus: 'EMPLOYED_FULL_TIME',
  },
};

// ── Validation: Incomplete form ───────────────────────────────────────────────
//
// Used to verify that the portal shows validation errors when required
// fields are missing — without reaching the API at all.

export const incompleteApplication: Partial<LoanApplicationFormData> = {
  // Deliberately missing: product, requestedAmount, termMonths, repaymentFrequency
  // The applicant section is also incomplete
  purpose: 'Testing validation',
};

// ── Edge case: Amount at affordability boundary ───────────────────────────────
//
// Annual income $28,000. Max affordable at 9x is $252,000.
// Requesting $260,000 should trigger AFFORDABILITY_CHECK_FAILED from the API.

export const unaffordableLoan: LoanApplicationFormData = {
  product:            'HOME_LOAN',
  requestedAmount:    260_000,
  termMonths:         300,
  repaymentFrequency: 'MONTHLY',
  purpose:            'Property purchase',
  applicant: {
    firstName:        'Sam',
    lastName:         'Taylor',
    dateOfBirth:      '1990-09-10',
    email:            'sam.taylor+test@example.com',
    annualIncome:     28_000,
    employmentStatus: 'EMPLOYED_PART_TIME',
  },
};

// ── Edge case: Below minimum amount ──────────────────────────────────────────
//
// $500 is below the $1,000 minimum. The portal should catch this client-side
// via HTML min attribute and field validation before the API is called.

export const belowMinimumLoan: LoanApplicationFormData = {
  product:            'PERSONAL_LOAN',
  requestedAmount:    500,          // below minimum of $1,000
  termMonths:         12,
  repaymentFrequency: 'MONTHLY',
  applicant: {
    firstName:        'Sam',
    lastName:         'Taylor',
    dateOfBirth:      '1990-09-10',
    email:            'sam.taylor+test@example.com',
    annualIncome:     60_000,
    employmentStatus: 'EMPLOYED_FULL_TIME',
  },
};

// ── Boundary values ───────────────────────────────────────────────────────────

export const LOAN_LIMITS = {
  MIN_AMOUNT:             1_000,
  MAX_PERSONAL_LOAN:     50_000,
  MAX_HOME_LOAN:      3_000_000,
  MAX_AUTO_LOAN:        150_000,
  MAX_BUSINESS_LOAN:    500_000,
  JUST_BELOW_MIN:           999,
  JUST_ABOVE_MIN:         1_001,
  JUST_AT_PERSONAL_MAX:  50_000,
  JUST_ABOVE_PERSONAL_MAX: 50_001,
};
