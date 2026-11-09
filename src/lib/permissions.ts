export type Role = "ADMIN" | "ACADEMIC_STAFF" | "FACULTY" | "STUDENT";

export const ROLES = {
  ADMIN: "ADMIN",
  ACADEMIC_STAFF: "ACADEMIC_STAFF",
  FACULTY: "FACULTY",
  STUDENT: "STUDENT",
} as const satisfies Record<Role, Role>;

export const ROLE_LABELS_TH: Record<Role, string> = {
  ADMIN: "ผู้ดูแลระบบ",
  ACADEMIC_STAFF: "เจ้าหน้าที่วิชาการ",
  FACULTY: "อาจารย์",
  STUDENT: "นักศึกษา",
};

export type Permission =
  | "admin:access"
  | "users:manage"
  | "academic:manage"
  | "academic:view"
  | "profile:view_self"
  | "profile:update_self"
  // Phase 2 Permissions
  | "project:create"
  | "project:view_own"
  | "project:edit_own"
  | "project:review"
  | "advisor:respond";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    "admin:access",
    "users:manage",
    "academic:manage",
    "academic:view",
    "profile:view_self",
    "profile:update_self",
    "project:view_own",
    "project:review",
  ],
  ACADEMIC_STAFF: [
    "academic:manage",
    "academic:view",
    "profile:view_self",
    "profile:update_self",
    "project:review",
  ],
  FACULTY: [
    "academic:view",
    "profile:view_self",
    "profile:update_self",
    "advisor:respond",
    "project:view_own",
  ],
  STUDENT: [
    "academic:view",
    "profile:view_self",
    "profile:update_self",
    "project:create",
    "project:view_own",
    "project:edit_own",
  ],
};

export function hasPermission(
  userRole: string | null | undefined,
  permission: Permission
): boolean {
  if (!userRole) return false;
  const role = userRole.toUpperCase() as Role;
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

// -----------------------------------------------------------------------------
// Phase 2 Workflow Status Constants & Labels
// -----------------------------------------------------------------------------

export const PROJECT_REVIEW_STATUS_LABELS_TH: Record<string, string> = {
  DRAFT: "ฉบับร่าง",
  SUBMITTED: "รอการตรวจสอบ",
  REVISION_REQUIRED: "ส่งกลับเพื่อแก้ไข",
  APPROVED: "อนุมัติการลงทะเบียน",
  REJECTED: "ปฏิเสธคำขอ",
  ARCHIVED: "จัดเก็บประวัติ",
};

export const PROJECT_TYPE_LABELS_TH: Record<string, string> = {
  PROJECT: "โครงงานพิเศษ",
  THESIS: "วิทยานิพนธ์",
};

export const MEMBERSHIP_STATUS_LABELS_TH: Record<string, string> = {
  INVITED: "รอการตอบรับ",
  ACCEPTED: "เข้าร่วมกลุ่มแล้ว",
  DECLINED: "ปฏิเสธคำเชิญ",
  CANCELLED: "ยกเลิกคำเชิญ",
};

export const ADVISOR_REQUEST_STATUS_LABELS_TH: Record<string, string> = {
  PENDING: "รออาจารย์ตอบรับ",
  ACCEPTED: "ตอบรับเป็นที่ปรึกษา",
  DECLINED: "ปฏิเสธคำขอ",
  CANCELLED: "ยกเลิกคำขอ",
};
