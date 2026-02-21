import { CreateLoanApplicationRequest, Applicant } from '../api/types/loan.types';

/**
 * Canonical test applicant — used across suites to avoid duplication.
 * Dates and amounts are chosen to pass standard affordability thresholds
 * in the demo environment.
 */
export const DEFAULT_APPLICANT: Applicant = {
  firstName: 'Alex',
  lastName: 'Martinez',
  dateOfBirth: '1985-06-15',
  email: 'alex.martinez+test@example.com',
  phone: '+61400000001',
  annualIncome: 95_000,
  employmentStatus: 'EMPLOYED_FULL_TIME',
};

export const HIGH_INCOME_APPLICANT: Applicant = {
  ...DEFAULT_APPLICANT,
  firstName: 'Jordan',
  lastName: 'Chen',
  email: 'jordan.chen+test@example.com',
  annualIncome: 250_000,
};

export const LOW_INCOME_APPLICANT: Applicant = {
  ...DEFAULT_APPLICANT,
  firstName: 'Sam',
  lastName: 'Taylor',
  email: 'sam.taylor+test@example.com',
  annualIncome: 28_000,
  employmentStatus: 'EMPLOYED_PART_TIME',
};

export const buildHomeLoanRequest = (
  overrides: Partial<CreateLoanApplicationRequest> = {},
): CreateLoanApplicationRequest => ({
  product: 'HOME_LOAN',
  requestedAmount: 500_000,
  termMonths: 360,
  repaymentFrequency: 'MONTHLY',
  purpose: 'Purchase of primary residence',
  applicant: DEFAULT_APPLICANT,
  ...overrides,
});

export const buildPersonalLoanRequest = (
  overrides: Partial<CreateLoanApplicationRequest> = {},
): CreateLoanApplicationRequest => ({
  product: 'PERSONAL_LOAN',
  requestedAmount: 15_000,
  termMonths: 36,
  repaymentFrequency: 'FORTNIGHTLY',
  purpose: 'Debt consolidation',
  applicant: DEFAULT_APPLICANT,
  ...overrides,
});

export const BOUNDARY_AMOUNTS = {
  MIN_LOAN: 1_000,
  MAX_PERSONAL_LOAN: 50_000,
  MAX_HOME_LOAN: 3_000_000,
  BELOW_MIN: 999,
  ABOVE_MAX_PERSONAL: 50_001,
};
