import { test, expect } from "@playwright/test";

test.describe("Phase 1 Regression — Role-Based Access & Authentication Flows", () => {
  test("allows admin to log in, view users, and check admin navigation", async ({
    page,
  }) => {
    await page.goto("/login");

    // Login with admin credentials
    await page.getByLabel("อีเมลสถาบัน").fill("admin@thesisslot.local");
    await page.getByLabel("รหัสผ่าน").fill("password123");
    await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();

    // Verify redirected to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(
      page.getByRole("heading", { name: "ภาพรวมการบริหารระบบ" })
    ).toBeVisible();

    // Verify admin can access User Management
    await page.goto("/admin/users");
    await expect(
      page.getByRole("heading", { name: "การจัดการผู้ใช้งานในระบบ" })
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "admin@thesisslot.local" })
    ).toBeVisible();
  });

  test("enforces role guards — Student cannot access /admin/users", async ({
    page,
  }) => {
    await page.goto("/login");

    // Login as student
    await page.getByLabel("อีเมลสถาบัน").fill("student1@thesisslot.local");
    await page.getByLabel("รหัสผ่าน").fill("password123");
    await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();

    await expect(page).toHaveURL(/.*dashboard/);
    await expect(
      page.getByRole("heading", { name: "พื้นที่ปฏิบัติงานนักศึกษา" })
    ).toBeVisible();

    // Attempt direct navigation to /admin/users
    await page.goto("/admin/users");

    // Must be redirected to /dashboard due to RBAC guard
    await expect(page).toHaveURL(/.*dashboard/);
  });
});
