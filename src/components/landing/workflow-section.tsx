import * as React from "react";
import {
  FileEdit,
  UserCheck,
  ClipboardList,
  CalendarCheck,
  CheckCircle2,
} from "lucide-react";

export function WorkflowSection() {
  const steps = [
    {
      number: "01",
      icon: FileEdit,
      title: "ลงทะเบียนข้อมูลโครงงาน",
      description:
        "นักศึกษาบันทึกหัวข้อภาษาไทยและอังกฤษ ร่างบทคัดย่อ และเชิญเพื่อนร่วมกลุ่มเข้าร่วมโครงงาน",
      roleBadge: "นักศึกษา",
    },
    {
      number: "02",
      icon: UserCheck,
      title: "ประสานงานอาจารย์ที่ปรึกษา",
      description:
        "ส่งคำขอเป็นที่ปรึกษาผ่านระบบ อาจารย์เข้าตรวจสอบรายละเอียดและกดตอบรับการดูแลโครงงาน",
      roleBadge: "อาจารย์ที่ปรึกษา",
    },
    {
      number: "03",
      icon: ClipboardList,
      title: "ส่งคำขอและรอการพิจารณา",
      description:
        "ยื่นขออนุมัติโครงงาน เจ้าหน้าที่วิชาการตรวจสอบความถูกต้องและดำเนินการแต่งตั้งคณะกรรมการสอบ",
      roleBadge: "เจ้าหน้าที่วิชาการ",
    },
    {
      number: "04",
      icon: CalendarCheck,
      title: "เลือกวัน เวลา และห้องสอบ",
      description:
        "นักศึกษาเลือกช่วงวันและห้องสอบที่ผ่านการตรวจสอบความพร้อมของอาจารย์และห้องสอบแล้ว",
      roleBadge: "ระบบอัตโนมัติ",
    },
    {
      number: "05",
      icon: CheckCircle2,
      title: "ติดตามผลการยืนยันกำหนดการ",
      description:
        "เจ้าหน้าที่ยืนยันการจอง ตารางสอบจะปรากฏในปฏิทินสอบของทุกฝ่ายที่เกี่ยวข้องโดยอัตโนมัติ",
      roleBadge: "ทุกฝ่ายที่เกี่ยวข้อง",
    },
  ];

  return (
    <section
      id="workflow"
      aria-labelledby="workflow-heading"
      className="bg-background border-border/60 border-t py-20 sm:py-28"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            กระบวนการทำงาน
          </span>
          <h2
            id="workflow-heading"
            className="font-heading text-foreground mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
          >
            เริ่มต้นใช้งานได้ในไม่กี่ขั้นตอน
          </h2>
          <p className="text-muted-foreground mt-4 text-base sm:text-lg">
            ขั้นตอนการดำเนินงานที่ชัดเจนและสอดคล้องกับบทบาทหน้าที่
            ช่วยลดขั้นตอนเอกสารและการประสานงานที่ซ้ำซ้อน
          </p>
        </div>

        {/* Steps Timeline Grid */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-5 lg:gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="border-border/70 bg-card hover:border-border relative flex flex-col rounded-xl border p-5 shadow-xs transition-all hover:shadow-sm"
              >
                {/* Step indicator */}
                <div className="border-border/50 mb-4 flex items-center justify-between border-b pb-3">
                  <span className="font-mono text-2xl font-black text-zinc-300 dark:text-zinc-700">
                    {step.number}
                  </span>
                  <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-medium">
                    {step.roleBadge}
                  </span>
                </div>

                {/* Icon & Title */}
                <div className="mb-2 flex items-center gap-2">
                  <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-heading text-foreground text-base leading-snug font-semibold">
                    {step.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-muted-foreground mt-2 flex-1 text-xs leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
