import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AuthSessionProvider } from "@/components/AuthSessionProvider";
import "../globals.css";

export const metadata: Metadata = {
  title: "Admin · Cosmic Clock",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full antialiased">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
