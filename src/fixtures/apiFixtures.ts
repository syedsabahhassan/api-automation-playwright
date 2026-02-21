import { test as base } from '@playwright/test';
import { AuthApiClient } from '../api/clients/authApiClient';
import { LoanApiClient } from '../api/clients/loanApiClient';

type ApiFixtures = {
  authApi: AuthApiClient;
  loanApi: LoanApiClient;
};

/**
 * Extended Playwright fixtures that wire up domain-specific API clients.
 * Tests receive pre-authenticated client instances — no boilerplate needed.
 *
 * Usage:
 *   import { test } from '../../src/fixtures/apiFixtures';
 *   test('...', async ({ loanApi }) => { ... });
 */
export const test = base.extend<ApiFixtures>({
  authApi: async ({ request }, use) => {
    const authApi = new AuthApiClient(
      request,
      `${process.env.BASE_URL}/oauth/token`,
      process.env.CLIENT_ID!,
      process.env.CLIENT_SECRET!,
    );
    await use(authApi);
  },

  loanApi: async ({ request, authApi }, use) => {
    const loanApi = new LoanApiClient(request, authApi, process.env.BASE_URL!);
    await use(loanApi);
  },
});

export { expect } from '@playwright/test';
