import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

// Mock getCurrentSession
vi.mock("@/lib/auth-guards", () => ({
  getCurrentSession: vi.fn().mockResolvedValue(null),
}));

describe("HomePage Landing Page Verification", () => {
  it("renders ThesisSlot title and Thai academic headline correctly", async () => {
    const pageComponent = await HomePage();
    render(pageComponent);

    // H1 Heading
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /จัดการการสอบโครงงานและวิทยานิพนธ์ อย่างเป็นระบบในที่เดียว/,
      })
    ).toBeInTheDocument();

    // Wordmark
    expect(screen.getAllByText("ThesisSlot").length).toBeGreaterThan(0);
  });

  it("renders core feature sections and workflows without crashing", async () => {
    const pageComponent = await HomePage();
    render(pageComponent);

    // Feature highlights
    expect(
      screen.getByRole("heading", {
        name: "ครบทุกขั้นตอนของการจัดการสอบ",
      })
    ).toBeInTheDocument();

    // Workflow steps
    expect(
      screen.getByRole("heading", {
        name: "เริ่มต้นใช้งานได้ในไม่กี่ขั้นตอน",
      })
    ).toBeInTheDocument();

    // Roles section
    expect(
      screen.getByRole("heading", {
        name: "ออกแบบสำหรับทุกบทบาทในกระบวนการสอบ",
      })
    ).toBeInTheDocument();

    // CTA
    expect(
      screen.getByRole("heading", {
        name: "พร้อมเริ่มจัดการการสอบอย่างเป็นระบบ",
      })
    ).toBeInTheDocument();

    // Login Link
    const loginLinks = screen.getAllByRole("link", {
      name: /เข้าสู่ระบบ/i,
    });
    expect(loginLinks.length).toBeGreaterThan(0);
  });
});
