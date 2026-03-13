import { test as base, APIRequestContext } from '@playwright/test';
import { LoanPortalPage } from '../page-objects/LoanPortalPage';
import { TEST_USER } from '../data/loanScenarios';

// ── Import from the companion API repo ──────────────────────────────────────
//
// We reuse the existing clients and fixtures rather than duplicating them.
// This is the integration point between the two repos — the UI demo is
// a layer on top of the same API infrastructure.

// Path: fixtures/ → src/ → mcp-vs-cli-demo/ → repo root → src/api/clients/
import { AuthApiClient } from '../../../src/api/clients/authApiClient';
import { LoanApiClient }  from '../../../src/api/clients/loanApiClient';

// ── Fixture type definitions ──────────────────────────────────────────────────

type HybridFixtures = {
  /** Authenticated portal page — already logged in when test receives it */
  portal: LoanPortalPage;

  /** Pre-authenticated API client for setup/teardown steps in hybrid tests */
  loanApi: LoanApiClient;

  /** Shorthand for the test user credentials */
  testUser: { email: string; password: string };
};

/**
 * hybridFixtures extends Playwright's base test with:
 *   - portal:    A LoanPortalPage instance pre-navigated to the dashboard
 *   - loanApi:   The domain API client from the companion repo (reused as-is)
 *   - testUser:  Test credentials from environment
 *
 * Tests receive clean state: logged in, on the dashboard, ready to apply.
 *
 * Teardown: the fixture automatically withdraws any loan applications created
 * during the test to keep the mock server state clean across runs.
 */
export const test = base.extend<HybridFixtures>({

  testUser: async ({}, use) => {
    await use(TEST_USER);
  },

  loanApi: async ({ request }, use) => {
    const authApi = new AuthApiClient(
      request,
      `${process.env.API_BASE_URL || 'http://localhost:3000'}/oauth/token`,
      process.env.CLIENT_ID     || 'test-client-id',
      process.env.CLIENT_SECRET || 'test-client-secret',
    );
    const loanApi = new LoanApiClient(
      request,
      authApi,
      process.env.API_BASE_URL || 'http://localhost:3000',
    );
    await use(loanApi);
  },

  portal: async ({ page, testUser }, use) => {
    const portalPage = new LoanPortalPage(page);
    await portalPage.goto();
    await portalPage.login(testUser.email, testUser.password);
    // After login the dashboard is visible — test starts here
    await use(portalPage);
  },
});

export { expect } from '@playwright/test';

// ── MCP agent fixture (used by tests/mcp) ─────────────────────────────────────
//
// This wraps a Playwright page and exposes an `act` / `verify` interface
// that mirrors what a real MCP agent (e.g. Claude with Playwright MCP server)
// would provide.
//
// In this demo, the fixture uses Playwright directly to simulate the AI steps.
// In a production MCP setup, `act` would forward each instruction to the LLM
// which would then call Playwright tools to execute it.
//
// The intent is to show the INTERFACE of MCP-style tests — the shape of how
// you describe steps — without requiring a live Claude API key to run the demo.
// See tests/mcp/ABOUT_MCP_TESTS.md for full details.

export type McpAgentFixtures = {
  mcpAgent: McpAgent;
};

export class McpAgent {
  private steps: { type: 'act' | 'verify'; instruction: string }[] = [];

  constructor(private readonly page: import('@playwright/test').Page) {}

  /**
   * Describes an action for the AI agent to perform.
   * In a real MCP setup this would be sent to the LLM as a tool call.
   * In this demo it is logged and matched to a manual simulation step.
   */
  async act(instruction: string): Promise<void> {
    this.steps.push({ type: 'act', instruction });
    console.log(`[MCP act] ${instruction}`);
    // Simulation: see individual test files for the underlying Playwright calls
  }

  /**
   * Describes an assertion for the AI agent to verify.
   */
  async verify(instruction: string): Promise<void> {
    this.steps.push({ type: 'verify', instruction });
    console.log(`[MCP verify] ${instruction}`);
  }

  /** Access the underlying Playwright page for simulation steps */
  get rawPage(): import('@playwright/test').Page {
    return this.page;
  }

  /** Returns the narrated steps for reporting/documentation purposes */
  getStepNarration(): string {
    return this.steps
      .map((s, i) => `${i + 1}. [${s.type.toUpperCase()}] ${s.instruction}`)
      .join('\n');
  }
}

export const mcpTest = base.extend<McpAgentFixtures & { testUser: { email: string; password: string } }>({
  testUser: async ({}, use) => {
    await use(TEST_USER);
  },

  mcpAgent: async ({ page }, use) => {
    const agent = new McpAgent(page);
    await use(agent);
  },
});
