import { APIRequestContext } from '@playwright/test';
import { BaseApiClient } from './baseApiClient';
import { TokenRequest, TokenResponse } from '../types/auth.types';
import { logger } from '../../utils/logger';

/**
 * Handles OAuth 2.0 client-credentials flow.
 * Caches the access token and proactively refreshes it before expiry.
 */
export class AuthApiClient extends BaseApiClient {
  private cachedToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(
    request: APIRequestContext,
    private readonly tokenUrl: string,
    private readonly clientId: string,
    private readonly clientSecret: string,
  ) {
    super(request);
  }

  async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.cachedToken && now < this.tokenExpiresAt - 30_000) {
      return this.cachedToken;
    }

    logger.info('Requesting new OAuth access token');
    const payload: TokenRequest = {
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      grantType: 'client_credentials',
      scope: 'loans:read loans:write',
    };

    const { response, body } = await this.post<TokenResponse>(this.tokenUrl, payload);

    if (response.status() !== 200) {
      throw new Error(`Token request failed with status ${response.status()}`);
    }

    this.cachedToken = body.accessToken;
    this.tokenExpiresAt = now + body.expiresIn * 1000;
    logger.info(`Access token obtained, expires in ${body.expiresIn}s`);

    return this.cachedToken;
  }

  clearCache(): void {
    this.cachedToken = null;
    this.tokenExpiresAt = 0;
  }
}
