# THESISSLOT — FINAL EXAMINATION CALENDAR ENHANCEMENT
## Examination Schedule & Booking Request Calendar (`/examination-calendar`)

> **สถานะโครงการ:** พัฒนาและตรวจสอบเสร็จสมบูรณ์ 100% พร้อมรวมเข้า GitHub `main`  
> **สาขา Git:** `feat/phase-4-final-booking-integration`  
> **วันเวลาที่ตรวจสอบ:** 9 พฤศจิกายน 2569  
> **กรอบเวลา (Timezone):** `Asia/Bangkok` (UTC+7)  
> **Design System:** Authentic shadcn/ui Zinc (Light & Dark Theme)

---

## 1. วัตถุประสงค์และภาพรวมฟังก์ชัน (Objective & Purpose)

การพัฒนายกระดับระบบปฏิทินสอบในส่วนเสริมนี้ มีเป้าหมายเพื่อให้ผู้ใช้งานทุกกลุ่ม (นิสิต, อาจารย์, เจ้าหน้าที่ภาควิชา, ผู้ดูแลระบบ) สามารถเปิดดูและทำความเข้าใจกำหนดการสอบได้อย่างชัดเจน รวดเร็ว และตอบคำถามสำคัญได้ทันที:
1. **มีการสอบในวันไหนบ้าง?** — มีตัวบ่งชี้และจำนวนการสอบในแต่ละช่องวันบนปฏิทินรายเดือนอย่างชัดเจน
2. **วันใดมีคำขอจองสอบรออนุมัติ?** — แสดงสถานะ `PENDING_REVIEW` ด้วยสีเหลืองทองอำพัน (Amber)
3. **วันใดมีการยืนยันกำหนดสอบแล้ว?** — แสดงสถานะ `CONFIRMED` ด้วยสีเขียวมรกต (Emerald)
4. **วันที่เลือกมีการสอบกี่รายการ?** — มี Badge สรุปจำนวนรายการประจำวันที่เลือก
5. **สอบเวลาใด ห้องไหน และโครงงานอะไร?** — มีแผงรายละเอียดประจำวัน (Selected Day Detail Panel) แจกแจงเวลาสอบ (HH:mm - HH:mm น.), ชื่อโครงงาน/วิทยานิพนธ์, ห้องสอบ, อาคาร, ชั้น และอาจารย์ที่ปรึกษา/กรรมการสอบ
6. **รายการใดเกี่ยวข้องกับตนเอง?** — มี Badge `เกี่ยวข้องกับคุณ` ไฮไลต์ให้เห็นชัดเจนสำหรับนิสิตที่เป็นเจ้าของโครงงานหรืออาจารย์ที่มีภาระหน้าที่ในการสอบนั้นๆ

---

## 2. เส้นทางและสถาปัตยกรรมมุมมอง (Implemented Views & Routes)

ระบบจัดเตรียม 2 มุมมองที่ส่งเสริมซึ่งกันและกันโดยไม่มีความซ้ำซ้อนของโค้ด:

| เส้นทาง (Route) | ประเภทมุมมอง | วัตถุประสงค์การใช้งาน | สิทธิ์การเข้าถึง |
| :--- | :--- | :--- | :--- |
| `/examination-calendar` | **ปฏิทินรายเดือน (Monthly Master View)** | แสดงภาพรวมทั้งเดือน สถิติ KPI รายเดือน ตัวกรองสถานะ/ห้องสอบ และคลิกดูรายละเอียดกำหนดการประจำวัน | ทุกบทบาท (STUDENT, FACULTY, ACADEMIC_STAFF, ADMIN) |
| `/academic/examination-calendar` | **ปฏิทินรายสัปดาห์ (Weekly Timetable View)** | แสดงตาราง 5 วันทำการ (จันทร์-ศุกร์) แยกตามคอลัมน์ห้องสอบ เพื่อบริหารจัดการตารางรายสัปดาห์ | ทุกบทบาท (STUDENT, FACULTY, ACADEMIC_STAFF, ADMIN) |

