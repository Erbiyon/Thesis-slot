import { test, expect } from "@playwright/test";

test.describe("Examination Calendar (Monthly & Weekly Views)", () => {
  test("allows authenticated user to view monthly examination calendar, switch months, and view day schedules", async ({
    page,
  }) => {
    // Login as Academic Staff
    await page.goto("/login");
    await page.getByLabel("อีเมลสถาบัน").fill("staff@thesisslot.local");
    await page.getByLabel("รหัสผ่าน").fill("password123");
    await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();

    await expect(page).toHaveURL(/.*dashboard/);

    // 1. Navigate to /examination-calendar via sidebar or direct link
    await page.goto("/examination-calendar");
    await expect(
      page.getByRole("heading", { name: "ปฏิทินตารางสอบวิทยานิพนธ์และโครงงาน" })
    ).toBeVisible();
    await expect(page.getByText("รายเดือน")).toBeVisible();

    // 2. Verify calendar month elements & KPI cards
    await expect(page.getByText("เดือนปัจจุบัน")).toBeVisible();
    await expect(page.getByText("การสอบทั้งหมดในเดือน")).toBeVisible();
    await expect(page.getByText("ยืนยันกำหนดสอบแล้ว")).toBeVisible();
    await expect(page.getByText("รอการตรวจสอบ")).toBeVisible();

    // 3. Verify weekday headers in Thai
    await expect(page.getByText("จันทร์").first()).toBeVisible();
    await expect(page.getByText("อังคาร").first()).toBeVisible();
    await expect(page.getByText("พุธ").first()).toBeVisible();
    await expect(page.getByText("พฤหัสบดี").first()).toBeVisible();
    await expect(page.getByText("ศุกร์").first()).toBeVisible();

    // 4. Test Month Navigation (Next month -> Previous month -> Today)
    const nextBtn = page.getByRole("button", { name: "เดือนถัดไป" });
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();
    await expect(page).toHaveURL(/.*month=/);

    const prevBtn = page.getByRole("button", { name: "เดือนก่อนหน้า" });
    await expect(prevBtn).toBeVisible();
    await prevBtn.click();

    const todayBtn = page.getByRole("button", { name: "วันนี้" });
    await expect(todayBtn).toBeVisible();
    await todayBtn.click();

    // 5. Test Date Selection on the calendar grid
    const dayButton = page.locator("button[aria-label*='มีการสอบ']").first();
    await expect(dayButton).toBeVisible();
    await dayButton.click();

    // Detail Panel should be displayed
    await expect(page.getByText("กำหนดการประจำวัน")).toBeVisible();

    // 6. Test Quick Switch to Weekly Master Calendar (/academic/examination-calendar)
    const weeklyLink = page.getByRole("link", { name: /มุมมองรายสัปดาห์/ });
    await expect(weeklyLink).toBeVisible();
    await weeklyLink.click();

    await expect(page).toHaveURL(/.*academic\/examination-calendar/);
    await expect(
      page.getByText(
        "มุมมองตารางสอบประจำสัปดาห์ (วันจันทร์ - วันศุกร์) แยกตามห้องสอบ"
      )
    ).toBeVisible();

    // 7. Test Switch back to Monthly Calendar from Weekly view
    const monthlyLink = page.getByRole("link", { name: /มุมมองรายเดือน/ });
    await expect(monthlyLink).toBeVisible();
    await monthlyLink.click();

    await expect(page).toHaveURL(/.*examination-calendar/);
  });
});
