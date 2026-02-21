import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient } from './baseApiClient';
import { AuthApiClient } from './authApiClient';
import {
  CreateLoanApplicationRequest,
  LoanApplicationResponse,
  LoanDecision,
  PaginatedLoansResponse,
} from '../types/loan.types';

/**
 * Client for the Loan Applications API.
 * Automatically attaches OAuth Bearer token to every request.
 */
export class LoanApiClient extends BaseApiClient {
  private readonly baseUrl: string;

  constructor(
    request: APIRequestContext,
    private readonly auth: AuthApiClient,
    baseUrl: string,
  ) {
    super(request);
    this.baseUrl = `${baseUrl}/v1/loans`;
  }

  /** POST /v1/loans — submit a new loan application */
  async createApplication(
    payload: CreateLoanApplicationRequest,
  ): Promise<{ response: APIResponse; body: LoanApplicationResponse }> {
    const token = await this.auth.getAccessToken();
    return this.post<LoanApplicationResponse>(this.baseUrl, payload, token);
  }

  /** GET /v1/loans/:id — retrieve a single application */
  async getApplication(
    applicationId: string,
  ): Promise<{ response: APIResponse; body: LoanApplicationResponse }> {
    const token = await this.auth.getAccessToken();
    return this.get<LoanApplicationResponse>(`${this.baseUrl}/${applicationId}`, token);
  }

  /** GET /v1/loans — list applications with optional filters */
  async listApplications(params?: {
    status?: string;
    product?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ response: APIResponse; body: PaginatedLoansResponse }> {
    const token = await this.auth.getAccessToken();
    return this.get<PaginatedLoansResponse>(this.baseUrl, token, {
      params: params as Record<string, string | number | boolean>,
    });
  }

  /** PATCH /v1/loans/:id — update an application (e.g. change term or amount) */
  async updateApplication(
    applicationId: string,
    payload: Partial<Pick<CreateLoanApplicationRequest, 'requestedAmount' | 'termMonths' | 'repaymentFrequency'>>,
  ): Promise<{ response: APIResponse; body: LoanApplicationResponse }> {
    const token = await this.auth.getAccessToken();
    return this.patch<LoanApplicationResponse>(`${this.baseUrl}/${applicationId}`, payload, token);
  }

  /** GET /v1/loans/:id/decision — retrieve underwriting decision */
  async getDecision(
    applicationId: string,
  ): Promise<{ response: APIResponse; body: LoanDecision }> {
    const token = await this.auth.getAccessToken();
    return this.get<LoanDecision>(`${this.baseUrl}/${applicationId}/decision`, token);
  }

  /** DELETE /v1/loans/:id — withdraw a draft application */
  async withdrawApplication(applicationId: string): Promise<APIResponse> {
    const token = await this.auth.getAccessToken();
    return this.delete(`${this.baseUrl}/${applicationId}`, token);
  }
}
