import { Metadata } from "next";
import { getCurrentSession } from "@/lib/auth-guards";
import { LandingHeader } from "@/components/landing/landing-header";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { WorkflowSection } from "@/components/landing/workflow-section";
import { RolesSection } from "@/components/landing/roles-section";
import { FinalCTA } from "@/components/landing/final-cta";
import { LandingFooter } from "@/components/landing/landing-footer";

export const metadata: Metadata = {
  title: "ThesisSlot | ระบบจองสอบโครงงานและวิทยานิพนธ์",
  description:
    "ระบบจัดการการสอบโครงงานและวิทยานิพนธ์สำหรับนักศึกษา อาจารย์ และเจ้าหน้าที่วิชาการ รองรับการลงทะเบียนโครงงาน การประสานงานกรรมการ และการจองกำหนดการสอบ",
};

export default async function HomePage() {
  // Publicly accessible: check session safely without forcing redirect
  let isAuthenticated = false;
  try {
    const session = await getCurrentSession();
    if (session && session.user && !session.user.banned) {
      isAuthenticated = true;
    }
  } catch {
    isAuthenticated = false;
  }

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col antialiased selection:bg-zinc-800 selection:text-zinc-50 dark:selection:bg-zinc-200 dark:selection:text-zinc-900">
      {/* Sticky Header with navigation & theme toggle */}
      <LandingHeader isAuthenticated={isAuthenticated} />

      {/* Main Content Sections */}
      <main className="flex-1">
        <HeroSection isAuthenticated={isAuthenticated} />
        <FeaturesSection />
        <WorkflowSection />
        <RolesSection />
        <FinalCTA isAuthenticated={isAuthenticated} />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
