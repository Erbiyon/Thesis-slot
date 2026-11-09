import type { Metadata } from "next";
import { Sarabun, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/providers";

const sarabun = Sarabun({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-sarabun",
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ThesisSlot — ระบบจองสอบโครงงานและวิทยานิพนธ์",
  description:
    "ระบบจองสอบโครงงานและวิทยานิพนธ์ (Thesis and Project Defense Booking System)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="th"
      suppressHydrationWarning
      className={`${sarabun.variable} ${geistSans.variable} ${geistMono.variable} font-sans`}
    >
      <body className="bg-background text-foreground min-h-screen antialiased selection:bg-zinc-200 dark:selection:bg-zinc-800">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
