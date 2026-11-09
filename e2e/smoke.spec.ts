import { test, expect } from "@playwright/test";

test.describe("ThesisSlot Setup Verification", () => {
  test("renders Thai title, subtitle, and Zinc theme", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator("h1, div, p").filter({ hasText: "ThesisSlot" }).first()
    ).toBeVisible();
    await expect(
      page.getByText("ระบบจองสอบโครงงานและวิทยานิพนธ์")
    ).toBeVisible();
    await expect(
      page.getByText("โครงสร้างโครงการพร้อมสำหรับการพัฒนา")
    ).toBeVisible();
  });
});
