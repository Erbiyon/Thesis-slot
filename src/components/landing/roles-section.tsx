import * as React from "react";
import { GraduationCap, BookOpen, Briefcase, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function RolesSection() {
  const roles = [
    {
      title: "นักศึกษา",
      subtitle: "ผู้จัดทำโครงงานและวิทยานิพนธ์",
      icon: GraduationCap,
      badge: "Student",
      capabilities: [
        "ลงทะเบียนหัวข้อโครงงานและบันทึกแบบร่าง",
        "เชิญและจัดการสมาชิกในกลุ่มโครงงาน",
        "ยื่นขออาจารย์ที่ปรึกษาและติดตามผล",
        "เลือกวัน เวลา และห้องสอบผ่านระบบจองสอบ",
        "ติดตามกำหนดการสอบและข้อเสนอแนะจากภาควิชา",
      ],
    },
    {
      title: "อาจารย์",
      subtitle: "อาจารย์ที่ปรึกษาและคณะกรรมการสอบ",
      icon: BookOpen,
      badge: "Faculty",
      capabilities: [
        "พิจารณาตอบรับหรือปฏิเสธคำขอเป็นอาจารย์ที่ปรึกษา",
        "ตอบรับคำเชิญเข้าร่วมเป็นคณะกรรมการสอบ",
        "บันทึกช่วงเวลาไม่สะดวก (Unavailability) ล่วงหน้า",
        "ตรวจสอบตารางสอบและรายละเอียดโครงงานที่ตนเองกำกับดูแล",
        "ติดตามความก้าวหน้าและการนัดหมายการสอบของกลุ่มนิสิต",
      ],
    },
    {
      title: "เจ้าหน้าที่วิชาการ",
      subtitle: "ผู้กำกับดูแลและบริหารจัดการการสอบ",
      icon: Briefcase,
      badge: "Academic Staff",
      capabilities: [
        "ตรวจสอบและอนุมัติการลงทะเบียนโครงงานของนักศึกษา",
        "แต่งตั้งและจัดตั้งคณะกรรมการสอบตามระเบียบ",
        "ตรวจสอบและยืนยันคำขอจองวัน เวลา และห้องสอบ",
        "ตรวจสอบภาพรวมปฏิทินตารางสอบประจำเดือนและสัปดาห์",
        "จัดการการขอเลื่อนสอบหรือยกเลิกกำหนดการสอบอย่างเป็นระบบ",
      ],
    },
  ];

  return (
    <section
      id="roles"
      aria-labelledby="roles-heading"
      className="bg-muted/20 border-border/60 border-t py-20 sm:py-28"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            ความเหมาะสมตามบทบาท
          </span>
          <h2
            id="roles-heading"
            className="font-heading text-foreground mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
          >
            ออกแบบสำหรับทุกบทบาทในกระบวนการสอบ
          </h2>
          <p className="text-muted-foreground mt-4 text-base sm:text-lg">
            มอบประสบการณ์การทำงานที่ตรงกับภาระหน้าที่
            ช่วยให้แต่ละฝ่ายปฏิบัติภารกิจได้อย่างรวดเร็วและปลอดภัย
          </p>
        </div>

        {/* Roles 3-Column Grid */}
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {roles.map((role, idx) => {
            const Icon = role.icon;
            return (
              <Card
                key={idx}
                className="border-border/80 bg-card hover:border-border flex flex-col shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <CardHeader className="p-6 pb-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-900 text-zinc-50 shadow-sm dark:bg-zinc-100 dark:text-zinc-900">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {role.badge}
                    </Badge>
                  </div>
                  <CardTitle className="font-heading text-foreground text-xl font-bold">
                    {role.title}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground mt-1 text-xs">
                    {role.subtitle}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 p-6 pt-2">
                  <ul className="text-muted-foreground border-border/50 space-y-3 border-t pt-4 text-xs">
                    {role.capabilities.map((cap, cIdx) => (
                      <li key={cIdx} className="flex items-start gap-2.5">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span className="leading-snug">{cap}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
