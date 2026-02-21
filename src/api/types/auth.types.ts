export interface TokenRequest {
  clientId: string;
  clientSecret: string;
  grantType: 'client_credentials';
  scope?: string;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  scope: string;
}

export interface AuthHeaders {
  Authorization: string;
  'x-correlation-id': string;
  'x-api-version': string;
}
