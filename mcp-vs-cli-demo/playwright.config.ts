import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ path: `.env.${process.env.NODE_ENV || 'local'}` });

/**
 * Playwright config for the MCP vs CLI demo.
 *
 * Three test projects:
 *   chromium-cli  — standard Playwright tests with page objects and fixtures
 *   api-verify    — pure API assertions that run headlessly (no browser)
 *   mcp           — MCP-driven tests (require Claude API key; see tests/mcp/ABOUT_MCP_TESTS.md)
 *
 * The split into separate projects lets CI run just the CLI tests without needing
 * an LLM API key, and lets you run just the MCP tests for demo purposes.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  fullyParallel: true,

  reporter: process.env.CI
    ? [
        ['junit', { outputFile: 'test-results/results.xml' }],
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['list'],
      ]
    : [['html', { open: 'on-failure' }], ['list']],

  use: {
    baseURL: process.env.PORTAL_URL || 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',

    // API calls share the same base URL as the mock server
    extraHTTPHeaders: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-api-version': '1.0',
    },
    ignoreHTTPSErrors: true,
  },

  projects: [
    // ─── CLI tests ──────────────────────────────────────────────────────────────
    {
      name: 'chromium-cli',
      testDir: './tests/cli',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.PORTAL_URL || 'http://localhost:3001',
      },
    },

    // ─── API-only verification (no browser) ─────────────────────────────────────
    {
      name: 'api-verify',
      testDir: './tests/cli',
      grep: /@api/,
      use: {
        baseURL: process.env.API_BASE_URL || 'http://localhost:3000',
      },
    },

    // ─── MCP tests (require @playwright/mcp or Claude API) ─────────────────────
    {
      name: 'mcp',
      testDir: './tests/mcp',
      retries: 0, // MCP tests are intentionally not retried — see ABOUT_MCP_TESTS.md
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.PORTAL_URL || 'http://localhost:3001',
      },
    },
  ],

  // Smoke project runs across both CLI and API — fast health check
  // Run with: playwright test --project=chromium-cli --grep @smoke
});
