import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductPreview } from "./product-preview";
import { ArrowRight, CheckCircle2 } from "lucide-react";

interface HeroSectionProps {
  isAuthenticated: boolean;
}

export function HeroSection({ isAuthenticated }: HeroSectionProps) {
  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 lg:pt-24 lg:pb-32"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Text & Actions (7 cols) */}
          <div className="flex flex-col items-start space-y-6 lg:col-span-7">
            {/* Eyebrow badge */}
            <Badge
              variant="outline"
              className="border-border/80 bg-muted/30 text-muted-foreground gap-2 px-3.5 py-1 text-xs font-medium"
            >
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              ระบบบริหารจัดการการสอบวิทยานิพนธ์และโครงงานครบวงจร
            </Badge>

            {/* Main Thai H1 */}
            <h1
              id="hero-heading"
              className="font-heading text-foreground text-3xl font-extrabold tracking-tight text-balance sm:text-4xl md:text-5xl lg:text-6xl"
            >
              จัดการการสอบโครงงานและวิทยานิพนธ์{" "}
              <span className="text-zinc-500 dark:text-zinc-400">
                อย่างเป็นระบบในที่เดียว
              </span>
            </h1>

            {/* Supporting paragraph */}
            <p className="text-muted-foreground text-base text-pretty sm:text-lg md:max-w-xl">
              ระบบบริหารจัดการการสอบสำหรับนักศึกษา อาจารย์ และเจ้าหน้าที่วิชาการ
              ตั้งแต่การลงทะเบียนหัวข้อโครงงาน การประสานงานอาจารย์ที่ปรึกษา
              ไปจนถึงการจองและติดตามกำหนดการสอบ
            </p>

            {/* CTA Buttons */}
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              {isAuthenticated ? (
                <Button
                  asChild
                  size="lg"
                  className="gap-2 text-base font-medium"
                >
                  <Link href="/dashboard">
                    เข้าสู่ระบบแดชบอร์ด
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button
                  asChild
                  size="lg"
                  className="gap-2 text-base font-medium"
                >
                  <Link href="/login">
                    เข้าสู่ระบบเพื่อเริ่มใช้งาน
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}

              <Button
                asChild
                variant="outline"
                size="lg"
                className="gap-2 text-base font-medium"
              >
                <Link href="#features">สำรวจความสามารถของระบบ</Link>
              </Button>
            </div>

            {/* Value pillars */}
            <div className="border-border/60 grid w-full grid-cols-1 gap-3 border-t pt-4 sm:grid-cols-3 sm:gap-4">
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>ป้องกันการชนของเวลาและห้องสอบ</span>
              </div>
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>ควบคุมสิทธิ์ตามบทบาทอย่างเข้มงวด</span>
              </div>
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>ติดตามสถานะกำหนดการแบบทันท่วงที</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Product Preview (5 cols) */}
          <div className="w-full lg:col-span-5">
            <ProductPreview />
          </div>
        </div>
      </div>
    </section>
  );
}
