import { requirePermission } from "@/lib/auth-guards";
import prisma from "@/lib/prisma";
import { ROLE_LABELS_TH, Role } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserDialog } from "./user-dialog";
import { UserSuspensionButton } from "./user-suspension-button";
import { UserRoleSelect } from "./user-role-select";
import { Users, Plus, ShieldCheck } from "lucide-react";

export default async function AdminUsersPage() {
  const { user: currentAdmin } = await requirePermission("users:manage");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      banned: true,
      banReason: true,
      createdAt: true,
    },
  });

  return (
    <div className="animate-in fade-in-50 space-y-6 duration-300">
      <div className="border-border flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Users className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
            การจัดการผู้ใช้งานในระบบ (User Management)
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            กำหนดบทบาทหน้าที่ (Roles), ตรวจสอบสถานะ
            และจัดการสิทธิ์การเข้าใช้งานของผู้ใช้
          </p>
        </div>

        <UserDialog
          trigger={
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              สร้างบัญชีผู้ใช้ใหม่
            </Button>
          }
        />
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            รายชื่อผู้ใช้งานทั้งหมด
          </CardTitle>
          <CardDescription>
            เฉพาะผู้ดูแลระบบ (ADMIN)
            เท่านั้นที่สามารถจัดการสิทธิ์และระงับการใช้งานบัญชีได้
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อ - นามสกุล</TableHead>
                <TableHead>อีเมลสถาบัน</TableHead>
                <TableHead className="w-[160px]">บทบาท (Role)</TableHead>
                <TableHead className="w-[140px]">สถานะบัญชี</TableHead>
                <TableHead className="w-[160px]">วันที่สร้าง</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const role = (u.role?.toUpperCase() || "STUDENT") as Role;
                const isSuspended = u.banned || !u.isActive;
                const isSelf = u.id === currentAdmin.id;

                return (
                  <TableRow key={u.id}>
                    <TableCell className="text-foreground font-semibold">
                      <div className="flex items-center gap-2">
                        {u.name}
                        {isSelf && (
                          <Badge
                            variant="outline"
                            className="px-1.5 py-0 text-[10px]"
                          >
                            บัญชีของคุณ
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {u.email}
                    </TableCell>
                    <TableCell>
                      {isSelf ? (
                        <Badge
                          variant="secondary"
                          className="gap-1 font-medium"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
                          {ROLE_LABELS_TH[role]}
                        </Badge>
                      ) : (
                        <UserRoleSelect userId={u.id} currentRole={role} />
                      )}
                    </TableCell>
                    <TableCell>
                      {isSuspended ? (
                        <Badge variant="destructive">ระงับการใช้งาน</Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-emerald-300 text-emerald-600 dark:border-emerald-800"
                        >
                          ปกติ
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(u.createdAt).toLocaleDateString("th-TH")}
                    </TableCell>
                    <TableCell className="text-right">
                      {!isSelf && (
                        <UserSuspensionButton
                          userId={u.id}
                          isSuspended={isSuspended}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
