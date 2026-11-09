import * as React from "react";
import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-border/60 bg-muted/30 text-muted-foreground border-t py-12 text-sm">
      <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6 lg:px-8">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div>
            <div className="font-heading text-foreground leading-none font-bold">
              ThesisSlot
            </div>
            <div className="text-muted-foreground mt-0.5 text-xs">
              ระบบจองสอบโครงงานและวิทยานิพนธ์
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav
          aria-label="เมนูส่วนท้าย"
          className="flex flex-wrap items-center justify-center gap-6 text-xs"
        >
          <Link
            href="#hero"
            className="hover:text-foreground transition-colors"
          >
            หน้าแรก
          </Link>
          <Link
            href="#features"
            className="hover:text-foreground transition-colors"
          >
            ความสามารถของระบบ
          </Link>
          <Link
            href="#workflow"
            className="hover:text-foreground transition-colors"
          >
            ขั้นตอนการใช้งาน
          </Link>
          <Link
            href="#roles"
            className="hover:text-foreground transition-colors"
          >
            สำหรับผู้ใช้งาน
          </Link>
          <Link
            href="/login"
            className="hover:text-foreground text-foreground font-medium transition-colors"
          >
            เข้าสู่ระบบ
          </Link>
        </nav>

        {/* Copyright */}
        <div className="text-muted-foreground/80 text-xs">
          © {currentYear} ThesisSlot. สงวนลิขสิทธิ์ทั้งหมด
        </div>
      </div>
    </footer>
  );
}
