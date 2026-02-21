import { test, expect } from '../../src/fixtures/apiFixtures';
import { buildHomeLoanRequest } from '../../src/fixtures/testData';
import { validateSchema } from '../../src/utils/schemaValidator';

/**
 * GET /v1/loans/:id — Retrieve Loan Application
 *
 * Covers:
 *  - Successful retrieval of a previously created application
 *  - Schema contract on GET response
 *  - 404 for unknown IDs
 *  - 401 for missing/invalid auth token
 */
test.describe('GET /v1/loans/:id — Retrieve Loan Application', () => {
  let createdApplicationId: string;

  // Create a single application shared across GET tests in this suite
  test.beforeAll(async ({ loanApi }) => {
    const { body } = await loanApi.createApplication(buildHomeLoanRequest());
    createdApplicationId = body.applicationId;
  });

  test('@smoke @regression should return 200 with the correct application', async ({ loanApi }) => {
    const { response, body } = await loanApi.getApplication(createdApplicationId);

    expect(response.status()).toBe(200);
    expect(body.applicationId).toBe(createdApplicationId);
    expect(body.product).toBe('HOME_LOAN');
  });

  test('@regression response should contain all required top-level fields', async ({ loanApi }) => {
    const { body } = await loanApi.getApplication(createdApplicationId);

    expect(body.applicationId).toBeTruthy();
    expect(body.referenceNumber).toBeTruthy();
    expect(body.status).toBeTruthy();
    expect(body.createdAt).toBeTruthy();
    expect(body.updatedAt).toBeTruthy();
    expect(body._links.self).toBeTruthy();
  });

  test('@contract GET response must conform to LoanApplicationResponse schema', async ({
    loanApi,
  }) => {
    const { body } = await loanApi.getApplication(createdApplicationId);

    const { valid, errors } = validateSchema('loan-application', body);
    expect(valid, `Schema violations: ${errors.join('; ')}`).toBe(true);
  });

  test('@regression should return 404 for a non-existent application ID', async ({ loanApi }) => {
    const { response, body } = await loanApi.getApplication('non-existent-id-00000');

    expect(response.status()).toBe(404);
    expect((body as any).code).toBe('APPLICATION_NOT_FOUND');
  });

  test('@regression should return 401 when no auth token is provided', async ({ request }) => {
    const baseUrl = process.env.BASE_URL!;
    const response = await request.get(`${baseUrl}/v1/loans/${createdApplicationId}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(response.status()).toBe(401);
  });

  test('@regression should list all applications with pagination metadata', async ({ loanApi }) => {
    const { response, body } = await loanApi.listApplications({ page: 1, pageSize: 10 });

    expect(response.status()).toBe(200);
    expect(body.data).toBeInstanceOf(Array);
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.pageSize).toBe(10);
    expect(body.pagination.totalCount).toBeGreaterThanOrEqual(1);
    expect(body._links.self).toBeTruthy();
  });

  test('@regression should filter applications by status', async ({ loanApi }) => {
    const { response, body } = await loanApi.listApplications({ status: 'DRAFT' });

    expect(response.status()).toBe(200);
    body.data.forEach((app) => {
      expect(app.status).toBe('DRAFT');
    });
  });
});
