"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { ROLE_LABELS_TH, Role } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  GraduationCap,
  DoorOpen,
  Users,
  User,
  LogOut,
  ChevronRight,
  Menu,
  X,
  FolderGit2,
  Mail,
  ClipboardCheck,
  ShieldCheck,
  Clock,
  CalendarCheck,
} from "lucide-react";

interface SidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  role: Role;
}

export function AppSidebar({ user, role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    {
      title: "ภาพรวมระบบ",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["ADMIN", "ACADEMIC_STAFF", "FACULTY", "STUDENT"],
    },
    // Phase 2 Nav Items
    {
      title: "โครงงาน / วิทยานิพนธ์",
      href: "/projects",
      icon: FolderGit2,
      roles: ["ADMIN", "ACADEMIC_STAFF", "FACULTY", "STUDENT"],
    },
    {
      title: "คำขออาจารย์ที่ปรึกษา",
      href: "/faculty/advisor-requests",
      icon: Mail,
      roles: ["ADMIN", "FACULTY"],
    },
    {
      title: "ตรวจสอบคำขอลงทะเบียน",
      href: "/academic/project-reviews",
      icon: ClipboardCheck,
      roles: ["ADMIN", "ACADEMIC_STAFF"],
    },
    // Phase 3 Nav Items
    {
      title: "คำเชิญกรรมการสอบ",
      href: "/faculty/committee-invitations",
      icon: ShieldCheck,
      roles: ["ADMIN", "FACULTY"],
    },
    {
      title: "จัดการเวลาว่าง/ไม่สะดวก",
      href: "/faculty/availability",
      icon: Clock,
      roles: ["ADMIN", "FACULTY"],
    },
    {
      title: "แต่งตั้งกรรมการสอบ",
      href: "/academic/examination-committees",
      icon: ShieldCheck,
      roles: ["ADMIN", "ACADEMIC_STAFF"],
    },
    {
      title: "คำขอจองสอบ",
      href: "/academic/examination-bookings",
      icon: CalendarCheck,
      roles: ["ADMIN", "ACADEMIC_STAFF"],
    },
    {
      title: "ปฏิทินตารางสอบ",
      href: "/academic/examination-calendar",
      icon: CalendarDays,
      roles: ["ADMIN", "ACADEMIC_STAFF", "FACULTY", "STUDENT"],
    },
    // Phase 1 Master Data
    {
      title: "ปีการศึกษา",
      href: "/academic/years",
      icon: Calendar,
      roles: ["ADMIN", "ACADEMIC_STAFF"],
    },
    {
      title: "ภาคการศึกษา",
      href: "/academic/terms",
      icon: CalendarDays,
      roles: ["ADMIN", "ACADEMIC_STAFF"],
    },
    {
      title: "หลักสูตร",
      href: "/academic/programs",
      icon: GraduationCap,
      roles: ["ADMIN", "ACADEMIC_STAFF"],
    },
    {
      title: "ห้องสอบ",
      href: "/academic/rooms",
      icon: DoorOpen,
      roles: ["ADMIN", "ACADEMIC_STAFF"],
    },
    {
      title: "จัดการผู้ใช้งาน",
      href: "/admin/users",
      icon: Users,
      roles: ["ADMIN"],
    },
    {
      title: "ข้อมูลส่วนตัว",
      href: "/profile",
      icon: User,
      roles: ["ADMIN", "ACADEMIC_STAFF", "FACULTY", "STUDENT"],
    },
  ];

  const filteredNav = navItems.filter((item) => item.roles.includes(role));

  const sidebarContent = (
    <div className="bg-card border-border flex h-full flex-col border-r">
      {/* Brand */}
      <div className="flex items-center justify-between p-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-lg font-bold text-zinc-50 shadow-sm dark:bg-zinc-100 dark:text-zinc-900">
            TS
          </div>
          <div>
            <h1 className="text-foreground text-base leading-none font-bold tracking-tight">
              ThesisSlot
            </h1>
            <p className="text-muted-foreground mt-1 text-xs">
              ระบบจองสอบวิทยานิพนธ์
            </p>
          </div>
        </Link>
        <button
          onClick={() => setIsOpen(false)}
          className="text-muted-foreground hover:text-foreground md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <Separator />

      {/* Navigation */}
      <div className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="text-muted-foreground mb-2 px-3 text-xs font-medium tracking-wider uppercase">
          เมนูหลัก
        </p>
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-zinc-900 text-zinc-50 shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
                  : "hover:bg-muted hover:text-foreground text-zinc-600 dark:text-zinc-400"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.title}</span>
              </div>
              {isActive && <ChevronRight className="h-4 w-4 opacity-50" />}
            </Link>
          );
        })}
      </div>

      <Separator />

      {/* User info & Logout */}
      <div className="bg-muted/30 space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <p className="text-foreground truncate text-sm font-semibold">
              {user.name}
            </p>
            <p className="text-muted-foreground truncate text-xs">
              {user.email}
            </p>
            <div className="mt-1">
              <span className="inline-flex items-center rounded bg-zinc-200 px-2 py-0.5 text-[11px] font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                {ROLE_LABELS_TH[role]}
              </span>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive flex w-full items-center justify-center gap-2 text-xs"
        >
          <LogOut className="h-3.5 w-3.5" />
          ออกจากระบบ
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="border-border bg-card flex items-center justify-between border-b px-4 py-3 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-zinc-900 text-sm font-bold text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900">
            TS
          </div>
          <span className="text-sm font-bold">ThesisSlot</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="bg-background/80 fixed inset-0 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative z-50 w-64 max-w-full">{sidebarContent}</div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col md:flex">
        {sidebarContent}
      </aside>
    </>
  );
}
