"use client";

import * as React from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Menu, X, GraduationCap, LayoutDashboard, LogIn } from "lucide-react";

interface LandingHeaderProps {
  isAuthenticated: boolean;
}

export function LandingHeader({ isAuthenticated }: LandingHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { label: "หน้าแรก", href: "#hero" },
    { label: "ความสามารถของระบบ", href: "#features" },
    { label: "ขั้นตอนการใช้งาน", href: "#workflow" },
    { label: "สำหรับผู้ใช้งาน", href: "#roles" },
  ];

  return (
    <header className="border-border/60 bg-background/90 sticky top-0 z-50 w-full border-b backdrop-blur-md transition-colors">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          href="#hero"
          className="focus-visible:ring-ring flex items-center gap-2.5 transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-zinc-50 shadow-sm dark:bg-zinc-100 dark:text-zinc-900">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-foreground text-lg leading-none font-bold tracking-tight">
              ThesisSlot
            </span>
            <span className="text-muted-foreground text-[10px] font-medium">
              ระบบจองสอบโครงงานและวิทยานิพนธ์
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav
          aria-label="เมนูหลัก"
          className="hidden items-center gap-1 text-sm font-medium md:flex lg:gap-2"
        >
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 focus-visible:ring-ring rounded-md px-3 py-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Action Controls (Desktop) */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {isAuthenticated ? (
            <Button asChild size="sm" className="gap-2 font-medium">
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                เข้าสู่ระบบแดชบอร์ด
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" className="gap-2 font-medium">
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                เข้าสู่ระบบ
              </Link>
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "ปิดเมนู" : "เปิดเมนูหลัก"}
            className="text-foreground h-9 w-9"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-border bg-background animate-in slide-in-from-top-2 border-b px-4 py-4 duration-200 md:hidden">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <div className="border-border/50 border-t pt-2">
              {isAuthenticated ? (
                <Button asChild className="w-full justify-center gap-2">
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    เข้าสู่ระบบแดชบอร์ด
                  </Link>
                </Button>
              ) : (
                <Button asChild className="w-full justify-center gap-2">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <LogIn className="h-4 w-4" />
                    เข้าสู่ระบบ
                  </Link>
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
