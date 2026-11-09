# Phase 1: การยืนยันตัวตน, การควบคุมสิทธิ์ตามบทบาท และข้อมูลหลักวิชาการ
(Authentication, Role-Based Access Control, Academic Master Data & Role-Based Dashboard)

เอกสารฉบับนี้สรุปผลการพัฒนาสถาปัตยกรรมระบบใน **Phase 1** ของโครงการ **ThesisSlot (ระบบจองสอบโครงงานและวิทยานิพนธ์)**

---

## 1. วัตถุประสงค์หลักของ Phase 1

1. **Authentication & Session:** วางระบบยืนยันตัวตนด้วยอีเมล/รหัสผ่านผ่าน **Better Auth** ร่วมกับฐานข้อมูล MySQL บน Docker
2. **Role-Based Access Control (RBAC):** กำหนดและบังคับใช้ 4 บทบาทหลักของระบบ ทั้งในระดับ Server Components, Server Actions และ UI
3. **Academic Master Data CRUD:** พัฒนาระบบจัดการข้อมูลหลักทางวิชาการ (ปีการศึกษา, ภาคการศึกษา, หลักสูตร, ห้องสอบ)
4. **Role-Based Dashboard:** พัฒนาหน้าแดชบอร์ดเฉพาะสำหรับแต่ละบทบาท พร้อมแสดงข้อมูลเชิงสถิติตามสิทธิ์จริง (ไม่ใช้ข้อมูลจำลอง)
5. **Authentic shadcn/ui Zinc Theme:** ออกแบบ UI สอดคล้องกับหลักวิชาการ รองรับ Light / Dark Mode และภาษาไทยสมบูรณ์

---

## 2. บทบาทหน้าที่ในระบบ (User Roles) และตารางสิทธิ์ (Permission Matrix)

ระบบแบ่งออกเป็น 4 บทบาทหลัก:
- `ADMIN`: **ผู้ดูแลระบบ** — จัดการบัญชีผู้ใช้ กำหนดบทบาท ระงับการใช้งาน และเข้าถึงข้อมูลวิชาการ
- `ACADEMIC_STAFF`: **เจ้าหน้าที่วิชาการ** — จัดการปีการศึกษา ภาคเรียน หลักสูตร และห้องสอบ
- `FACULTY`: **อาจารย์** — เข้าถึงแดชบอร์ดอาจารย์ ดูข้อมูลอ้างอิงทางวิชาการ และแก้ไขข้อมูลส่วนตัว
- `STUDENT`: **นักศึกษา** — เข้าถึงแดชบอร์ดนักศึกษา ดูข้อมูลอ้างอิง และแก้ไขข้อมูลส่วนตัว/รหัสนักศึกษา

### ตารางสิทธิ์การเข้าถึง (Permission Matrix)
| สิทธิ์การใช้งาน (Permission) | ADMIN | ACADEMIC_STAFF | FACULTY | STUDENT |
| :--- | :---: | :---: | :---: | :---: |
| `admin:access` (เข้าถึงเมนูผู้ดูแลระบบ) | ✅ | ❌ | ❌ | ❌ |
| `users:manage` (สร้าง/เปลี่ยนสิทธิ์/ระงับบัญชี) | ✅ | ❌ | ❌ | ❌ |
| `academic:manage` (สร้าง/แก้ไข/เปิด-ปิดข้อมูลวิชาการ) | ✅ | ✅ | ❌ | ❌ |
| `academic:view` (ดูข้อมูลปีการศึกษา/หลักสูตร/ห้องสอบ) | ✅ | ✅ | ✅ | ✅ |
| `profile:view_self` / `profile:update_self` | ✅ | ✅ | ✅ | ✅ |

> 🛡️ **การปิดรับสมัครทั่วไป (Self-signup Disabled):**
> ปิดฟังก์ชันการลงทะเบียนทั่วไปใน Phase 1 เพื่อป้องกันไม่ให้ผู้ใช้ลงทะเบียนตนเองเป็น ADMIN หรือ ACADEMIC_STAFF

---

## 3. สถาปัตยกรรมโมเดลฐานข้อมูล (Prisma 7 Schema)

บันทึกประวัติการ Migrate ใน `prisma/migrations/20261109084615_init_auth_and_academic_master_data`:

### ตารางการยืนยันตัวตน (Better Auth)
- `user`: ตารางผู้ใช้งาน (id, name, email, role, banned, banReason, isActive)
- `session`: ข้อมูล Session การล็อกอิน (token, expiresAt, ipAddress, userAgent)
- `account`: ข้อมูลผู้ให้บริการ Auth และรหัสผ่านที่เข้ารหัสปลอดภัย
- `verification`: ข้อมูลโทเคนยืนยันตัวตน

