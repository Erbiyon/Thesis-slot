import { test, expect } from "@playwright/test";

test.describe("ThesisSlot Landing Page & Navigation Verification", () => {
  test("renders Thai title, subtitle, authentic Zinc theme, and sections", async ({
    page,
  }) => {
    await page.goto("/");

    // 1. Verify H1 headline
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /จัดการการสอบโครงงานและวิทยานิพนธ์ อย่างเป็นระบบในที่เดียว/,
      })
    ).toBeVisible();

    // 2. Verify Brand Logo
    await expect(
      page.locator("header").getByText("ThesisSlot").first()
    ).toBeVisible();

    // 3. Verify Navigation anchors
    await expect(
      page.getByRole("link", { name: "ความสามารถของระบบ" }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "ขั้นตอนการใช้งาน" }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "สำหรับผู้ใช้งาน" }).first()
    ).toBeVisible();

    // 4. Verify Sections
    await expect(
      page.getByRole("heading", { name: "ครบทุกขั้นตอนของการจัดการสอบ" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "เริ่มต้นใช้งานได้ในไม่กี่ขั้นตอน" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "ออกแบบสำหรับทุกบทบาทในกระบวนการสอบ" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "พร้อมเริ่มจัดการการสอบอย่างเป็นระบบ" })
    ).toBeVisible();

    // 5. Verify Product Preview card
    await expect(
      page.getByText("ตัวอย่างกำหนดการสอบวิทยานิพนธ์")
    ).toBeVisible();
    await expect(page.getByText("ยืนยันกำหนดสอบแล้ว")).toBeVisible();

    // 6. Navigate to login via Primary Hero CTA
    const heroLoginBtn = page.getByRole("link", {
      name: "เข้าสู่ระบบเพื่อเริ่มใช้งาน",
    });
    await expect(heroLoginBtn).toBeVisible();
    await heroLoginBtn.click();

    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByText("เข้าสู่ระบบ ThesisSlot")).toBeVisible();
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
