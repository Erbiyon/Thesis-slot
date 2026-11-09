import { test, expect } from "@playwright/test";

test.describe("Phase 2 — Project Registration, Group Members & Review Lifecycle E2E", () => {
  const uniqueId = Date.now().toString().slice(-4);
  const projectTitle = `โครงงานระบบบริหารความปลอดภัยข้อมูล ${uniqueId}`;

  test("full end-to-end lifecycle: student creates project, invites member, requests advisor, faculty accepts, student submits, staff reviews", async ({
    browser,
  }) => {
    // -------------------------------------------------------------
    // Step 1: Student 1 logs in, creates a draft project
    // -------------------------------------------------------------
    const student1Context = await browser.newContext();
    const s1Page = await student1Context.newPage();

    // Auto-accept confirmation dialogs
    s1Page.on("dialog", (dialog) => dialog.accept());

    await s1Page.goto("/login");
    await s1Page.getByLabel("อีเมลสถาบัน").fill("student1@thesisslot.local");
    await s1Page.getByLabel("รหัสผ่าน").fill("password123");
    await s1Page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();

    await expect(s1Page).toHaveURL(/.*dashboard/);

    // Navigate to projects page
    await s1Page.goto("/projects");
    await expect(
      s1Page.getByRole("heading", { name: /รายการโครงงานและวิทยานิพนธ์/ })
    ).toBeVisible();

    // Click create project
    await s1Page.getByRole("link", { name: "ลงทะเบียนหัวข้อใหม่" }).click();
    await expect(s1Page).toHaveURL(/.*projects\/new/);

    // Fill form
    await s1Page.getByPlaceholder(/เช่น ระบบจองสอบโครงงาน/).fill(projectTitle);
    await s1Page
      .getByPlaceholder(/Integrated Thesis and Project/)
      .fill(`Data Security Management System ${uniqueId}`);
    await s1Page
      .getByPlaceholder(/ระบุวัตถุประสงค์ ขอบเขต/)
      .fill("สรุปรายละเอียดโครงงานและการพัฒนาต้นแบบเพื่อการศึกษา...");

    // Submit draft form
    await s1Page.getByRole("button", { name: "บันทึกฉบับร่าง" }).click();

    // Should redirect to project details
    await expect(s1Page).toHaveURL(/.*projects\/[a-z0-9]+/);
    await expect(
      s1Page.getByRole("heading", { name: projectTitle })
    ).toBeVisible();
    await expect(s1Page.getByText("ฉบับร่าง", { exact: true })).toBeVisible();

    const projectUrl = s1Page.url();
    const projectId = projectUrl.split("/projects/")[1].split("/")[0];

    // -------------------------------------------------------------
    // Step 2: Student 1 invites Student 2 to group
    // -------------------------------------------------------------
    await s1Page.goto(`/projects/${projectId}/members`);
    await expect(
      s1Page.getByRole("heading", { name: "จัดการสมาชิกกลุ่มโครงงาน" })
    ).toBeVisible();

    await s1Page.getByPlaceholder(/กรอกรหัสนักศึกษา/).fill("66010002");
    await s1Page.getByRole("button", { name: "ส่งคำเชิญ" }).click();

    await expect(s1Page.getByText(/รหัสนักศึกษา: 66010002/)).toBeVisible();
    await expect(
      s1Page.getByText("รอการตอบรับ", { exact: true })
    ).toBeVisible();

    // -------------------------------------------------------------
    // Step 3: Student 2 logs in and accepts the invitation
    // -------------------------------------------------------------
    const student2Context = await browser.newContext();
    const s2Page = await student2Context.newPage();

    await s2Page.goto("/login");
    await s2Page.getByLabel("อีเมลสถาบัน").fill("student2@thesisslot.local");
    await s2Page.getByLabel("รหัสผ่าน").fill("password123");
    await s2Page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();

    await expect(s2Page).toHaveURL(/.*dashboard/);

    await s2Page.goto(`/projects/${projectId}/members`);
    await expect(s2Page.getByRole("button", { name: "ตอบรับ" })).toBeVisible();
    await s2Page.getByRole("button", { name: "ตอบรับ" }).click();

    await expect(s2Page.getByText("เข้าร่วมกลุ่มแล้ว")).toBeVisible();
    await student2Context.close();

    // -------------------------------------------------------------
    // Step 4: Student 1 requests faculty advisor
    // -------------------------------------------------------------
    await s1Page.goto(`/projects/${projectId}/advisor`);
    await expect(
      s1Page.getByText("แต่งตั้งอาจารย์ที่ปรึกษาโครงงาน")
    ).toBeVisible();

    // Open faculty select dropdown
    await s1Page.getByRole("combobox").click();
    await s1Page.getByRole("option", { name: /สมบัติ วิชาการ/ }).click();
    await s1Page.getByRole("button", { name: "ส่งคำขอเป็นที่ปรึกษา" }).click();

    await expect(s1Page.getByText("รออาจารย์ตอบรับ")).toBeVisible();

    // -------------------------------------------------------------
    // Step 5: Faculty logs in, views advisor requests, and accepts
    // -------------------------------------------------------------
    const facultyContext = await browser.newContext();
    const facPage = await facultyContext.newPage();

    await facPage.goto("/login");
    await facPage.getByLabel("อีเมลสถาบัน").fill("faculty@thesisslot.local");
    await facPage.getByLabel("รหัสผ่าน").fill("password123");
    await facPage.getByRole("button", { name: "เข้าสู่ระบบ" }).click();

    await expect(facPage).toHaveURL(/.*dashboard/);

    await facPage.goto("/faculty/advisor-requests");
    await expect(
      facPage.getByRole("heading", { name: "คำขอเป็นอาจารย์ที่ปรึกษา" })
    ).toBeVisible();
    await expect(facPage.getByText(projectTitle)).toBeVisible();

    // Open modal and accept request
    await facPage.getByRole("button", { name: "พิจารณาคำขอ" }).first().click();
    await facPage.getByRole("button", { name: "ตอบรับเป็นที่ปรึกษา" }).click();

    await expect(
      facPage.getByText("ตอบรับเป็นที่ปรึกษา", { exact: true }).first()
    ).toBeVisible();
    await facultyContext.close();

    // -------------------------------------------------------------
    // Step 6: Student 1 submits project registration for academic review
    // -------------------------------------------------------------
    await s1Page.goto(`/projects/${projectId}`);
    await expect(
      s1Page.getByRole("button", { name: "ส่งคำขอลงทะเบียน" })
    ).toBeVisible();
    await s1Page.getByRole("button", { name: "ส่งคำขอลงทะเบียน" }).click();

    // Confirm submission
    await expect(
      s1Page.getByText("รอการตรวจสอบ", { exact: true }).first()
    ).toBeVisible();
    await student1Context.close();

    // -------------------------------------------------------------
    // Step 7: Academic Staff reviews the submission
    // -------------------------------------------------------------
    const staffContext = await browser.newContext();
    const staffPage = await staffContext.newPage();

    await staffPage.goto("/login");
    await staffPage.getByLabel("อีเมลสถาบัน").fill("staff@thesisslot.local");
    await staffPage.getByLabel("รหัสผ่าน").fill("password123");
    await staffPage.getByRole("button", { name: "เข้าสู่ระบบ" }).click();

    await expect(staffPage).toHaveURL(/.*dashboard/);

    await staffPage.goto("/academic/project-reviews");
    await expect(
      staffPage.getByRole("heading", { name: /ตรวจสอบคำขอลงทะเบียนโครงงาน/ })
    ).toBeVisible();
    await expect(staffPage.getByText(projectTitle)).toBeVisible();

    // Navigate to review decision page
    await staffPage
      .getByRole("row", { name: new RegExp(projectTitle) })
      .getByRole("link", { name: "ตรวจสอบ" })
      .click();
    await expect(
      staffPage.getByRole("heading", { name: projectTitle })
    ).toBeVisible();

    // Staff approves
    await staffPage
      .getByLabel("ข้อคิดเห็น / ข้อแนะนำจากเจ้าหน้าที่วิชาการ")
      .fill("ข้อมูลครบถ้วนถูกต้อง อนุมัติการลงทะเบียนผ่านการทดสอบ E2E");
    await staffPage
      .getByRole("button", { name: "อนุมัติการลงทะเบียน" })
      .click();

    // Should redirect back to reviews list
    await expect(staffPage).toHaveURL(/.*academic\/project-reviews/);
    await staffContext.close();
  });
});
