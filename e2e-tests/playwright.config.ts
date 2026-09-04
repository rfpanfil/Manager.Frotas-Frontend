import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/frotas',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'https://manager-frotas-frontend.vercel.app',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/frotas_user.json',
      },
      dependencies: ['setup'],
    }
  ],
});
