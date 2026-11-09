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
import Link from "next/link";
import {
  CheckCircle2,
  ShieldCheck,
  Database,
  Layers,
  Sparkles,
  LogIn,
  LayoutDashboard,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="bg-muted/10 flex min-h-screen flex-col items-center justify-center p-6 md:p-12">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="animate-in fade-in-50 w-full max-w-2xl space-y-6 duration-300">
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
                    Phase 1: ระบบยืนยันตัวตน บทบาทผู้ใช้ และข้อมูลหลักวิชาการ
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    Authentication (Better Auth), Role-Based Access Control,
                    Academic Master Data CRUD พร้อมใช้งานแล้ว
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="border-border bg-card flex items-start gap-3 rounded-md border p-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600 dark:text-zinc-400" />
                <div>
                  <p className="text-foreground font-medium">4 System Roles</p>
                  <p className="text-muted-foreground text-xs">
                    ผู้ดูแลระบบ, เจ้าหน้าที่วิชาการ, อาจารย์, นักศึกษา
                  </p>
                </div>
              </div>

              <div className="border-border bg-card flex items-start gap-3 rounded-md border p-3">
                <Database className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600 dark:text-zinc-400" />
                <div>
                  <p className="text-foreground font-medium">
                    Academic Master Data
                  </p>
                  <p className="text-muted-foreground text-xs">
                    ปีการศึกษา, ภาคการศึกษา, หลักสูตร, ห้องสอบ
                  </p>
                </div>
              </div>

              <div className="border-border bg-card flex items-start gap-3 rounded-md border p-3">
                <Layers className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600 dark:text-zinc-400" />
                <div>
                  <p className="text-foreground font-medium">
                    Role-Based Dashboard
                  </p>
                  <p className="text-muted-foreground text-xs">
                    แดชบอร์ดแยกตามบทบาทและภารกิจการใช้งานจริง
                  </p>
                </div>
              </div>

              <div className="border-border bg-card flex items-start gap-3 rounded-md border p-3">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600 dark:text-zinc-400" />
                <div>
                  <p className="text-foreground font-medium">
                    Zinc Visual Identity
                  </p>
                  <p className="text-muted-foreground text-xs">
                    รองรับ Light / Dark Mode ผ่าน Semantic OKLCH Tokens
                  </p>
                </div>
              </div>
            </div>

            <div className="text-muted-foreground border-border flex flex-col items-center justify-between gap-4 border-t pt-4 text-xs sm:flex-row">
              <span>ภาษาเอกสารและการแสดงผล: ภาษาไทย (ฟอนต์ Sarabun)</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link href="/login" className="gap-2">
                    <LogIn className="h-4 w-4" />
                    เข้าสู่ระบบ
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/dashboard" className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    แดชบอร์ด
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