มีปุ่มสลับมุมมองระหว่าง **"มุมมองรายสัปดาห์"** และ **"มุมมองรายเดือน"** ในส่วนหัวของทั้งสองหน้าอย่างราบรื่น

---

## 3. ความหมายและรหัสสีของสถานะการจองสอบ (Booking Status Semantics)

อ้างอิงจากฐานข้อมูล `ExaminationBooking` โดยตรง:
- **`CONFIRMED` (ยืนยันกำหนดสอบแล้ว):**
  - **แถบสีและสัญลักษณ์:** Emerald (เขียวมรกต) พร้อมไอคอน `CheckCircle2`
  - **ความหมาย:** เจ้าหน้าที่ภาควิชาได้ตรวจสอบและอนุมัติกำหนดการสอบเรียบร้อยแล้ว ห้องสอบและคณะกรรมการได้รับการจองอย่างสมบูรณ์
- **`PENDING_REVIEW` (รออนุมัติการจอง):**
  - **แถบสีและสัญลักษณ์:** Amber (เหลืองทองอำพัน) พร้อมไอคอน `AlertCircle` / `Clock`
  - **ความหมาย:** นิสิตได้ยื่นคำขอจองสอบในวัน/เวลาดังกล่าว ระบบได้ทำการล็อคสำรองเวลาชั่วคราว (Provisional Hold) อยู่ระหว่างรอเจ้าหน้าที่ตรวจสอบ
- **`CANCELLED` / `REJECTED` (ยกเลิก / ปฏิเสธ):**
  - กรองออกจากปฏิทินนัดหมายหลักโดยอัตโนมัติ ไม่แสดงเป็นนัดหมายที่กำลังจะมาถึง เพื่อคืนเวลาให้ห้องสอบและอาจารย์ แต่ยังคงประวัติการยกเลิก/ปฏิเสธและเหตุผลไว้ใน `ExaminationBookingHistory` ครบถ้วน

---

## 4. การควบคุมสิทธิ์การมองเห็นตามบทบาทบน Server-Side (RBAC Scoping)

การกรองข้อมูลถูกควบคุมที่ฝั่งเซิร์ฟเวอร์อย่างเข้มงวดผ่าน `src/lib/calendar-service.ts` ป้องกันการส่งข้อมูลที่ไม่ได้รับอนุญาตมายังเบราว์เซอร์:
1. **STUDENT:** ดึงเฉพาะรายการสอบของโครงงานที่ตนเองเป็นผู้สร้าง หรือเป็นสมาชิกกลุ่มที่ได้รับการตอบรับแล้วเท่านั้น ไม่สามารถเห็นโครงงานของนิสิตกลุ่มอื่น
2. **FACULTY:** ดึงเฉพาะรายการสอบที่ตนเองมีสถานะเป็นอาจารย์ที่ปรึกษาที่ตอบรับแล้ว หรือเป็นกรรมการสอบที่ได้รับการแต่งตั้ง
3. **ACADEMIC_STAFF & ADMIN:** สามารถดูตารางสอบภาพรวมของทั้งสถาบันเพื่อบริหารจัดการห้องสอบและตารางสอบได้อย่างครบถ้วน

---

## 5. การจัดการกรอบเวลา (Asia/Bangkok Timezone & Boundaries)

- โครงการใช้ Timezone: `Asia/Bangkok` (UTC+7)
- ฟังก์ชัน `getBangkokDateKey(date)` คำนวณวันตามเวลาท้องถิ่นประเทศไทยอย่างแม่นยำ ป้องกันปัญหา Off-by-one วันคลาดเคลื่อน
- การค้นหาช่วงเดือน `getBangkokMonthGridUtcRange(year, month)` คำนวณครอบคลุมตั้งแต่วันจันทร์แรกของสัปดาห์ที่เริ่มเดือน จนถึงวันอาทิตย์สุดท้ายของสัปดาห์ที่สิ้นสุดเดือน
- วันที่แสดงบนปฏิทินยึดตาม `startAt` (วันและเวลาที่กำหนดให้มีการสอบจริง) ไม่ใช่วันที่ยื่นคำขอ (`createdAt`)

