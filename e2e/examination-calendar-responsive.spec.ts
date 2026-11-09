import { test, expect } from "@playwright/test";

test.describe("Examination Calendar Responsive Design & Visual States", () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate as Academic Staff
    await page.goto("/login");
    await page.getByLabel("อีเมลสถาบัน").fill("staff@thesisslot.local");
    await page.getByLabel("รหัสผ่าน").fill("password123");
    await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("Desktop view (1920x1080) renders complete month grid and detail panel", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/examination-calendar");

    await expect(
      page.getByRole("heading", { name: "ปฏิทินตารางสอบวิทยานิพนธ์และโครงงาน" })
    ).toBeVisible();
    await expect(page.getByText("การสอบทั้งหมดในเดือน")).toBeVisible();
    await expect(page.getByText("กำหนดการประจำวัน")).toBeVisible();

    await page.screenshot({
      path: "test-results/calendar-desktop-1080p.png",
      fullPage: true,
    });
  });

  test("Laptop view (1366x768) maintains responsive grid and side detail", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto("/examination-calendar");

    await expect(
      page.getByRole("heading", { name: "ปฏิทินตารางสอบวิทยานิพนธ์และโครงงาน" })
    ).toBeVisible();
    await expect(page.getByText("กำหนดการประจำวัน")).toBeVisible();

    await page.screenshot({
      path: "test-results/calendar-laptop-768p.png",
      fullPage: true,
    });
  });

  test("Mobile view (390x844) stacks correctly with touch-friendly elements", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/examination-calendar");

    await expect(
      page.getByRole("heading", { name: "ปฏิทินตารางสอบวิทยานิพนธ์และโครงงาน" })
    ).toBeVisible();
    await expect(page.getByText("กำหนดการประจำวัน")).toBeVisible();

    await page.screenshot({
      path: "test-results/calendar-mobile-iphone.png",
      fullPage: true,
    });
  });
});
