"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";
import { Lock, Mail, Loader2, GraduationCap } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (errorParam === "suspended") {
      toast.error("บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ");
    } else if (errorParam === "unauthorized") {
      toast.error("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
    }
  }, [errorParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn.email({
        email,
        password,
      });

      if (error) {
        toast.error(error.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        return;
      }

      toast.success("เข้าสู่ระบบสำเร็จ");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border w-full max-w-md shadow-md">
      <CardHeader className="space-y-3 pb-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-zinc-50 shadow-sm dark:bg-zinc-100 dark:text-zinc-900">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            เข้าสู่ระบบ ThesisSlot
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-1 text-sm">
            ระบบจองสอบโครงงานและวิทยานิพนธ์
          </CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">อีเมลสถาบัน</Label>
            <div className="relative">
              <Mail className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
              <Input
                id="email"
                type="email"
                placeholder="name@university.ac.th"
                className="pl-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">รหัสผ่าน</Label>
            <div className="relative">
              <Lock className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="pl-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-2">
          <Button
            type="submit"
            className="w-full font-medium"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            เข้าสู่ระบบ
          </Button>
          <p className="text-muted-foreground text-center text-xs">
            หากยังไม่มีบัญชีหรือลืมรหัสผ่าน
            กรุณาติดต่อผู้ดูแลระบบหรือเจ้าหน้าที่วิชาการ
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="bg-muted/20 relative flex min-h-screen items-center justify-center p-4">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <React.Suspense
        fallback={
          <div className="border-border bg-card h-96 w-full max-w-md animate-pulse rounded-xl border" />
        }
      >
        <LoginForm />
      </React.Suspense>
    </div>
  );
}
