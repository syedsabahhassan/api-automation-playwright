import { APIRequestContext, APIResponse } from '@playwright/test';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
}

/**
 * Base API client wrapping Playwright's APIRequestContext.
 * Provides consistent logging, correlation ID injection, and error handling
 * across all service-level clients.
 */
export class BaseApiClient {
  constructor(protected readonly request: APIRequestContext) {}

  protected buildHeaders(authToken?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'x-correlation-id': uuidv4(),
      'x-api-version': '1.0',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
  }

  protected async get<T>(
    url: string,
    authToken?: string,
    options: RequestOptions = {},
  ): Promise<{ response: APIResponse; body: T }> {
    logger.info(`GET ${url}`);
    const response = await this.request.get(url, {
      headers: { ...this.buildHeaders(authToken), ...(options.headers ?? {}) },
      params: options.params,
      timeout: options.timeout,
    });
    const body = await this.parseBody<T>(response);
    return { response, body };
  }

  protected async post<T>(
    url: string,
    payload: unknown,
    authToken?: string,
    options: RequestOptions = {},
  ): Promise<{ response: APIResponse; body: T }> {
    logger.info(`POST ${url} — payload: ${JSON.stringify(payload)}`);
    const response = await this.request.post(url, {
      headers: { ...this.buildHeaders(authToken), ...(options.headers ?? {}) },
      data: payload,
      timeout: options.timeout,
    });
    const body = await this.parseBody<T>(response);
    return { response, body };
  }

  protected async patch<T>(
    url: string,
    payload: unknown,
    authToken?: string,
    options: RequestOptions = {},
  ): Promise<{ response: APIResponse; body: T }> {
    logger.info(`PATCH ${url}`);
    const response = await this.request.patch(url, {
      headers: { ...this.buildHeaders(authToken), ...(options.headers ?? {}) },
      data: payload,
      timeout: options.timeout,
    });
    const body = await this.parseBody<T>(response);
    return { response, body };
  }

  protected async delete(
    url: string,
    authToken?: string,
    options: RequestOptions = {},
  ): Promise<APIResponse> {
    logger.info(`DELETE ${url}`);
    return this.request.delete(url, {
      headers: { ...this.buildHeaders(authToken), ...(options.headers ?? {}) },
      timeout: options.timeout,
    });
  }

  private async parseBody<T>(response: APIResponse): Promise<T> {
    const contentType = response.headers()['content-type'] ?? '';
    if (contentType.includes('application/json')) {
      return response.json() as Promise<T>;
    }
    return response.text() as unknown as T;
  }
}
