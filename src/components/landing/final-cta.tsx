import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, LogIn, LayoutDashboard } from "lucide-react";

interface FinalCTAProps {
  isAuthenticated: boolean;
}

export function FinalCTA({ isAuthenticated }: FinalCTAProps) {
  return (
    <section className="border-border/60 bg-background relative overflow-hidden border-t py-20 sm:py-28">
      {/* Subtle background decoration */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 h-96 w-full max-w-7xl -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-zinc-200/30 to-zinc-400/30 blur-3xl dark:from-zinc-800/20 dark:to-zinc-900/20"
        aria-hidden="true"
      />

      <div className="relative container mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-heading text-foreground text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          พร้อมเริ่มจัดการการสอบอย่างเป็นระบบ
        </h2>
        <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-base sm:text-lg">
          เข้าสู่ระบบ ThesisSlot
          เพื่อดำเนินการตามบทบาทและสิทธิ์การใช้งานของสถาบันการศึกษาของคุณ
        </p>

        <div className="mt-8 flex justify-center">
          {isAuthenticated ? (
            <Button asChild size="lg" className="gap-2 text-base font-medium">
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                เข้าสู่แดชบอร์ดการทำงาน
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild size="lg" className="gap-2 text-base font-medium">
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                เข้าสู่ระบบ ThesisSlot
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
