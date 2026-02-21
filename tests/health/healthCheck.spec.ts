import { test, expect } from '@playwright/test';

/**
 * Service Health Check — @smoke gate before full suite runs in CI.
 *
 * These tests are deliberately lightweight with no auth dependency
 * so they can run as a pre-flight check in the pipeline to detect
 * downstream service outages before spending time on the full suite.
 */
test.describe('GET /health — Service Availability', () => {
  test('@smoke API gateway should respond with 200 within 2 seconds', async ({ request }) => {
    const start = Date.now();
    const response = await request.get(`${process.env.BASE_URL}/health`);
    const duration = Date.now() - start;

    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(2_000);
  });

  test('@smoke health response should include status and version', async ({ request }) => {
    const response = await request.get(`${process.env.BASE_URL}/health`);
    const body = await response.json();

    expect(body.status).toBe('UP');
    expect(body.version).toBeTruthy();
  });

  test('@smoke readiness probe should confirm downstream dependencies are available', async ({
    request,
  }) => {
    const response = await request.get(`${process.env.BASE_URL}/health/ready`);
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.status).toBe('UP');

    // Validate individual downstream service checks
    const checks: Record<string, { status: string }> = body.checks ?? {};
    for (const [service, check] of Object.entries(checks)) {
      expect(check.status, `Downstream service '${service}' is not UP`).toBe('UP');
    }
  });
});
