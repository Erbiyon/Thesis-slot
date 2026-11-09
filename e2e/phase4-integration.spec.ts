import { test, expect } from "@playwright/test";

test.describe("Phase 4 — End-to-End Examination Booking Integration Workflow", () => {
  const uniqueId = Date.now().toString().slice(-4);
  const projectTitle = `โครงงานทดสอบการจองสอบแบบสมบูรณ์ ${uniqueId}`;

  test("full end-to-end journey: project registration -> approval -> committee appointment -> booking request -> staff review -> cancellation", async ({
    browser,
  }) => {
    // -------------------------------------------------------------
    // Step 1: Student 1 creates project
    // -------------------------------------------------------------
    const studentContext = await browser.newContext();
    const studentPage = await studentContext.newPage();
    studentPage.on("dialog", (d) => d.accept());

    await studentPage.goto("/login");
    await studentPage
      .getByLabel("อีเมลสถาบัน")
      .fill("student1@thesisslot.local");
    await studentPage.getByLabel("รหัสผ่าน").fill("password123");
    await studentPage.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
    await expect(studentPage).toHaveURL(/.*dashboard/);

    await studentPage.goto("/projects/new");
    await studentPage
      .getByPlaceholder(/เช่น ระบบจองสอบโครงงาน/)
      .fill(projectTitle);
    await studentPage
      .getByPlaceholder(/Integrated Thesis and Project/)
      .fill(`Full E2E Booking Project ${uniqueId}`);
    await studentPage
      .getByPlaceholder(/ระบุวัตถุประสงค์ ขอบเขต/)
      .fill("ทดสอบวงจรการจองสอบแบบสมบูรณ์ใน Phase 4");
    await studentPage.getByRole("button", { name: "บันทึกฉบับร่าง" }).click();

    await expect(studentPage).toHaveURL(/\/projects\/[a-z0-9]+/);
    await expect(
      studentPage.getByRole("heading", { name: projectTitle })
    ).toBeVisible();

    const pathname = new URL(studentPage.url()).pathname;
    const projectId = pathname.split("/").filter(Boolean)[1];

    // Request Advisor (faculty)
    await studentPage.goto(`/projects/${projectId}/advisor`);
    await expect(
      studentPage.getByText("แต่งตั้งอาจารย์ที่ปรึกษาโครงงาน")
    ).toBeVisible();
    await studentPage.getByRole("combobox").click();
    await studentPage.getByRole("option", { name: /สมบัติ วิชาการ/ }).click();
    await studentPage
      .getByRole("button", { name: "ส่งคำขอเป็นที่ปรึกษา" })
      .click();
    await expect(studentPage.getByText("รออาจารย์ตอบรับ")).toBeVisible();

    // -------------------------------------------------------------
    // Step 2: Faculty accepts advisor request
    // -------------------------------------------------------------
    const facultyContext = await browser.newContext();
    const facultyPage = await facultyContext.newPage();
    facultyPage.on("dialog", (d) => d.accept());

    await facultyPage.goto("/login");
    await facultyPage
      .getByLabel("อีเมลสถาบัน")
      .fill("faculty@thesisslot.local");
    await facultyPage.getByLabel("รหัสผ่าน").fill("password123");
    await facultyPage.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
    await expect(facultyPage).toHaveURL(/.*dashboard/);

    await facultyPage.goto("/faculty/advisor-requests");
    await expect(
      facultyPage.getByRole("heading", { name: "คำขอเป็นอาจารย์ที่ปรึกษา" })
    ).toBeVisible();
    await facultyPage
      .getByRole("button", { name: "พิจารณาคำขอ" })
      .first()
      .click();
    await facultyPage
      .getByRole("button", { name: "ตอบรับเป็นที่ปรึกษา" })
      .click();

    // -------------------------------------------------------------
    // Step 3: Student submits registration
    // -------------------------------------------------------------
    await studentPage.goto(`/projects/${projectId}`);
    await studentPage.getByRole("button", { name: "ส่งคำขอลงทะเบียน" }).click();
    await expect(
      studentPage.getByText("รอการตรวจสอบ", { exact: true })
    ).toBeVisible();

    // -------------------------------------------------------------
    // Step 4: Academic Staff approves project
    // -------------------------------------------------------------
    const staffContext = await browser.newContext();
    const staffPage = await staffContext.newPage();
    staffPage.on("dialog", (d) => d.accept());

    await staffPage.goto("/login");
    await staffPage.getByLabel("อีเมลสถาบัน").fill("staff@thesisslot.local");
    await staffPage.getByLabel("รหัสผ่าน").fill("password123");
    await staffPage.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
    await expect(staffPage).toHaveURL(/.*dashboard/);

    await staffPage.goto(`/academic/project-reviews/${projectId}`);
    await expect(
      staffPage.getByRole("heading", { name: projectTitle })
    ).toBeVisible();

    await staffPage
      .getByLabel("ข้อคิดเห็น / ข้อแนะนำจากเจ้าหน้าที่วิชาการ")
      .fill("อนุมัติสำหรับ Phase 4 E2E Test");
    await staffPage
      .getByRole("button", { name: "อนุมัติการลงทะเบียน" })
      .click();

    await expect(staffPage).toHaveURL(/.*academic\/project-reviews/);

    // -------------------------------------------------------------
    // Step 5: Staff verifies Examination Committees & Bookings workspaces
    // -------------------------------------------------------------
    await staffPage.goto("/academic/examination-committees");
    await expect(
      staffPage.getByRole("heading", { name: /การจัดตั้งคณะกรรมการสอบ/ })
    ).toBeVisible();

    await staffPage.goto("/academic/examination-bookings");
    await expect(
      staffPage.getByRole("heading", {
        name: "คำขอจองสอบวิทยานิพนธ์และโครงงาน",
      })
    ).toBeVisible();

    // -------------------------------------------------------------
    // Step 6: Student walks through examination booking wizard
    // -------------------------------------------------------------
    await studentPage.goto(`/projects/${projectId}`);
    const bookingLink = studentPage.getByRole("link", {
      name: "จองวัน-เวลาสอบ",
    });
    await expect(bookingLink).toBeVisible();
    await bookingLink.click();

    await expect(
      studentPage.getByRole("heading", {
        name: /การจองสอบโครงงานและวิทยานิพนธ์/,
      })
    ).toBeVisible();

    // Step 6.1: Click Next to go to Date/Slot selection
    const nextBtnStep1 = studentPage.getByRole("button", {
      name: /ถัดไป: เลือกวันและห้องสอบ/,
    });
    await expect(nextBtnStep1).toBeVisible();
    await nextBtnStep1.click();

    // Step 6.2: Pick a date
    const examDateInput = studentPage.locator("#examDate");
    await expect(examDateInput).toBeVisible();
    await examDateInput.fill("2026-12-25");

    // Wait for candidate slot cards to appear
    const availableSlotCard = studentPage.getByText("ว่างสำหรับจอง").first();
    await expect(availableSlotCard).toBeVisible({ timeout: 10000 });
    await availableSlotCard.click();

    // Step 6.3: Click Next to Confirmation
    const nextBtnStep2 = studentPage.getByRole("button", {
      name: /ถัดไป: ตรวจสอบและยืนยัน/,
    });
    await expect(nextBtnStep2).toBeVisible();
    await nextBtnStep2.click();

    // Step 6.4: Confirm and Submit Booking Request
    const submitBookingBtn = studentPage.getByRole("button", {
      name: /ยืนยันการยื่นคำขอจองสอบ/,
    });
    await expect(submitBookingBtn).toBeVisible();
    await submitBookingBtn.click();

    // Expect status badge indicating Pending Review (Provisional Hold active)
    await expect(
      studentPage.getByText(/รอการตรวจสอบ|รอเจ้าหน้าที่ตรวจสอบ/).first()
    ).toBeVisible({ timeout: 10000 });

    // -------------------------------------------------------------
    // Step 7: Academic Staff reviews and confirms the booking
    // -------------------------------------------------------------
    await staffPage.goto("/academic/examination-bookings");
    await expect(staffPage.getByText(projectTitle)).toBeVisible();

    const confirmBtn = staffPage
      .getByRole("button", { name: "ยืนยันการจอง" })
      .first();
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Confirm in dialog
    const modalConfirmBtn = staffPage
      .getByRole("button", { name: "ยืนยันการจอง" })
      .last();
    await modalConfirmBtn.click();

    // Switch to confirmed tab or check confirmed counter
    await staffPage.getByRole("tab", { name: /ยืนยันแล้ว/ }).click();
    await expect(staffPage.getByText(projectTitle)).toBeVisible();

    // -------------------------------------------------------------
    // Step 8: Student and Faculty see confirmed schedule & Calendar
    // -------------------------------------------------------------
    await studentPage.goto(`/projects/${projectId}/examination-booking`);
    await expect(studentPage.getByText("ยืนยันการจองสอบแล้ว")).toBeVisible();

    await studentPage.goto("/academic/examination-calendar");
    await expect(
      studentPage.getByRole("heading", {
        name: "ปฏิทินตารางสอบวิทยานิพนธ์และโครงงาน",
      })
    ).toBeVisible();

    // -------------------------------------------------------------
    // Step 9: Authorized Staff cancels booking to release resources
    // -------------------------------------------------------------
    await staffPage.goto("/academic/examination-bookings?tab=confirmed");
    const cancelBtn = staffPage
      .getByRole("button", { name: "ยกเลิกกำหนดการสอบ" })
      .first();
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    await staffPage
      .getByLabel(/เหตุผลการขอยกเลิก/)
      .fill("ยกเลิกผ่านการทดสอบ E2E เพื่อคืนสิทธิ์ห้องสอบ");
    await staffPage.getByRole("button", { name: "ยืนยันการยกเลิก" }).click();

    // Verify hold released in rejected/cancelled tab
    await staffPage.getByRole("tab", { name: /ปฏิเสธ \/ ยกเลิก/ }).click();
    await expect(staffPage.getByText(projectTitle)).toBeVisible();

    await studentContext.close();
    await facultyContext.close();
    await staffContext.close();
  });
});
