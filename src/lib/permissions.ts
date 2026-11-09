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
  | "profile:update_self";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    "admin:access",
    "users:manage",
    "academic:manage",
    "academic:view",
    "profile:view_self",
    "profile:update_self",
  ],
  ACADEMIC_STAFF: [
    "academic:manage",
    "academic:view",
    "profile:view_self",
    "profile:update_self",
  ],
  FACULTY: ["academic:view", "profile:view_self", "profile:update_self"],
  STUDENT: ["academic:view", "profile:view_self", "profile:update_self"],
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
