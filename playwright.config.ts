import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3100',
    // This sandbox pins a Chromium build that doesn't match the version
    // @playwright/test would otherwise try to download — use it directly.
    launchOptions: { executablePath: '/opt/pw-browsers/chromium' },
  },
  webServer: {
    command: 'npm run build && npm run start -- -p 3100',
    url: 'http://127.0.0.1:3100/m',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_E2E_TEST_MODE: '1',
      PASS_TOKEN_SECRET: 'e2e-test-secret',
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'e2e-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'e2e-service-role-key',
    },
  },
});
