import { test, expect } from '../../src/fixtures/apiFixtures';
import { buildHomeLoanRequest, buildPersonalLoanRequest, BOUNDARY_AMOUNTS, LOW_INCOME_APPLICANT } from '../../src/fixtures/testData';
import { validateSchema } from '../../src/utils/schemaValidator';

/**
 * POST /v1/loans — Loan Application Creation
 *
 * Covers:
 *  - Happy path (home loan, personal loan)
 *  - Schema contract validation
 *  - Boundary value analysis on amounts
 *  - Mandatory field validation
 *  - Business rule: affordability check rejection
 */
test.describe('POST /v1/loans — Create Loan Application', () => {
  test.describe('Happy Path', () => {
    test('@smoke @regression should create a home loan application and return 201', async ({
      loanApi,
    }) => {
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

    test('@regression should create a personal loan application and return 201', async ({
      loanApi,
    }) => {
      const payload = buildPersonalLoanRequest();

      const { response, body } = await loanApi.createApplication(payload);

      expect(response.status()).toBe(201);
      expect(body.product).toBe('PERSONAL_LOAN');
      expect(body.applicant.email).toBe(payload.applicant.email);
    });

    test('@regression should include a Location header pointing to the created resource', async ({
      loanApi,
    }) => {
      const { response, body } = await loanApi.createApplication(buildHomeLoanRequest());

      const locationHeader = response.headers()['location'];
      expect(locationHeader).toBeTruthy();
      expect(locationHeader).toContain(body.applicationId);
    });
  });

  test.describe('Contract / Schema Validation', () => {
    test('@contract response body must conform to LoanApplicationResponse JSON Schema', async ({
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

    test('@regression should reject an amount below the minimum with 422', async ({ loanApi }) => {
      const { response, body } = await loanApi.createApplication(
        buildPersonalLoanRequest({ requestedAmount: BOUNDARY_AMOUNTS.BELOW_MIN }),
      );
      expect(response.status()).toBe(422);
      expect((body as any).code).toBe('VALIDATION_ERROR');
      expect((body as any).details?.requestedAmount).toBeDefined();
    });

    test('@regression should reject a personal loan exceeding the product maximum with 422', async ({
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
      // @ts-expect-error — intentionally omitting required field for negative test
      delete payload.applicant.email;

      const { response, body } = await loanApi.createApplication(payload);

      expect(response.status()).toBe(400);
      expect((body as any).details?.['applicant.email']).toBeDefined();
    });

    test('@regression should return 400 when product type is absent', async ({ loanApi }) => {
      const payload = buildHomeLoanRequest();
      // @ts-expect-error — intentionally omitting required field
      delete payload.product;

      const { response } = await loanApi.createApplication(payload);
      expect(response.status()).toBe(400);
    });
  });

  test.describe('Business Rules', () => {
    test('@regression should return 422 with AFFORDABILITY_CHECK_FAILED for a high-debt-ratio request', async ({
      loanApi,
    }) => {
      // Low income applicant requesting a large loan — should fail affordability
      const { response, body } = await loanApi.createApplication(
        buildHomeLoanRequest({
          requestedAmount: 850_000,
          applicant: LOW_INCOME_APPLICANT,
        }),
      );

      expect(response.status()).toBe(422);
      expect((body as any).code).toBe('AFFORDABILITY_CHECK_FAILED');
    });
  });
});
