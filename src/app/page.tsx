"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleGetStarted = () => {
    if (session?.user) {
      const role = session.user.role?.toLowerCase() || "teacher";
      router.push(`/dashboard/${role}`);
    } else {
      signIn(undefined, { callbackUrl: "/dashboard" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-sky-50 to-teal-50">
      {/* Updated Navbar - matched to DashboardNavbar style */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-2.5 flex items-center justify-between gap-4">
          {/* Left: Logo + Title */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-teal-600 text-white flex items-center justify-center text-lg font-bold shadow group-hover:bg-teal-700 transition">
              SM
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition">
                School Manager
              </p>
              <p className="text-[11px] text-slate-600">For Al Forqan School</p>
            </div>
          </Link>

          {/* Middle: Description (hidden on small screens) */}
          <p className="hidden lg:block text-sm text-slate-600 max-w-md text-center">
            Streamlined dashboards for admins and teachers to manage classes, inquests, schedules, and notifications in one place.
          </p>

          {/* Right: Sign In / Dashboard */}
          <div className="flex items-center gap-3">
            {session?.user ? (
              <button
                onClick={() => {
                  const role = session.user.role?.toLowerCase() || "teacher";
                  router.push(`/dashboard/${role}`);
                }}
                className="rounded-full bg-teal-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-teal-700 transition"
              >
                Dashboard
              </button>
            ) : (
              <button
                onClick={handleGetStarted}
                className="rounded-full bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-teal-700 transition"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Enhanced Hero Section - better responsiveness, larger text on big screens, animations */}
      <main className="flex-1 py-12 px-6 md:py-20 lg:py-28">
        <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-6xl font-extrabold text-slate-900 leading-tight animate-fade-in">
              One platform for all your school management needs.
            </h1>
            <p className="mt-6 md:mt-8 text-base sm:text-lg md:text-xl text-slate-700 leading-relaxed animate-fade-in-delay">
              Admins can manage teachers, inquests, and schedules, while teachers receive clear notifications and a focused daily dashboard.
            </p>
            <div className="mt-8 md:mt-12 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-delay-2">
              <button
                onClick={handleGetStarted}
                className="rounded-xl bg-teal-600 px-8 py-4 text-lg font-bold text-white shadow-xl hover:bg-teal-700 hover:scale-105 transition transform"
              >
                Go to Dashboard
              </button>
              <button className="rounded-xl border-2 border-slate-300 px-8 py-4 text-lg font-bold text-slate-800 hover:border-teal-600 hover:bg-teal-50 transition">
                Learn more
              </button>
            </div>
          </div>

          {/* Feature Preview Card - with subtle hover animation */}
          <div className="rounded-3xl bg-white shadow-2xl border border-slate-200 p-8 md:p-10 hover:shadow-3xl hover:-translate-y-2 transition-all duration-500">
            <p className="text-lg font-bold text-slate-800 mb-8">Feature Preview</p>
            <div className="space-y-8">
              <div className="flex gap-6 opacity-0 animate-fade-up delay-1">
                <div className="h-16 w-16 rounded-2xl bg-teal-100 flex items-center justify-center text-4xl flex-shrink-0">
                  📋
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Teachers Inquests</h3>
                  <p className="text-slate-700 mt-1">Quickly create, track, and review inquests per teacher and academic year.</p>
                </div>
              </div>
              <div className="flex gap-6 opacity-0 animate-fade-up delay-2">
                <div className="h-16 w-16 rounded-2xl bg-sky-100 flex items-center justify-center text-4xl flex-shrink-0">
                  🧑‍🏫
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Teacher Dashboard</h3>
                  <p className="text-slate-700 mt-1">Teachers see alerts, inquests, and daily tasks in one view.</p>
                </div>
              </div>
              <div className="flex gap-6 opacity-0 animate-fade-up delay-3">
                <div className="h-16 w-16 rounded-2xl bg-amber-100 flex items-center justify-center text-4xl flex-shrink-0">
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

      {/* Simple CSS animations (add to your globals.css or a <style> tag) */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 1s ease-out forwards;
        }
        .animate-fade-in-delay {
          animation: fadeIn 1s ease-out 0.3s forwards;
          opacity: 0;
        }
        .animate-fade-in-delay-2 {
          animation: fadeIn 1s ease-out 0.6s forwards;
          opacity: 0;
        }
        .animate-fade-up {
          animation: fadeUp 0.8s ease-out forwards;
        }
        .delay-1 { animation-delay: 0.2s; opacity: 0; }
        .delay-2 { animation-delay: 0.4s; opacity: 0; }
        .delay-3 { animation-delay: 0.6s; opacity: 0; }
      `}</style>
    </div>
  );
}