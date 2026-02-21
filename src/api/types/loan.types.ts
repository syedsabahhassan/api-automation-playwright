export type LoanProduct = 'HOME_LOAN' | 'PERSONAL_LOAN' | 'AUTO_LOAN' | 'BUSINESS_LOAN';
export type LoanStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'DECLINED' | 'DISBURSED' | 'CLOSED';
export type RepaymentFrequency = 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY';

export interface Applicant {
  firstName: string;
  lastName: string;
  dateOfBirth: string;          // ISO 8601 YYYY-MM-DD
  email: string;
  phone: string;
  annualIncome: number;
  employmentStatus: 'EMPLOYED_FULL_TIME' | 'EMPLOYED_PART_TIME' | 'SELF_EMPLOYED' | 'UNEMPLOYED';
}

export interface CreateLoanApplicationRequest {
  product: LoanProduct;
  requestedAmount: number;
  termMonths: number;
  repaymentFrequency: RepaymentFrequency;
  purpose: string;
  applicant: Applicant;
}

export interface LoanApplicationResponse {
  applicationId: string;
  referenceNumber: string;
  product: LoanProduct;
  status: LoanStatus;
  requestedAmount: number;
  termMonths: number;
  repaymentFrequency: RepaymentFrequency;
  applicant: Applicant;
  createdAt: string;
  updatedAt: string;
  _links: {
    self: { href: string };
    decision?: { href: string };
  };
}

export interface LoanDecision {
  applicationId: string;
  status: 'APPROVED' | 'DECLINED' | 'REFERRED';
  approvedAmount?: number;
  interestRate?: number;
  comparisonRate?: number;
  monthlyRepayment?: number;
  decisionReason?: string;
  decidedAt: string;
}

export interface PaginatedLoansResponse {
  data: LoanApplicationResponse[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  _links: {
    self: { href: string };
    next?: { href: string };
    prev?: { href: string };
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
  traceId: string;
  timestamp: string;
}
