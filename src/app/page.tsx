"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleGetStarted = () => {
    if (session?.user) router.push("/dashboard");
    else signIn(undefined, { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-sky-50 to-teal-50">
      {/* Navbar */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-xl font-bold shadow-lg">
              SM
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">School Manager</h1>
              <p className="text-sm text-slate-600">For Al Forqan School</p>
            </div>
          </div>

          <p className="hidden lg:block text-sm text-slate-600 max-w-md text-center">
            Streamlined dashboards for admins and teachers to manage classes, inquests, schedules, and notifications in one place.
          </p>

          <div className="flex items-center gap-5">
            <button className="relative p-3 rounded-full hover:bg-slate-100 transition">
              <span className="text-2xl">🔔</span>
              <span className="absolute top-1 right-1 h-5 w-5 rounded-full bg-rose-500 text-xs text-white flex items-center justify-center font-bold">
                0
              </span>
            </button>

            {session?.user ? (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold text-slate-900">{session.user.name}</p>
                  <p className="text-xs text-slate-600">{session.user.role}</p>
                </div>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-teal-700 hover:shadow-xl transition"
                >
                  Dashboard
                </button>
              </div>
            ) : (
              <button
                onClick={handleGetStarted}
                className="rounded-xl bg-teal-600 px-8 py-3 text-base font-semibold text-white shadow-lg hover:bg-teal-700 hover:shadow-xl transition"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 py-20 px-6">
        <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight">
              One platform for all your school management needs.
            </h1>
            <p className="mt-8 text-lg text-slate-700 leading-relaxed">
              Admins can manage teachers, inquests, and schedules, while teachers receive clear notifications and a focused daily dashboard.
            </p>
            <div className="mt-10 flex flex-wrap gap-5">
              <button
                onClick={handleGetStarted}
                className="rounded-xl bg-teal-600 px-8 py-4 text-lg font-bold text-white shadow-xl hover:bg-teal-700 hover:scale-105 transition"
              >
                Go to Dashboard
              </button>
              <button className="rounded-xl border-2 border-slate-300 px-8 py-4 text-lg font-bold text-slate-800 hover:border-teal-600 hover:bg-teal-50 transition">
                Learn more
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-white shadow-2xl border border-slate-200 p-10 hover:shadow-3xl transition">
            <p className="text-lg font-bold text-slate-800 mb-8">Feature Preview</p>
            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="h-16 w-16 rounded-2xl bg-teal-100 flex items-center justify-center text-4xl">
                  📋
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Teachers Inquests</h3>
                  <p className="text-slate-700 mt-1">Quickly create, track, and review inquests per teacher and academic year.</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="h-16 w-16 rounded-2xl bg-sky-100 flex items-center justify-center text-4xl">
                  🧑‍🏫
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Teacher Dashboard</h3>
                  <p className="text-slate-700 mt-1">Teachers see alerts, inquests, and daily tasks in one view.</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="h-16 w-16 rounded-2xl bg-amber-100 flex items-center justify-center text-4xl">
                  🔔
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Smart Notifications</h3>
                  <p className="text-slate-700 mt-1">New inquests become notifications for the relevant teacher.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}