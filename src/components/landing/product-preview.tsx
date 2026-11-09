import * as React from "react";
import { CalendarDays, Clock, MapPin, Users, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
      {/* Decorative ambient background blur */}
      <div
        className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-zinc-200 to-zinc-400 opacity-20 blur-xl dark:from-zinc-700 dark:to-zinc-900 dark:opacity-40"
        aria-hidden="true"
      />

      <div className="border-border/80 bg-card relative rounded-xl border p-4 shadow-xl backdrop-blur-sm sm:p-5">
        {/* Preview header bar */}
        <div className="border-border/60 mb-4 flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-md">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div>
              <div className="text-foreground text-xs font-semibold">
                ตัวอย่างกำหนดการสอบวิทยานิพนธ์
              </div>
              <div className="text-muted-foreground text-[10px]">
                ภาพประกอบฟังก์ชันการทำงานจริง
              </div>
            </div>
          </div>
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/10 text-[10px] font-medium text-emerald-700 dark:text-emerald-300"
          >
            <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            ยืนยันกำหนดสอบแล้ว
          </Badge>
        </div>

        {/* Project info card */}
        <div className="space-y-3">
          <div className="border-border/60 bg-muted/20 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-[11px] font-medium">
                หัวข้อวิทยานิพนธ์ (CPE-67-01)
              </span>
              <Badge variant="secondary" className="text-[10px]">
                วิทยานิพนธ์ ป.ตรี
              </Badge>
            </div>
            <div className="text-foreground mt-1 text-sm leading-snug font-semibold">
              ระบบตรวจสอบความปลอดภัยข้อมูลด้วยปัญญาประดิษฐ์ในเครือข่ายสถาบัน
            </div>
            <div className="text-muted-foreground mt-1 text-[11px] italic">
              AI-Powered Network Security Auditing Platform for Institutions
            </div>
          </div>

          {/* Time & Room Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="border-border/60 bg-card rounded-md border p-2.5">
              <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                <Clock className="text-primary h-3.5 w-3.5" />
                <span>วันและเวลาสอบ</span>
              </div>
              <div className="text-foreground mt-1 font-semibold">
                25 ธ.ค. 2569
              </div>
              <div className="text-muted-foreground font-mono text-[11px]">
                09:00 - 11:00 น.
              </div>
            </div>

            <div className="border-border/60 bg-card rounded-md border p-2.5">
              <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                <MapPin className="text-primary h-3.5 w-3.5" />
                <span>สถานที่และห้องสอบ</span>
              </div>
              <div className="text-foreground mt-1 font-semibold">
                ห้องสอบ EN-301
              </div>
              <div className="text-muted-foreground text-[11px]">
                อาคารวิจัย ชั้น 3
              </div>
            </div>
          </div>

          {/* Committee & Advisor Preview */}
          <div className="border-border/60 bg-card space-y-2 rounded-lg border p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-foreground flex items-center gap-1.5 font-medium">
                <Users className="text-muted-foreground h-3.5 w-3.5" />
                คณะกรรมการสอบและที่ปรึกษา
              </span>
              <span className="text-muted-foreground text-[10px]">
                พร้อมปฏิบัติหน้าที่
              </span>
            </div>

            <div className="space-y-1.5 pt-1 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">อาจารย์ที่ปรึกษา:</span>
                <span className="text-foreground font-medium">
                  รศ.ดร. ธนกฤต วิศวกรรม
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">ประธานกรรมการสอบ:</span>
                <span className="text-foreground font-medium">
                  ผศ.ดร. ภาณุพงศ์ ดาต้า
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  กรรมการผู้ทรงคุณวุฒิ:
                </span>
                <span className="text-foreground font-medium">
                  ดร. กฤษณา ปัญญาประดิษฐ์
                </span>
              </div>
            </div>
          </div>

          {/* Concurrency check indicator */}
          <div className="text-muted-foreground flex items-center justify-between rounded-md bg-zinc-900/5 px-2.5 py-1.5 text-[10px] dark:bg-zinc-100/5">
            <span className="text-foreground flex items-center gap-1.5 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              การตรวจสอบเวลาและห้องสอบ: ไม่มีข้อขัดแย้ง (Conflict-Free)
            </span>
            <span className="font-mono text-[9px] opacity-70">
              Prisma • MySQL
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
