import "./globals.css";
import type { ReactNode } from "react";
import { AuthSessionProvider } from "@/components/AuthSessionProvider";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "School Management Platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 min-w-full">
        <AuthSessionProvider>
          <Toaster position="top-right" />
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}
