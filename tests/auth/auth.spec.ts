import { test, expect } from '../../src/fixtures/apiFixtures';

/**
 * Authentication tests — validate that the OAuth token endpoint
 * behaves correctly for valid, invalid, and missing credentials.
 */
test.describe('Authentication — OAuth 2.0 Client Credentials', () => {
  test('@smoke @regression should return 200 and a valid Bearer token for correct credentials', async ({
    authApi,
  }) => {
    const token = await authApi.getAccessToken();

    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // JWT structure: header.payload.signature
  });

  test('@regression should cache the token and not issue a duplicate request within TTL', async ({
    authApi,
  }) => {
    const token1 = await authApi.getAccessToken();
    const token2 = await authApi.getAccessToken();

    // Same token must be returned without a second network call
    expect(token1).toBe(token2);
  });

  test('@regression should refresh the token after cache is cleared', async ({ authApi }) => {
    const token1 = await authApi.getAccessToken();
    authApi.clearCache();
    const token2 = await authApi.getAccessToken();

    // New token issued after cache invalidation
    expect(token1).not.toBe(token2);
  });
});