---

## 6. การเชื่อมโยงกับกระบวนการจองสอบและ Data Revalidation

เมื่อเกิดการเปลี่ยนแปลงสถานะใน `src/app/(protected)/projects/booking-actions.ts`:
- นิสิตยื่นคำขอจองสอบ (`requestExaminationBooking`)
- เจ้าหน้าที่อนุมัติหรือปฏิเสธคำขอ (`reviewExaminationBooking`)
- มีการขอเลื่อนวันเวลาสอบ (`rescheduleExaminationBooking`)
- มีการขอยกเลิกการสอบ (`cancelExaminationBooking`)

ระบบจะเรียกใช้ `revalidatePath("/examination-calendar")` และ `revalidatePath("/academic/examination-calendar")` ร่วมกับหน้ารายละเอียดโครงงานและ Dashboard ทันที ข้อมูลปฏิทินจึงเป็นปัจจุบันเสมอ

---

## 7. หลักฐานผลการทดสอบเชิงคุณภาพ (Quality Assurance Evidence)

### 7.1 Vitest Unit & Integration Tests (100% PASS)
- รันคำสั่ง `pnpm run test:run` ผ่านทั้งหมด **7 Test Suites / 41 Tests PASS**:
  - `src/lib/calendar-service.test.ts` (10/10 PASS ครอบคลุม Timezone, Month boundary, Role-based query, Pending/Confirmed/Cancelled/Rescheduled behavior)
  - `src/lib/phase4-concurrency.test.ts` (5/5 PASS ครอบคลุมการแย่งชิงทรัพยากรห้องและอาจารย์)
  - `src/lib/phase3.test.ts` (9/9 PASS High-Concurrency Stress Test 32 iterations / 64 requests)
  - `src/lib/phase2.test.ts` (5/5 PASS)
  - `src/lib/phase1.test.ts` (8/8 PASS)
  - `src/lib/db-connection.test.ts` (2/2 PASS)
  - `src/app/page.test.tsx` (2/2 PASS)

### 7.2 Playwright Browser E2E Tests (100% PASS)
- รันคำสั่ง `pnpm run test:e2e` ผ่านทั้งหมด **11 Test Suites / 11 Tests PASS**:
  - `e2e/examination-calendar.spec.ts` (ผ่านการทดสอบเปิดหน้าปฏิทิน, เปลี่ยนเดือน, สลับมุมมองรายสัปดาห์/รายเดือน, และคลิกดูรายละเอียดประจำวัน)
  - `e2e/examination-calendar-responsive.spec.ts` (ผ่านการทดสอบบน Viewport: 1920x1080 Desktop, 1366x768 Laptop, 390x844 Mobile)
  - `e2e/phase4-integration.spec.ts` (Full Authenticated Journey จองสอบ อนุมัติ และยกเลิก)
  - `e2e/phase1-regression.spec.ts`, `e2e/phase2.spec.ts`, `e2e/phase3.spec.ts`, `e2e/smoke.spec.ts`

### 7.3 TypeScript & Code Quality
- `pnpm run typecheck` (`tsc --noEmit`): **0 errors**
- `pnpm run lint` (`eslint`): **0 errors, 0 warnings**
- `pnpm run format:check` (`prettier --check .`): **All files formatted**
- `pnpm run build` (`next build` Turbopack 16.4.5): **22 static/dynamic routes compiled successfully**
- `prisma migrate status`: **3 migrations found, Database schema is up to date**

---

## 8. ไฟล์ภาพถ่ายหน้าจอที่บันทึกไว้ (Browser Screenshots)

1. `test-results/calendar-desktop-1080p.png` (Desktop 1920×1080)
2. `test-results/calendar-laptop-768p.png` (Laptop 1366×768)
3. `test-results/calendar-mobile-iphone.png` (Mobile 390×844)
