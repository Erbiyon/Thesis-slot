import { requirePermission } from "@/lib/auth-guards";
import prisma from "@/lib/prisma";
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
import { RoomDialog } from "./room-dialog";
import { RoomStatusButton } from "./room-status-button";
import { DoorOpen, Plus } from "lucide-react";

export default async function ExaminationRoomsPage() {
  await requirePermission("academic:manage");

  const rooms = await prisma.examinationRoom.findMany({
    orderBy: { code: "asc" },
  });

  return (
    <div className="animate-in fade-in-50 space-y-6 duration-300">
      <div className="border-border flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground flex items-center gap-2 text-2xl font-bold tracking-tight">
            <DoorOpen className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
            การจัดการห้องสอบ (Examination Rooms)
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            ลงทะเบียนห้องสอบ อาคาร และความจุที่นั่ง
            เพื่อใช้เป็นสถานที่จัดสอบโครงงานและวิทยานิพนธ์
          </p>
        </div>

        <RoomDialog
          trigger={
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              เพิ่มห้องสอบ
            </Button>
          }
        />
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            รายชื่อห้องสอบทั้งหมด
          </CardTitle>
          <CardDescription>
            ห้องสอบที่เปิดใช้งานจะถูกนำไปใช้ในกระบวนการจัดตารางสอบในเฟสถัดไป
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">รหัสห้องสอบ</TableHead>
                <TableHead>ชื่อห้องสอบ</TableHead>
                <TableHead className="w-[160px]">อาคาร / ชั้น</TableHead>
                <TableHead className="w-[120px]">ความจุ (คน)</TableHead>
                <TableHead className="w-[130px]">สถานะ</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground h-28 text-center"
                  >
                    ยังไม่มีข้อมูลห้องสอบในระบบ กรุณาคลิกปุ่ม
                    &quot;เพิ่มห้องสอบ&quot;
                  </TableCell>
                </TableRow>
              ) : (
                rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="text-foreground font-mono text-xs font-semibold">
                      {room.code}
                    </TableCell>
                    <TableCell className="text-foreground font-medium">
                      {room.nameTh}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {room.building || "-"}
                      {room.floor ? ` (ชั้น ${room.floor})` : ""}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {room.capacity ? `${room.capacity} ที่นั่ง` : "-"}
                    </TableCell>
                    <TableCell>
                      {room.isActive ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-300 text-emerald-600 dark:border-emerald-800"
                        >
                          เปิดใช้งาน
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-zinc-300 text-zinc-500 dark:border-zinc-700"
                        >
                          ปิดใช้งาน
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <RoomDialog
                        room={room}
                        trigger={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs"
                          >
                            แก้ไข
                          </Button>
                        }
                      />
                      <RoomStatusButton
                        id={room.id}
                        currentStatus={room.isActive}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
