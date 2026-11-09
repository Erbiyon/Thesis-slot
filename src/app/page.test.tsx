import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

describe("HomePage Verification", () => {
  it("renders ThesisSlot title and Thai description correctly", () => {
    render(<HomePage />);
    expect(screen.getByText("ThesisSlot")).toBeInTheDocument();
    expect(
      screen.getByText("ระบบจองสอบโครงงานและวิทยานิพนธ์")
    ).toBeInTheDocument();
    expect(
      screen.getByText("โครงสร้างโครงการพร้อมสำหรับการพัฒนา")
    ).toBeInTheDocument();
  });

  it("renders architecture highlights without crashing", () => {
    render(<HomePage />);
    expect(screen.getByText("Prisma 7 & MySQL")).toBeInTheDocument();
    expect(screen.getByText("Better Auth")).toBeInTheDocument();
    expect(screen.getByText("Zinc Visual Identity")).toBeInTheDocument();
  });
});
