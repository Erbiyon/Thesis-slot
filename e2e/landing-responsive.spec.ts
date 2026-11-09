import { test, expect } from "@playwright/test";

test.describe("Landing Page Responsive Screenshots (Light & Dark Mode)", () => {
  const viewports = [
    { name: "desktop-1080p", width: 1920, height: 1080 },
    { name: "laptop-768p", width: 1366, height: 768 },
    { name: "tablet-1024p", width: 768, height: 1024 },
    { name: "mobile-390p", width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    test(`captures Light Mode on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Verify essential heading
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: /จัดการการสอบโครงงานและวิทยานิพนธ์/,
        })
      ).toBeVisible();

      await page.screenshot({
        path: `test-results/landing-${vp.name}-light.png`,
        fullPage: true,
      });
    });

    test(`captures Dark Mode on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Switch to Dark Mode via Theme Toggle
      const themeToggle = page.locator("button[aria-label*='ธีม']").first();
      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        const darkOption = page.getByRole("menuitem", { name: /มืด|Dark/i });
        if (await darkOption.isVisible()) {
          await darkOption.click();
        }
      }

      await page.screenshot({
        path: `test-results/landing-${vp.name}-dark.png`,
        fullPage: true,
      });
    });
  }
});
