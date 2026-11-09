import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

// Mock getCurrentSession
vi.mock("@/lib/auth-guards", () => ({
  getCurrentSession: vi.fn().mockResolvedValue(null),
}));

describe("HomePage Verification", () => {
  it("renders ThesisSlot title and Thai description correctly", async () => {
    const pageComponent = await HomePage();
    render(pageComponent);
    expect(screen.getByText("ThesisSlot")).toBeInTheDocument();
    expect(
      screen.getByText("ระบบจองสอบโครงงานและวิทยานิพนธ์")
    ).toBeInTheDocument();
  });

  it("renders Phase 1 highlights without crashing", async () => {
    const pageComponent = await HomePage();
    render(pageComponent);
    expect(screen.getByText("4 System Roles")).toBeInTheDocument();
    expect(screen.getByText("Academic Master Data")).toBeInTheDocument();
    expect(screen.getByText("Role-Based Dashboard")).toBeInTheDocument();
  });
});