### ตารางข้อมูลหลักวิชาการ (Academic Master Data)
- `academic_year`: ปีการศึกษา (id, yearLabel `UNIQUE`, isActive)
- `academic_term`: ภาคการศึกษา (id, academicYearId, termCode, nameTh, isActive) พร้อม Unique Constraint `(academicYearId, termCode)`
- `academic_program`: หลักสูตรการศึกษา (id, code `UNIQUE`, nameTh, nameEn, degree, isActive)
- `examination_room`: ห้องสอบ (id, code `UNIQUE`, nameTh, building, floor, capacity, isActive)
- `student_profile`: ข้อมูลเพิ่มเติมของนักศึกษา (userId `UNIQUE`, studentCode `UNIQUE`, academicProgramId)
- `faculty_profile`: ข้อมูลเพิ่มเติมของอาจารย์ (userId `UNIQUE`, staffCode `UNIQUE`, department, titleTh)

---

## 4. กลไกเริ่มต้นระบบสำหรับผู้ดูแลระบบ (First Admin Bootstrap)

จัดทำสคริปต์แบบระบุเจาะจง `scripts/bootstrap-admin.ts`:
```bash
pnpm exec tsx --env-file=.env.local scripts/bootstrap-admin.ts <email> <password> [name]
```
- ไม่อนุญาตให้รันซ้ำหากมีอีเมลนี้อยู่ในระบบแล้ว (Reject duplicate bootstrap)
- ใช้งานผ่าน Better Auth API เพื่อเข้ารหัสผ่านอย่างถูกต้อง ไม่ใช่การเขียนข้อมูลตรง

---

## 5. เส้นทางและหน้าจอการทำงาน (Routes & Pages)

- `/login`: หน้าเข้าสู่ระบบสถาบัน รองรับการแสดงผลข้อผิดพลาดและการแจ้งเตือนบัญชีถูกระงับ
- `/dashboard`: แดชบอร์ดตามบทบาท แสดงข้อมูลสถิติที่ดึงมาจากฐานข้อมูลจริง
- `/academic/years`: หน้าจัดการปีการศึกษา (List, Create, Edit, Toggle Active)
- `/academic/terms`: หน้าจัดการภาคการศึกษา (เชื่อมโยงปีการศึกษา, List, Create, Edit, Toggle Active)
- `/academic/programs`: หน้าจัดการหลักสูตร (List, Create, Edit, Toggle Active)
- `/academic/rooms`: หน้าจัดการห้องสอบ (List, Create, Edit, Toggle Active)
- `/admin/users`: หน้าจัดการผู้ใช้งาน (List, Create, Change Role, Suspend/Unsuspend) — เฉพาะ ADMIN
- `/profile`: หน้าดูและแก้ไขข้อมูลส่วนตัว (แก้ไขเฉพาะชื่อ/รหัสนักศึกษา/สังกัดตามบทบาท ไม่สามารถแก้สิทธิ์ตนเองได้)

---

## 6. สรุปผลการตรวจสอบทางเทคนิค (Verification Results)

- **TypeScript Compilation (`pnpm run typecheck`):** **PASS** (Strict Mode ไม่มีข้อผิดพลาด)
- **ESLint Check (`pnpm run lint`):** **PASS** (0 errors, 0 warnings)
- **Vitest Unit & Integration Tests (`pnpm run test:run`):** **PASS 12/12 tests**
  - Database connection test (2 tests)
  - Data integrity & Uniqueness constraints (4 tests)
  - Role-based authorization matrix (4 tests)
  - Page smoke test (2 tests)
- **Playwright E2E Tests (`pnpm run test:e2e`):** **PASS 2/2 tests** (รันบน Chromium)
- **Next.js Production Build (`pnpm run build`):** **PASS** (Static และ Dynamic routes คอมไพล์สมบูรณ์)

---

## 7. ขอบเขตที่สงวนไว้สำหรับ Phase ถัดไป (Intentionally Deferred)

- การลงทะเบียนโครงงานและหัวข้อวิทยานิพนธ์ (Project/Thesis Registration)
- การแต่งตั้งและจัดชุดกรรมการสอบ (Committee Composition)
- การเลือกช่วงเวลาว่างของอาจารย์ (Faculty Availability)
- การตรวจจับการจองห้องสอบชนกัน (Room Conflict Detection)
- ขั้นตอนการขออนุมัติการสอบ (Approval Workflow)
- การส่งอีเมลแจ้งเตือนภายนอก (Email Delivery Service Integration)
