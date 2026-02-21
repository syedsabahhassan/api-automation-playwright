import { test, expect } from '../../src/fixtures/apiFixtures';
import {
  buildHomeLoanRequest,
  buildPersonalLoanRequest,
  BOUNDARY_AMOUNTS,
  LOW_INCOME_APPLICANT,
} from '../../src/fixtures/testData';
import { validateSchema } from '../../src/utils/schemaValidator';

/**
 * POST /v1/loans — Loan Application Creation
 *
 * Covers: happy path, schema contract, boundary value analysis,
 * mandatory field validation, and affordability business rule.
 */
test.describe('POST /v1/loans — Create Loan Application', () => {
  test.describe('Happy Path', () => {
    test('@smoke @regression should create a home loan and return 201', async ({ loanApi }) => {
      const payload = buildHomeLoanRequest();
      const { response, body } = await loanApi.createApplication(payload);

      expect(response.status()).toBe(201);
      expect(body.applicationId).toBeTruthy();
      expect(body.referenceNumber).toMatch(/^LN-\d{8}-[A-Z0-9]{4}$/);
      expect(body.status).toBe('DRAFT');
      expect(body.product).toBe('HOME_LOAN');
      expect(body.requestedAmount).toBe(payload.requestedAmount);
      expect(body._links.self.href).toContain(body.applicationId);
    });

    test('@regression should create a personal loan and return 201', async ({ loanApi }) => {
      const { response, body } = await loanApi.createApplication(buildPersonalLoanRequest());

      expect(response.status()).toBe(201);
      expect(body.product).toBe('PERSONAL_LOAN');
    });

    test('@regression response should include a Location header', async ({ loanApi }) => {
      const { response, body } = await loanApi.createApplication(buildHomeLoanRequest());

      const location = response.headers()['location'];
      expect(location).toBeTruthy();
      expect(location).toContain(body.applicationId);
    });
  });

  test.describe('Contract Validation', () => {
    test('@contract response must conform to LoanApplicationResponse JSON Schema', async ({
      loanApi,
    }) => {
      const { body } = await loanApi.createApplication(buildHomeLoanRequest());
      const { valid, errors } = validateSchema('loan-application', body);

      expect(valid, `Schema violations: ${errors.join('; ')}`).toBe(true);
    });
  });

  test.describe('Boundary Value Analysis', () => {
    test('@regression should accept the minimum allowed loan amount', async ({ loanApi }) => {
      const { response } = await loanApi.createApplication(
        buildPersonalLoanRequest({ requestedAmount: BOUNDARY_AMOUNTS.MIN_LOAN }),
      );
      expect(response.status()).toBe(201);
    });

    test('@regression should reject an amount below minimum with 422', async ({ loanApi }) => {
      const { response, body } = await loanApi.createApplication(
        buildPersonalLoanRequest({ requestedAmount: BOUNDARY_AMOUNTS.BELOW_MIN }),
      );
      expect(response.status()).toBe(422);
      expect((body as any).code).toBe('VALIDATION_ERROR');
      expect((body as any).details?.requestedAmount).toBeDefined();
    });

    test('@regression should reject a personal loan exceeding the product maximum', async ({
      loanApi,
    }) => {
      const { response } = await loanApi.createApplication(
        buildPersonalLoanRequest({ requestedAmount: BOUNDARY_AMOUNTS.ABOVE_MAX_PERSONAL }),
      );
      expect(response.status()).toBe(422);
    });
  });

  test.describe('Mandatory Field Validation', () => {
    test('@regression should return 400 when applicant email is missing', async ({ loanApi }) => {
      const payload = buildHomeLoanRequest();
      // @ts-expect-error intentional negative test
      delete payload.applicant.email;

      const { response, body } = await loanApi.createApplication(payload);
      expect(response.status()).toBe(400);
      expect((body as any).details?.['applicant.email']).toBeDefined();
    });

    test('@regression should return 400 when product is missing', async ({ loanApi }) => {
      const payload = buildHomeLoanRequest();
      // @ts-expect-error intentional negative test
      delete payload.product;

      const { response } = await loanApi.createApplication(payload);
      expect(response.status()).toBe(400);
    });
  });

  test.describe('Business Rules', () => {
    test('@regression should return 422 AFFORDABILITY_CHECK_FAILED for high debt-to-income ratio', async ({
      loanApi,
    }) => {
      const { response, body } = await loanApi.createApplication(
        buildHomeLoanRequest({ requestedAmount: 850_000, applicant: LOW_INCOME_APPLICANT }),
      );
      expect(response.status()).toBe(422);
      expect((body as any).code).toBe('AFFORDABILITY_CHECK_FAILED');
    });
  });
});
