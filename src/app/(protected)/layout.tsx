import { requireAuth } from "@/lib/auth-guards";
import { AppSidebar } from "@/components/app-sidebar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role } = await requireAuth();

  return (
    <div className="bg-background flex min-h-screen flex-col md:flex-row">
      <AppSidebar user={user} role={role} />
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <main className="mx-auto w-full max-w-7xl flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
