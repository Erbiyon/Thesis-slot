import { requireAuth } from "@/lib/auth-guards";
import prisma from "@/lib/prisma";
import { ROLE_LABELS_TH } from "@/lib/permissions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "./profile-form";
import { User, Shield } from "lucide-react";

export default async function ProfilePage() {
  const { user, role } = await requireAuth();

  const [dbUser, programs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      include: {
        studentProfile: {
          include: { academicProgram: true },
        },
        facultyProfile: true,
      },
    }),
    prisma.academicProgram.findMany({
      where: { isActive: true },
      orderBy: { nameTh: "asc" },
    }),
  ]);

  if (!dbUser) {
    return <div>ไม่พบข้อมูลผู้ใช้งาน</div>;
  }

  return (
    <div className="animate-in fade-in-50 max-w-3xl space-y-6 duration-300">
      <div className="border-border border-b pb-4">
        <h1 className="text-foreground flex items-center gap-2 text-2xl font-bold tracking-tight">
          <User className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
          ข้อมูลส่วนตัว (User Profile)
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          ตรวจสอบและแก้ไขข้อมูลส่วนตัวที่ได้รับอนุญาตสำหรับใช้งานในระบบ
          ThesisSlot
        </p>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">ข้อมูลบัญชีผู้ใช้งาน</CardTitle>
              <CardDescription>
                ระดับสิทธิ์และอีเมลสถาบันไม่สามารถเปลี่ยนแปลงได้ด้วยตนเอง
              </CardDescription>
            </div>
            <Badge variant="outline" className="gap-1 font-medium">
              <Shield className="h-3.5 w-3.5" />
              {ROLE_LABELS_TH[role]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ProfileForm user={dbUser} role={role} programs={programs} />
        </CardContent>
      </Card>
    </div>
  );
}
