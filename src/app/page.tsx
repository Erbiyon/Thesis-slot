import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  CheckCircle2,
  ShieldCheck,
  Database,
  Layers,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-12">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-2xl space-y-6">
        <Card className="border-border shadow-sm">
          <CardHeader className="space-y-3 pb-4 text-center">
            <div className="flex justify-center">
              <Badge
                variant="outline"
                className="gap-1.5 px-3 py-1 text-xs font-medium"
              >
                <Sparkles className="h-3.5 w-3.5 text-zinc-500" />
                Next.js 16 • Tailwind CSS 4 • shadcn/ui Zinc
              </Badge>
            </div>
            <CardTitle className="text-foreground text-3xl font-bold tracking-tight">
              ThesisSlot
            </CardTitle>
            <CardDescription className="text-muted-foreground text-base">
              ระบบจองสอบโครงงานและวิทยานิพนธ์
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="border-border bg-muted/40 rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-foreground text-sm font-semibold">
                    โครงสร้างโครงการพร้อมสำหรับการพัฒนา
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    วางรากฐานระบบ สถาปัตยกรรมไดเรกทอรี
                    และชุดเครื่องมือหลักเสร็จสมบูรณ์
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="border-border flex items-start gap-3 rounded-md border p-3">
                <Database className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600 dark:text-zinc-400" />
                <div>
                  <p className="text-foreground font-medium">
                    Prisma 7 & MySQL
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Driver Adapter MariaDB พร้อมรองรับ migration
                  </p>
                </div>
              </div>

              <div className="border-border flex items-start gap-3 rounded-md border p-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600 dark:text-zinc-400" />
                <div>
                  <p className="text-foreground font-medium">Better Auth</p>
                  <p className="text-muted-foreground text-xs">
                    สถาปัตยกรรมยืนยันตัวตนระดับ Enterprise
                  </p>
                </div>
              </div>

              <div className="border-border flex items-start gap-3 rounded-md border p-3">
                <Layers className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600 dark:text-zinc-400" />
                <div>
                  <p className="text-foreground font-medium">
                    TanStack Query & Form
                  </p>
                  <p className="text-muted-foreground text-xs">
                    จัดการ Server State และ Form Validation ด้วย Zod
                  </p>
                </div>
              </div>

              <div className="border-border flex items-start gap-3 rounded-md border p-3">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600 dark:text-zinc-400" />
                <div>
                  <p className="text-foreground font-medium">
                    Zinc Visual Identity
                  </p>
                  <p className="text-muted-foreground text-xs">
                    รองรับ Light / Dark Mode ผ่าน Semantic CSS Variables
                  </p>
                </div>
              </div>
            </div>

            <div className="text-muted-foreground border-border flex flex-col items-center justify-between gap-4 border-t pt-2 text-xs sm:flex-row">
              <span>ภาษาเอกสารและการแสดงผล: ภาษาไทย (ฟอนต์ Sarabun)</span>
              <Button variant="secondary" size="sm" asChild>
                <a href="#setup-verified">ตรวจสอบระบบเรียบร้อย</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
