"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations("HomePage");
  const locale = useLocale();

  const handleGetStarted = () => {
    if (session?.user) {
      const role = session.user.role?.toLowerCase() || "teacher";
      router.push(`/${locale}/dashboard/${role}`);
    } else {
      signIn(undefined, { callbackUrl: `/${locale}/dashboard` });
    }
  };

  const features = [
    { icon: "📊", title: t("featureInquestsTitle"), desc: t("featureInquestsText") },
    { icon: "🧑‍🏫", title: t("featureTeacherTitle"), desc: t("featureTeacherText") },
    { icon: "🔔", title: t("featureNotifyTitle"), desc: t("featureNotifyText") },
  ];

  return (
    <div className="min-h-screen  text-slate-900 relative overflow-hidden">
      {/* Background - Green subtle grid */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-white" />
        <svg className="absolute inset-0 w-full h-full opacity-40">
          <defs>
            <pattern id="soft-green-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#16a34a" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#soft-green-grid)" />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/40 to-transparent" />
      </div>

      {/* Header / Navbar */}
      <header className="sticky top-0 z-20 bg-gradient-to-b from-emerald-100/90 to-white/90 backdrop-blur-md border-b border-emerald-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-extrabold text-lg">
              SM
            </div>
            <div>
              <p className="font-semibold leading-tight">{t("logoTitle")}</p>
              <p className="text-xs text-slate-600">{t("logoSubtitle")}</p>
            </div>
          </Link>

          <button
            onClick={handleGetStarted}
            className="rounded-full px-6 py-2.5 font-medium text-white bg-emerald-700 hover:bg-emerald-800 transition"
          >
            {session?.user ? t("ctaSignedIn") : t("ctaSignedOut")}
          </button>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <main className="relative z-10">
        <div className="max-w-[1440px] mx-auto px-6 py-16 lg:py-32 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left - Text */}
          <div className="space-y-8 text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              {locale === "en" ? (
                <>
                  <span className="text-7xl bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 via-cyan-400 to-orange-500 animate-gradient-x">
                    O
                  </span>
                  {t("heroTitle")}
                </>
              ) : (
                t("heroTitle")
              )}
            </h1>

            <p className="text-lg md:text-xl text-slate-700 max-w-xl mx-auto lg:mx-0">
              {t("heroSubtitle")}
            </p>

            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <button
                onClick={handleGetStarted}
                className="rounded-xl px-8 py-4 text-lg font-semibold text-white bg-emerald-700 hover:bg-emerald-800 shadow-lg transition"
              >
                {t("heroPrimary")}
              </button>

              <button className="rounded-xl px-8 py-4 text-lg font-semibold border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 transition">
                {t("heroSecondary")}
              </button>
            </div>
          </div>

          {/* Right - Fake Dashboard Preview */}
          <div className="relative hidden lg:block animate-fade-up delay-200">
            <div className="rounded-3xl bg-white border border-emerald-300/60 shadow-2xl overflow-hidden">
              <div className="h-10 bg-gradient-to-r from-emerald-100 to-emerald-50 flex items-center px-4 gap-2">
                <div className="h-3 w-3 bg-red-500 rounded-full" />
                <div className="h-3 w-3 bg-yellow-400 rounded-full" />
                <div className="h-3 w-3 bg-green-500 rounded-full" />
              </div>
              <div className="relative">
                <img
                  src="/hero3.jpg"
                  alt="School Management Dashboard Preview"
                  className="w-full h-[380px] md:h-[460px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* ================= FEATURES ================= */}
        <section className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div
                key={i}
                className="group rounded-3xl bg-white/70 backdrop-blur-sm border border-emerald-200 p-8 hover:border-emerald-400 hover:shadow-xl transition-all duration-400 hover:-translate-y-2"
              >
                <div className="text-5xl mb-6">{f.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-emerald-800">{f.title}</h3>
                <p className="text-slate-700">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <style jsx global>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fade-up 0.8s ease-out forwards;
        }
        .delay-200 { animation-delay: 0.2s; }
        @keyframes gradient-x {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 12s ease infinite;
        }
      `}</style>
    </div>
  );
}