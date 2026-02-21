import { test, expect } from '../../src/fixtures/apiFixtures';

/**
 * Authentication — OAuth 2.0 Client Credentials
 * Validates token issuance, caching behaviour, and refresh after expiry.
 */
test.describe('Authentication — OAuth 2.0 Client Credentials', () => {
  test('@smoke @regression should return a valid Bearer token for correct credentials', async ({
    authApi,
  }) => {
    const token = await authApi.getAccessToken();

    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // JWT: header.payload.signature
  });

  test('@regression should cache the token and not issue a duplicate request within TTL', async ({
    authApi,
  }) => {
    const token1 = await authApi.getAccessToken();
    const token2 = await authApi.getAccessToken();

    expect(token1).toBe(token2);
  });

  test('@regression should issue a fresh token after the cache is cleared', async ({
    authApi,
  }) => {
    const token1 = await authApi.getAccessToken();
    authApi.clearCache();
    const token2 = await authApi.getAccessToken();

    expect(token1).not.toBe(token2);
  });
});
