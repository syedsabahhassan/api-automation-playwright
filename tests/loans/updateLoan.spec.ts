import { test, expect } from '../../src/fixtures/apiFixtures';
import { buildPersonalLoanRequest } from '../../src/fixtures/testData';

/**
 * PATCH /v1/loans/:id & DELETE /v1/loans/:id
 * Covers: field updates, idempotency, withdraw (soft delete), 404 cases.
 */
test.describe('PATCH & DELETE /v1/loans/:id — Update & Withdraw', () => {
  test('@regression should update requestedAmount and return the updated resource', async ({
    loanApi,
  }) => {
    const { body: created } = await loanApi.createApplication(buildPersonalLoanRequest());
    const { response, body: updated } = await loanApi.updateApplication(
      created.applicationId,
      { requestedAmount: 20_000 },
    );

    expect(response.status()).toBe(200);
    expect(updated.requestedAmount).toBe(20_000);
    expect(updated.applicationId).toBe(created.applicationId);
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThan(
      new Date(updated.createdAt).getTime(),
    );
  });

  test('@regression should update repayment frequency to MONTHLY', async ({ loanApi }) => {
    const { body: created } = await loanApi.createApplication(buildPersonalLoanRequest());
    const { response, body: updated } = await loanApi.updateApplication(
      created.applicationId,
      { repaymentFrequency: 'MONTHLY' },
    );

    expect(response.status()).toBe(200);
    expect(updated.repaymentFrequency).toBe('MONTHLY');
  });

  test('@regression patching with identical values should be idempotent', async ({ loanApi }) => {
    const { body: created } = await loanApi.createApplication(buildPersonalLoanRequest());

    await loanApi.updateApplication(created.applicationId, { requestedAmount: created.requestedAmount });
    const { response, body: result } = await loanApi.updateApplication(
      created.applicationId,
      { requestedAmount: created.requestedAmount },
    );

    expect(response.status()).toBe(200);
    expect(result.requestedAmount).toBe(created.requestedAmount);
  });

  test('@regression should return 404 when patching a non-existent application', async ({
    loanApi,
  }) => {
    const { response } = await loanApi.updateApplication('fake-id-9999', { requestedAmount: 10_000 });
    expect(response.status()).toBe(404);
  });

  test('@regression should return 204 when withdrawing a DRAFT application', async ({
    loanApi,
  }) => {
    const { body: created } = await loanApi.createApplication(buildPersonalLoanRequest());

    const deleteResponse = await loanApi.withdrawApplication(created.applicationId);
    expect(deleteResponse.status()).toBe(204);

    // Confirm resource is gone
    const { response: getResponse } = await loanApi.getApplication(created.applicationId);
    expect(getResponse.status()).toBe(404);
  });
});
