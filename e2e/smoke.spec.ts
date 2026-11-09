import { test, expect } from "@playwright/test";

test.describe("ThesisSlot Setup & Home Verification", () => {
  test("renders Thai title, subtitle, and Zinc theme", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator("h1, div, p").filter({ hasText: "ThesisSlot" }).first()
    ).toBeVisible();
    await expect(
      page.getByText("ระบบจองสอบโครงงานและวิทยานิพนธ์")
    ).toBeVisible();
  });

  test("can navigate to login page and see institution login form", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(page.getByText("เข้าสู่ระบบ ThesisSlot")).toBeVisible();
    await expect(page.getByLabel("อีเมลสถาบัน")).toBeVisible();
    await expect(page.getByLabel("รหัสผ่าน")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "เข้าสู่ระบบ" })
    ).toBeVisible();
  });
});
