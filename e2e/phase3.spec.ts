import { test, expect } from "@playwright/test";

test.describe("Phase 3 — Examination Committee, Availability & Booking Engine E2E", () => {
  test("Academic staff and faculty can access Phase 3 navigation links and pages", async ({
    browser,
  }) => {
    // 1. Staff verifies Examination Bookings & Committees pages
    const staffContext = await browser.newContext();
    const staffPage = await staffContext.newPage();

    await staffPage.goto("/login");
    await staffPage.getByLabel("อีเมลสถาบัน").fill("staff@thesisslot.local");
    await staffPage.getByLabel("รหัสผ่าน").fill("password123");
    await staffPage.getByRole("button", { name: "เข้าสู่ระบบ" }).click();

    await expect(staffPage).toHaveURL(/.*dashboard/);

    // Navigate to Examination Bookings
    await staffPage.goto("/academic/examination-bookings");
    await expect(
      staffPage.getByRole("heading", {
        name: "คำขอจองสอบวิทยานิพนธ์และโครงงาน",
      })
    ).toBeVisible();

    // Navigate to Examination Calendar
    await staffPage.goto("/academic/examination-calendar");
    await expect(
      staffPage.getByRole("heading", {
        name: "ปฏิทินตารางสอบวิทยานิพนธ์และโครงงาน",
      })
    ).toBeVisible();

    // Navigate to Committee Appointments
    await staffPage.goto("/academic/examination-committees");
    await expect(
      staffPage.getByRole("heading", { name: /การจัดตั้งคณะกรรมการสอบ/ })
    ).toBeVisible();

    // 2. Faculty verifies Committee Invitations & Availability pages
    const facultyContext = await browser.newContext();
    const facPage = await facultyContext.newPage();

    await facPage.goto("/login");
    await facPage.getByLabel("อีเมลสถาบัน").fill("faculty@thesisslot.local");
    await facPage.getByLabel("รหัสผ่าน").fill("password123");
    await facPage.getByRole("button", { name: "เข้าสู่ระบบ" }).click();

    await expect(facPage).toHaveURL(/.*dashboard/);

    // Navigate to Faculty Committee Invitations
    await facPage.goto("/faculty/committee-invitations");
    await expect(
      facPage.getByRole("heading", { name: /คำเชิญเป็นคณะกรรมการสอบ/ })
    ).toBeVisible();

    // Navigate to Faculty Availability
    await facPage.goto("/faculty/availability");
    await expect(
      facPage.getByRole("heading", {
        name: /ตารางเวลาว่างและความพร้อมของอาจารย์/,
      })
    ).toBeVisible();

    // 3. Student verifies Examination Calendar
    const studentContext = await browser.newContext();
    const stuPage = await studentContext.newPage();

    await stuPage.goto("/login");
    await stuPage.getByLabel("อีเมลสถาบัน").fill("student1@thesisslot.local");
    await stuPage.getByLabel("รหัสผ่าน").fill("password123");
    await stuPage.getByRole("button", { name: "เข้าสู่ระบบ" }).click();

    await expect(stuPage).toHaveURL(/.*dashboard/);
    await stuPage.goto("/academic/examination-calendar");
    await expect(
      stuPage.getByRole("heading", {
        name: "ปฏิทินตารางสอบวิทยานิพนธ์และโครงงาน",
      })
    ).toBeVisible();
  });
});
