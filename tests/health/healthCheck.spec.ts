import { test, expect } from '@playwright/test';

/**
 * Service Health Check — @smoke gate before full suite runs in CI.
 * Lightweight, no auth dependency — acts as pipeline pre-flight.
 */
test.describe('GET /health — Service Availability', () => {
  test('@smoke API should respond with 200 within 2 seconds', async ({ request }) => {
    const start = Date.now();
    const response = await request.get(`${process.env.BASE_URL}/health`);
    const duration = Date.now() - start;

    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(2_000);
  });

  test('@smoke health response should include status and version fields', async ({ request }) => {
    const response = await request.get(`${process.env.BASE_URL}/health`);
    const body = await response.json();

    expect(body.status).toBe('UP');
    expect(body.version).toBeTruthy();
  });

  test('@smoke readiness probe should confirm all downstream dependencies are UP', async ({
    request,
  }) => {
    const response = await request.get(`${process.env.BASE_URL}/health/ready`);
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.status).toBe('UP');

    const checks: Record<string, { status: string }> = body.checks ?? {};
    for (const [service, check] of Object.entries(checks)) {
      expect(check.status, `Downstream service '${service}' is not UP`).toBe('UP');
    }
  });
});
