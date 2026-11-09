# THESISSLOT — PHASE 3: EXAMINATION COMMITTEE, AVAILABILITY & CONCURRENCY-SAFE BOOKING ENGINE

**Date:** 2026-11-09  
**Branch:** `feat/phase-3-examination-booking-engine`  
**Base Commit:** `c8592af` (Phase 2 Baseline)  
**Database:** MySQL 9.7.4 (Docker `mysql-server`)  
**Development DB:** `thesis_slot_dev`  
**Test DB:** `thesis_slot_test`

---

## 1. Executive Summary

Phase 3 delivers the complete examination booking engine for ThesisSlot, transforming approved projects and theses into scheduled examinations with room and faculty conflict prevention, explicit faculty availability management, committee appointment workflows, and row-locked concurrency guarantees.

All 12 requirements outlined in the Phase 3 specification have been fully implemented, rigorously verified by both concurrency stress tests and browser E2E suites, and formatted to production standards.

---

## 2. Core Capabilities Delivered

### 2.1 Examination Committee Assignment & Response Workflow

- **Staff Workspace:** `/academic/examination-committees` allows Academic Staff and Administrators to appoint examination committee members (Chair, Committee Member, External Specialist) for approved academic projects.
- **Faculty Interface:** `/faculty/committee-invitations` allows faculty members to review pending appointments, inspect group details and advisors, and accept or decline with optional reasoning.
- **Enums & Schema:** `ExaminationCommitteeMember` model with `CommitteeResponsibility` and `CommitteeInvitationStatus`.

### 2.2 Faculty Availability Management

- **Faculty Workspace:** `/faculty/availability` allows faculty members to declare explicit windows of availability or unavailability (e.g. conference, teaching duty, personal leave) with custom notes.
- **Conflict Integration:** Unavailable intervals automatically block student bookings when calculating candidate examination slots or when validating booking requests.

### 2.3 Candidate Examination Slot Generator

- **Algorithm (`src/lib/slot-calculator.ts`):** Evaluates 2-hour standard examination slots (09:00-11:00, 11:00-13:00, 13:30-15:30, 15:30-17:30) for workdays within the active academic term.
- **Collision Checking:** Computes room occupancy and intersecting faculty commitments (both advisor responsibilities and accepted committee roles, plus explicit unavailable windows). Only conflict-free slots are marked available.

### 2.4 Multi-Step Student Booking Wizard

- **Route:** `/projects/[id]/examination-booking` (accessible only for `APPROVED` projects by the project leader).
- **Step 1 — Date Selection:** Date picker restricted to future weekdays within the term.
- **Step 2 — Slot & Room Selection:** Visual candidate slot cards indicating start/end time, room name/capacity, and conflict diagnostics if unavailable.
- **Step 3 — Confirmation & Submission:** Summary of participants, room, and chosen time with instant submission to the concurrency-safe engine.

### 2.5 Academic Staff Booking Review & Master Calendar

- **Bookings Workspace:** `/academic/examination-bookings` with real-time status counters and tabs (รอตรวจสอบ, ยืนยันแล้ว, ปฏิเสธ/ยกเลิก). Staff can confirm or reject (with mandatory reason) bookings.
- **Weekly Master Calendar:** `/academic/examination-calendar` displays a 5-day grid (Mon-Fri) detailing confirmed (emerald) and pending (amber) examination reservations per room, complete with week navigation and room summaries.

### 2.6 Concurrency-Safe Engine with Pessimistic Row Locking

- **Lock Management (`src/lib/booking-concurrency.ts`):** Creates/upserts dedicated rows in `scheduling_lock` with deterministic lexicographical key ordering (`room:ID`, `faculty:ID`, `project:ID`) to eliminate deadlocks.
- **Pessimistic Locking:** Issues `SELECT * FROM scheduling_lock WHERE lock_key IN (...) FOR UPDATE` within Prisma transactions.
- **Exponential Backoff & Jitter:** Automatically retries up to 4 times with randomized jitter if transient lock contention or MySQL deadlock (code 1213) occurs.
- **Provisional-Hold Policy:** Both `PENDING_REVIEW` and `CONFIRMED` statuses hold the room and faculty members against overlapping bookings. `REJECTED` or `CANCELLED` statuses immediately release the hold.

### 2.7 Rescheduling and Cancellation Workflows

- **Actions:** Project leaders or staff can reschedule an existing booking to a new conflict-free interval or cancel the booking entirely.
- **Audit History:** Every action (submit, confirm, reject, reschedule, cancel) is permanently appended to `examination_booking_history` with actor ID, status transition, timestamp, and details.

### 2.8 Navigation & Role Dashboards

- Added sidebar links for Examination Committees, Bookings, Calendar, Committee Invitations, and Availability.
- Upgraded `/dashboard` with dynamic counters for:
  - Students: active projects, revision notices, and examination calendar shortcuts.
  - Faculty: pending advisor requests, pending committee invitations, and availability management.
  - Academic Staff & Admin: pending project registrations, pending examination booking reviews, and active examinations in the system.

---

## 3. Verification & Quality Matrix

| Test Suite / Tool           | Command                     | Scope                                                                                                                                                                           | Result                              |
| :-------------------------- | :-------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :---------------------------------- |
| **TypeScript**              | `pnpm run typecheck`        | Strict compilation (`tsc --noEmit`)                                                                                                                                             | **PASS (0 errors)**                 |
| **ESLint**                  | `pnpm run lint`             | Next.js & TypeScript rules                                                                                                                                                      | **PASS (0 warnings)**               |
| **Prettier**                | `pnpm run format:check`     | All source, test, and config files                                                                                                                                              | **PASS (100% formatted)**           |
| **Vitest Tests**            | `pnpm run test:run`         | Phase 1, Phase 2, Phase 3, DB safety                                                                                                                                            | **PASS (26/26 tests)**              |
| **Concurrency Stress Test** | In `src/lib/phase3.test.ts` | **32 independent race iterations** (64 concurrent requests competing for the exact same slot). Verified exactly 1 succeeds, 1 fails per race, with 0 overlapping database rows. | **PASS (32/32 iterations)**         |
| **Playwright E2E**          | `pnpm run test:e2e`         | Smoke, Phase 1 regression, Phase 2 lifecycle, Phase 3 navigation and RBAC                                                                                                       | **PASS (6/6 tests)**                |
| **Production Build**        | `pnpm run build`            | Next.js 16.4.5 Turbopack production bundle                                                                                                                                      | **PASS (21 static/dynamic routes)** |

---

## 4. Database Migrations Applied

- Migration: `prisma/migrations/20261109100333_phase_3_examination_booking_engine`
- Applied cleanly to `thesis_slot_dev` and `thesis_slot_test`.
- Prisma client generated with version `7.10.1`.
