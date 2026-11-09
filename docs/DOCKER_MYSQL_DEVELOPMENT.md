# การเชื่อมต่อ MySQL Docker สำหรับการพัฒนาและทดสอบระบบอัตโนมัติ (ThesisSlot)

เอกสารนี้สรุปรายละเอียดการเชื่อมต่อระบบ **ThesisSlot** เข้ากับ **MySQL Server บน Docker** ที่เปิดใช้งานอยู่แล้วในเครื่องสำหรับสภาพแวดล้อมการพัฒนา (Development) และการทดสอบอัตโนมัติ (Automated Testing)

---

## 1. ข้อมูล Docker MySQL Container

- **Container Name:** `mysql-server`
- **Image:** `mysql:9.7.4` (MySQL Community Server - GPL)
- **Status:** Up / Healthy (Persistent storage ทำงานปกติ)
- **Container Port:** `3306/tcp`
- **Published Host Port:** `127.0.0.1:3306` (เชื่อมต่อจากเครื่อง Host Windows ด้วย IP `127.0.0.1`)

---

## 2. สถาปัตยกรรมฐานข้อมูล (Database Architecture)

ระบบแบ่งฐานข้อมูลออกเป็น 2 ส่วนอย่างเป็นอิสระต่อกัน เพื่อความปลอดภัยและความเสถียรของข้อมูล:

### 2.1 ฐานข้อมูลสำหรับการพัฒนา (Development Database)
- **Database Name:** `thesis_slot_dev`
- **Character Set / Collation:** `utf8mb4` / `utf8mb4_unicode_ci`
- **Dedicated User:** `thesis_dev`
- **วัตถุประสงค์:** รองรับการพัฒนาฟีเจอร์, Local Development และการรัน Next.js (`pnpm dev`)

### 2.2 ฐานข้อมูลสำหรับการทดสอบอัตโนมัติ (Automated Testing Database)
- **Database Name:** `thesis_slot_test`
- **Character Set / Collation:** `utf8mb4` / `utf8mb4_unicode_ci`
- **Dedicated User:** `thesis_test`
- **วัตถุประสงค์:** รองรับการรัน Database Integration Tests, Vitest (`pnpm test:run`) และ Playwright E2E

> 🛡️ **การคุ้มครองฐานข้อมูลของระบบอื่น:**
> ผู้ใช้ `thesis_dev` และ `thesis_test` มีสิทธิ์จำกัดเฉพาะฐานข้อมูลของ ThesisSlot เท่านั้น ถูกปฏิเสธสิทธิ์การเข้าถึง (`Access denied`) ฐานข้อมูล `timetable_db`, `timetable_e2e` และฐานข้อมูลของระบบอื่นทั้งหมด

---

## 3. การกำหนดค่าสภาพแวดล้อม (Environment Configuration)

### 3.1 Local Development (`.env.local`)
ไฟล์ `.env.local` ถูกกำหนดให้อยู่ใน `.gitignore` ไม่ถูก Commit ขึ้น Git:
```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
DATABASE_HOST="127.0.0.1"
DATABASE_PORT="3306"
DATABASE_NAME="thesis_slot_dev"
DATABASE_USER="thesis_dev"
DATABASE_URL="mysql://thesis_dev:******@127.0.0.1:3306/thesis_slot_dev"
BETTER_AUTH_SECRET="******"
BETTER_AUTH_URL="http://localhost:3000"
```

### 3.2 Automated Testing (`.env.test`)
ไฟล์ `.env.test` ถูกกำหนดให้อยู่ใน `.gitignore` เช่นกัน:
```env
NODE_ENV="test"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
DATABASE_HOST="127.0.0.1"
DATABASE_PORT="3306"
DATABASE_NAME="thesis_slot_test"
DATABASE_USER="thesis_test"
DATABASE_URL="mysql://thesis_test:******@127.0.0.1:3306/thesis_slot_test"
BETTER_AUTH_SECRET="******"
BETTER_AUTH_URL="http://localhost:3000"
```

---

## 4. กลไกความปลอดภัยในการทดสอบ (Test Database Isolation Guard)

จัดทำ Safety Guard Function ใน `src/lib/db-safety.ts`:
```typescript
assertTestDatabase();
```
- ตรวจสอบ `DATABASE_URL` ก่อนรันคำสั่งทดสอบฐานข้อมูลทุกครั้ง
- หาก URL ชี้ไปที่ `thesis_slot_dev`, `timetable_db`, `timetable_e2e` หรือฐานข้อมูลที่ไม่ได้ลงท้ายด้วย `thesis_slot_test` ระบบจะโยนข้อผิดพลาด `[DatabaseSafetyError]` และยกเลิกการทำงานทันที (Fail Closed) ป้องกันไม่ให้การรัน Test ทำลายหรือแก้ไขข้อมูลใน Development เด็ดขาด

---

## 5. การตั้งค่า Prisma 7 และ Driver Adapter

- **Prisma Client:** สร้างขึ้นผ่าน `@prisma/client@7.10.1`
- **Driver Adapter:** ใช้งาน `@prisma/adapter-mariadb` (`PrismaMariaDb`) เชื่อมต่อผ่าน connection pool ที่มีประสิทธิภาพสูงและรองรับ MySQL 8.0 / 9.x
- **Prisma Singleton:** กำหนดใน `src/lib/prisma.ts` เพื่อป้องกันปัญหา Next.js Development Server สร้าง connection เกินขีดจำกัดจาก Fast Refresh

---

## 6. คำสั่งสำหรับนักพัฒนา (Development & Testing Commands)

- **ทดสอบการเชื่อมต่อฐานข้อมูล Dev:**
  ```bash
  pnpm run db:test
  ```
- **รัน Database Integration Tests:**
  ```bash
  pnpm run test:integration
  ```
- **รัน Test Suite ทั้งหมด (Unit + DB):**
  ```bash
  pnpm run test:run
  ```
- **รัน Playwright E2E:**
  ```bash
  pnpm run test:e2e
  ```
- **ตรวจสอบความถูกต้องของ Prisma Schema:**
  ```bash
  pnpm run db:validate
  ```
- **สร้าง Prisma Client ใหม่:**
  ```bash
  pnpm run db:generate
  ```

---

## 7. ผลการทดสอบการเชื่อมต่อจริง (Verification Results)

- **Dev Connection:** รันคำสั่ง `SELECT 1, DATABASE()` ผ่าน `thesis_dev` สำเร็จ ได้ผลลัพธ์ฐานข้อมูลคือ `thesis_slot_dev`
- **Test Connection:** รันคำสั่ง `SELECT 1, DATABASE()` ผ่าน `thesis_test` สำเร็จ ได้ผลลัพธ์ฐานข้อมูลคือ `thesis_slot_test`
- **Vitest Database Tests:** ผ่าน 4/4 tests ครอบคลุมทั้งการสลับฐานข้อมูลและการทำงานของ Safety Guard
- **Playwright Smoke Test:** ผ่าน 1/1 test
- **TypeScript & ESLint:** ผ่านการตรวจสอบ 100% ไม่มีข้อผิดพลาด
- **Production Build (`pnpm run build`):** คอมไพล์ผ่านสมบูรณ์
