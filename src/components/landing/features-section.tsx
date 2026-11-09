import * as React from "react";
import {
  FolderGit2,
  Users2,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function FeaturesSection() {
  const features = [
    {
      icon: FolderGit2,
      title: "ลงทะเบียนโครงงานและวิทยานิพนธ์",
      description:
        "สร้างและจัดการข้อมูลโครงงาน จัดการสมาชิกกลุ่ม จัดเก็บฉบับร่าง และยื่นเสนอหัวข้อเพื่อขอรับการพิจารณาจากภาควิชาอย่างเป็นระเบียบ",
      highlights: [
        "บันทึกแบบร่างโครงงานและแก้ไขได้ตลอดเวลา",
        "ระบบเชิญและตอบรับสมาชิกในกลุ่มโครงงาน",
        "ตรวจสอบความถูกต้องของข้อมูลก่อนส่งพิจารณา",
      ],
    },
    {
      icon: Users2,
      title: "ประสานงานอาจารย์และกรรมการสอบ",
      description:
        "ยื่นคำขออาจารย์ที่ปรึกษา ติดตามการตอบรับ พร้อมระบบแต่งตั้งคณะกรรมการสอบและจัดการช่วงเวลาว่าง/ไม่สะดวกของคณาจารย์",
      highlights: [
        "อาจารย์พิจารณาตอบรับหรือปฏิเสธคำขอได้สะดวก",
        "แต่งตั้งประธานและกรรมการสอบตามเกณฑ์หลักสูตร",
        "บันทึกช่วงเวลาไม่สะดวกของอาจารย์เพื่อเลี่ยงข้อขัดแย้ง",
      ],
    },
    {
      icon: CalendarCheck,
      title: "จองวัน เวลา และห้องสอบ",
      description:
        "ระบบคำนวณรอบสอบที่ว่างอัตโนมัติ ตรวจสอบความพร้อมของอาจารย์และห้องสอบพร้อมกัน และป้องกันการชนของตารางสอบ 100%",
      highlights: [
        "ระบบสำรองรอบสอบชั่วคราว (Provisional Hold)",
        "ป้องกันปัญหาการจองซ้ำซ้อน (Double Booking Protection)",
        "รองรับการขอเลื่อนสอบหรือยกเลิกพร้อมคืนสิทธิ์ห้องสอบ",
      ],
    },
    {
      icon: CalendarDays,
      title: "ติดตามสถานะและกำหนดการสอบ",
      description:
        "ปฏิทินสอบกลางทั้งมุมมองรายเดือนและรายสัปดาห์ แจ้งเตือนสถานะการอนุมัติ และตรวจสอบกำหนดการที่เกี่ยวข้องกับตนเองได้ทันที",
      highlights: [
        "ปฏิทินสอบรายเดือนและรายสัปดาห์ (Bangkok Timezone)",
        "แยกแยะชัดเจนระหว่างรายการรอตรวจสอบและยืนยันแล้ว",
        "กรองสิทธิ์การมองเห็นข้อมูลตามบทบาทผู้ใช้ (RBAC)",
      ],
    },
  ];

  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="border-border/60 bg-muted/20 border-t py-20 sm:py-28"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            ความสามารถหลักของระบบ
          </span>
          <h2
            id="features-heading"
            className="font-heading text-foreground mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
          >
            ครบทุกขั้นตอนของการจัดการสอบ
          </h2>
          <p className="text-muted-foreground mt-4 text-base sm:text-lg">
            ช่วยให้การประสานงานและดำเนินการสอบเป็นระบบมากขึ้น
            ตั้งแต่เริ่มต้นลงทะเบียนหัวข้อ จนถึงการยืนยันกำหนดการสอบขั้นสุดท้าย
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-8">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card
                key={idx}
                className="group border-border/80 bg-card hover:border-border relative overflow-hidden transition-all duration-200 hover:shadow-md"
              >
                <CardHeader className="p-6 pb-4">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-900 text-zinc-50 shadow-sm transition-transform group-hover:scale-105 dark:bg-zinc-100 dark:text-zinc-900">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="font-heading text-foreground text-xl font-bold">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <ul className="border-border/50 text-muted-foreground space-y-2 border-t pt-4 text-xs">
                    {item.highlights.map((hl, hlIdx) => (
                      <li key={hlIdx} className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>{hl}</span>
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
