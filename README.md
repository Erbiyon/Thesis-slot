# ThesisSlot (ระบบจองสอบโครงงานและวิทยานิพนธ์)

ระบบจองสอบโครงงานและวิทยานิพนธ์ พัฒนาด้วยเทคโนโลยี Next.js 16 (App Router), Tailwind CSS 4, shadcn/ui (Zinc Theme), Prisma 7 (MySQL) และ Better Auth

---

## เอกสารโครงการ

- [คู่มือการตั้งค่าโครงการและการใช้งาน (Project Setup Guide)](docs/PROJECT_SETUP.md)

---

## การเริ่มต้นใช้งานด่วน (Quick Start)

### 1. ความต้องการของระบบ (Prerequisites)

- Node.js 24.x LTS
- pnpm (v11+)
- MySQL 8.0 (ฐานข้อมูลเป้าหมาย: `thesis_slot_dev`)

### 2. ติดตั้ง Dependencies

```bash
pnpm install
```

### 3. ตั้งค่าตัวแปรสภาพแวดล้อม (Environment Variables)

```bash
cp .env.example .env
```

### 4. ตรวจสอบโค้ดและการทดสอบ

```bash
pnpm run typecheck
pnpm run lint
pnpm run test:run
pnpm run test:e2e
pnpm run build
```

### 5. เริ่มรันระบบสำหรับพัฒนา

```bash
pnpm dev
```

เข้าชมหน้าเว็บได้ที่ `http://localhost:3000`
