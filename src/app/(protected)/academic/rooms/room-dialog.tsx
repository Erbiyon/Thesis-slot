"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createExaminationRoom, updateExaminationRoom } from "./actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface RoomDialogProps {
  room?: {
    id: string;
    code: string;
    nameTh: string;
    building?: string | null;
    floor?: string | null;
    capacity?: number | null;
    isActive: boolean;
  };
  trigger: React.ReactNode;
}

export function RoomDialog({ room, trigger }: RoomDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [code, setCode] = React.useState(room?.code || "");
  const [nameTh, setNameTh] = React.useState(room?.nameTh || "");
  const [building, setBuilding] = React.useState(room?.building || "");
  const [floor, setFloor] = React.useState(room?.floor || "");
  const [capacity, setCapacity] = React.useState(
    room?.capacity ? String(room.capacity) : ""
  );
  const [isActive, setIsActive] = React.useState(room ? room.isActive : true);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && room) {
      setCode(room.code);
      setNameTh(room.nameTh);
      setBuilding(room.building || "");
      setFloor(room.floor || "");
      setCapacity(room.capacity ? String(room.capacity) : "");
      setIsActive(room.isActive);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("code", code);
      formData.append("nameTh", nameTh);
      formData.append("building", building);
      formData.append("floor", floor);
      if (capacity) formData.append("capacity", capacity);
      formData.append("isActive", String(isActive));

      if (room) {
        await updateExaminationRoom(room.id, formData);
        toast.success("แก้ไขข้อมูลห้องสอบสำเร็จ");
      } else {
        await createExaminationRoom(formData);
        toast.success("เพิ่มห้องสอบสำเร็จ");
        setCode("");
        setNameTh("");
        setBuilding("");
        setFloor("");
        setCapacity("");
      }
      setOpen(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {room ? "แก้ไขข้อมูลห้องสอบ" : "เพิ่มห้องสอบใหม่"}
            </DialogTitle>
            <DialogDescription>
              ระบุรหัสห้องสอบ ชื่อห้อง อาคาร และความจุ
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="roomCode">รหัสห้องสอบ (Room Code)</Label>
              <Input
                id="roomCode"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="เช่น EN-401 หรือ LAB-COM1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roomName">ชื่อห้องสอบ (ภาษาไทย)</Label>
              <Input
                id="roomName"
                value={nameTh}
                onChange={(e) => setNameTh(e.target.value)}
                placeholder="เช่น ห้องสัมมนาภาควิชาวิศวกรรมคอมพิวเตอร์"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="building">อาคาร</Label>
                <Input
                  id="building"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  placeholder="เช่น อาคารวิศวกรรม 4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="floor">ชั้น</Label>
                <Input
                  id="floor"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="เช่น ชั้น 4"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">ความจุที่นั่ง (คน)</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="เช่น 30"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActiveRoom"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
              />
              <Label htmlFor="isActiveRoom" className="cursor-pointer text-sm">
                เปิดใช้งานในระบบ
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {room ? "บันทึกการแก้ไข" : "เพิ่มข้อมูล"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
