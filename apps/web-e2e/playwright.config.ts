import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const WEB_URL = process.env.WEB_URL ?? 'http://localhost:4200';
const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export default defineConfig({
  globalSetup: './support/global-setup.ts',
  testDir: './tests',
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: WEB_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      // Bypass turbo TUI by invoking the workspace script directly.
      command: 'npm run migration:run && npm run dev --workspace=api',
      url: `${API_URL}/health`,
      cwd: path.resolve(__dirname, '../..'),
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'npm run dev --workspace=web',
      url: WEB_URL,
      cwd: path.resolve(__dirname, '../..'),
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
