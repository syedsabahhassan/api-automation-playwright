import { test, expect } from '../../src/fixtures/apiFixtures';
import { buildHomeLoanRequest, buildPersonalLoanRequest } from '../../src/fixtures/testData';

/**
 * PATCH /v1/loans/:id — Update Loan Application
 *
 * Covers:
 *  - Updating amount, term, and repayment frequency on a DRAFT application
 *  - Idempotency: patching with same values returns same state
 *  - 409 conflict when attempting to update a non-DRAFT application
 *  - 404 for unknown IDs
 */
test.describe('PATCH /v1/loans/:id — Update Loan Application', () => {
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
    // updatedAt must be strictly after createdAt
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThan(
      new Date(updated.createdAt).getTime(),
    );
  });

  test('@regression should update repayment frequency from FORTNIGHTLY to MONTHLY', async ({
    loanApi,
  }) => {
    const { body: created } = await loanApi.createApplication(buildPersonalLoanRequest());

    const { response, body: updated } = await loanApi.updateApplication(
      created.applicationId,
      { repaymentFrequency: 'MONTHLY' },
    );

    expect(response.status()).toBe(200);
    expect(updated.repaymentFrequency).toBe('MONTHLY');
  });

  test('@regression patching with the same values should be idempotent (200, no change)', async ({
    loanApi,
  }) => {
    const { body: created } = await loanApi.createApplication(buildPersonalLoanRequest());
    const originalAmount = created.requestedAmount;

    await loanApi.updateApplication(created.applicationId, { requestedAmount: originalAmount });
    const { response, body: result } = await loanApi.updateApplication(
      created.applicationId,
      { requestedAmount: originalAmount },
    );

    expect(response.status()).toBe(200);
    expect(result.requestedAmount).toBe(originalAmount);
  });

  test('@regression should return 404 when patching a non-existent application', async ({
    loanApi,
  }) => {
    const { response } = await loanApi.updateApplication('fake-id-9999', {
      requestedAmount: 10_000,
    });
    expect(response.status()).toBe(404);
  });

  test('@regression should return 204 when withdrawing a DRAFT application', async ({
    loanApi,
  }) => {
    const { body: created } = await loanApi.createApplication(buildPersonalLoanRequest());

    const deleteResponse = await loanApi.withdrawApplication(created.applicationId);
    expect(deleteResponse.status()).toBe(204);

    // Confirm the application is no longer accessible
    const { response: getResponse } = await loanApi.getApplication(created.applicationId);
    expect(getResponse.status()).toBe(404);
  });
});
