/**
 * Domain types for the Loan Applications API.
 */

export interface Applicant {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone?: string;
  annualIncome: number;
  employmentStatus: string;
}

export interface CreateLoanApplicationRequest {
  product: string;
  requestedAmount: number;
  termMonths: number;
  repaymentFrequency: string;
  purpose?: string;
  applicant: Applicant;
}

export interface LoanApplicationLink {
  href: string;
}

export interface LoanApplicationResponse {
  applicationId: string;
  referenceNumber: string;
  product: string;
  status: string;
  requestedAmount: number;
  termMonths: number;
  repaymentFrequency: string;
  purpose?: string;
  applicant: Applicant;
  createdAt: string;
  updatedAt: string;
  _links: {
    self: LoanApplicationLink;
    decision?: LoanApplicationLink;
  };
}

export interface LoanDecision {
  applicationId: string;
  status: string;
  approvedAmount: number;
  interestRate: number;
  comparisonRate: number;
  monthlyRepayment: number;
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
    self: LoanApplicationLink;
    next?: LoanApplicationLink;
    prev?: LoanApplicationLink;
  };
}
