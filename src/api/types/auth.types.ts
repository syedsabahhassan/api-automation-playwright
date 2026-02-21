/**
 * OAuth 2.0 Client Credentials — request and response types.
 */

export interface TokenRequest {
  clientId: string;
  clientSecret: string;
  grantType: 'client_credentials';
  scope?: string;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  scope: string;
}
