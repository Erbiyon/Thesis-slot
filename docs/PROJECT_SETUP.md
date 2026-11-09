# โครงสร้างโครงการและการติดตั้งเริ่มต้น (ThesisSlot Setup Guide)

เอกสารนี้สรุปขั้นตอน โครงสร้าง และการตั้งค่าพื้นฐานของระบบ **ThesisSlot (ระบบจองสอบโครงงานและวิทยานิพนธ์)**

---

## 1. ภาพรวมสแต็กเทคโนโลยี (Technology Stack)

- **Framework:** Next.js 16 (App Router, Turbopack)
- **UI & Styling:** Tailwind CSS 4, shadcn/ui (Zinc Authentic Theme, CSS Variables, Radix UI Primitives)
- **Runtime & Package Manager:** Node.js 24 LTS, pnpm v11
- **Language:** TypeScript 5 (Strict Mode)
- **Database ORM:** Prisma 7 + `@prisma/adapter-mariadb` (Driver Adapter สำหรับ MySQL 8.0)
- **Authentication:** Better Auth (Official Prisma Adapter)
- **State & Data Fetching:** TanStack React Query v5
- **Form & Validation:** React Hook Form, Zod v4, `@hookform/resolvers`
- **Tables & Date Utilities:** TanStack Table v9, date-fns v4, date-fns-tz v3
- **Testing:** Vitest (Unit / Smoke Tests), Testing Library, Playwright (E2E Chromium)
- **Code Quality:** ESLint Flat Config, Prettier + `prettier-plugin-tailwindcss`

---

## 2. โครงสร้างไดเรกทอรี (Directory Structure)

```text
thesis-slot/
├── prisma/
│   └── schema.prisma         # โครงสร้าง Schema สำหรับ Prisma 7 (MySQL)
├── prisma7.config.ts         # การกำหนดค่า Prisma 7 Config
├── public/                   # Static assets
├── e2e/                      # Playwright E2E Tests
│   └── smoke.spec.ts
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/auth/[...all] # Better Auth Next.js API Route Handler
│   │   ├── globals.css       # Semantic tokens สำหรับ Zinc Theme (Light/Dark)
│   │   ├── layout.tsx        # Root Layout พร้อมภาษาไทยและฟอนต์ Sarabun
│   │   ├── page.tsx          # หน้าตรวจสอบสถานะโครงสร้างเริ่มต้น
│   │   └── page.test.tsx     # Smoke test ด้วย Vitest
│   ├── components/           # UI Components
│   │   ├── ui/               # shadcn/ui components (button, card, badge, sonner)
│   │   └── theme-toggle.tsx  # ปุ่มสลับโหมด Light / Dark
│   ├── features/             # Business Features (สงวนไว้สำหรับการพัฒนาขั้นตอนต่อไป)
│   ├── hooks/                # Custom React Hooks
│   ├── lib/                  # Shared utilities (prisma, auth, env, utils)
│   ├── providers/            # Shared providers (Theme, Query, Toast)
│   ├── test/                 # Test setup (jsdom matchMedia mocks)
│   └── types/                # Shared TypeScript definitions
├── docs/                     # คู่มือและเอกสารโครงการ
├── .env.example              # ตัวอย่างตัวแปร Environment ปลอดภัย
├── components.json           # การตั้งค่า shadcn/ui
├── eslint.config.mjs         # ESLint Flat Configuration
├── next.config.ts            # Next.js Configuration
├── package.json              # กำหนด packageManager (pnpm) และ scripts
├── playwright.config.ts      # Playwright Configuration
├── tsconfig.json             # TypeScript Strict Configuration
└── vitest.config.ts          # Vitest Configuration
```

---

## 3. การเตรียม Environment และ Database

1. คัดลอก `.env.example` ไปเป็น `.env`:
   ```bash
   cp .env.example .env
   ```
2. แก้ไขค่าการเชื่อมต่อ MySQL ใน `.env` (ฐานข้อมูลเป้าหมาย: `thesis_slot_dev`):
   ```env
   DATABASE_URL="mysql://root:password@localhost:3306/thesis_slot_dev"
   BETTER_AUTH_SECRET="secure_random_generated_secret"
   BETTER_AUTH_URL="http://localhost:3000"
   ```
   > ⚠️ **ข้อควรระวัง:** ไม่เชื่อมต่อกับฐานข้อมูล `timetable_db` หรือ `timetable_e2e` ของระบบ cpetak-timetable อย่างเด็ดขาด

---

## 4. คำสั่งสำหรับนักพัฒนา (Development Scripts)

ทุกคำสั่งใช้งานผ่าน **pnpm** เท่านั้น:

- **เริ่มรันเซิร์ฟเวอร์พัฒนา:** `pnpm dev`
- **ตรวจสอบ Type:** `pnpm run typecheck`
- **ตรวจสอบ Lint:** `pnpm run lint`
- **รัน Unit / Smoke Test:** `pnpm run test:run`
- **รัน E2E Smoke Test:** `pnpm run test:e2e`
- **ตรวจสอบฟอร์แมตโค้ด:** `pnpm run format:check`
- **จัดฟอร์แมตโค้ด:** `pnpm run format`
- **คอมไพล์โปรดักชันบิลด์:** `pnpm run build`
- **ตรวจสอบ Prisma Schema:** `pnpm run db:validate`
- **สร้าง Prisma Client:** `pnpm run db:generate`

---

## 5. สถานะระบบและข้อจำกัดปัจจุบัน (Current Boundaries)

- โครงการอยู่ในสถานะ **Project Initialization & Foundation Setup เท่านั้น**
- **สิ่งที่ยังไม่ได้ดำเนินการ (ตามขอบเขตความปลอดภัย):**
  - ยังไม่มีโมเดลฐานข้อมูลของระบบจองสอบ (Student, Teacher, Examination, Slot, Room)
  - ยังไม่มีฟังก์ชันการจอง การจับคู่อาจารย์ หรือการอนุมัติใดๆ
  - ยังไม่มีหน้าจอล็อกอิน หรือลงทะเบียนจริง
  - ไม่มีการส่งข้อมูลขึ้น GitHub หรือ Remote Repository

