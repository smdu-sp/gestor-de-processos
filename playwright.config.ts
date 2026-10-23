import { defineConfig } from "@playwright/test";
import "dotenv/config";
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  use: {
    baseURL: "http://localhost:3100",
    headless: true,
    viewport: { width: 1366, height: 768 },
  },
  webServer: {
    command: "npm run dev -- --port 3100",
    url: "http://localhost:3100/login",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
