import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardNavbar } from "@/components/DashboardNavbar";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const role = session.user.role;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <DashboardNavbar />

      {/* Body with sidebar */}
      <div className="flex flex-1">
        <aside className="w-56 border-r border-slate-200 bg-white/80 backdrop-blur-sm">
          <nav className="p-4 space-y-1 text-sm">
            {role === "ADMIN" && (
              <>
                <DashboardLink href="/dashboard/admin">Overview</DashboardLink>
                <DashboardLink href="/dashboard/admin/inquests">
                  Teachers Inquests
                </DashboardLink>
                <DashboardLink href="/dashboard/admin/teachers">
                  Teachers
                </DashboardLink>
              </>
            )}
            {role === "TEACHER" && (
              <>
                <DashboardLink href="/dashboard/teacher">Overview</DashboardLink>
                <DashboardLink href="/dashboard/teacher/inquests">
                  My Inquests
                </DashboardLink>
              </>
            )}
            <DashboardLink href="/dashboard/notifications">
              Notifications
            </DashboardLink>
          </nav>
        </aside>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

function DashboardLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 text-sm transition"
    >
      {children}
    </Link>
  );
}