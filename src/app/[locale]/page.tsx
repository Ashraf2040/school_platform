"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

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

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="fixed inset-0 -z-10">
        {/* Richer Gradient Layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-100 via-teal-50 to-emerald-100" />
        <div className="absolute inset-0 bg-gradient-to-tl from-teal-400/30 via-transparent to-cyan-400/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-200/20 via-transparent to-transparent" />

        {/* Subtle Grid + Dots */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <pattern id="grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#0891b2" strokeWidth="0.8" opacity="0.12" />
            </pattern>
            <pattern id="dots" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="2" fill="#0d9488" opacity="0.18" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#grid)" />
          <rect x="0" y="0" width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* Floating Orbs */}
        <div className="absolute top-0 left-0 w-80 h-80 sm:w-96 sm:h-96 bg-cyan-500/25 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-20 sm:top-32 right-5 sm:right-10 w-72 h-72 sm:w-80 sm:h-80 bg-teal-500/30 rounded-full blur-3xl animate-float-medium" />
        <div className="absolute bottom-10 left-1/4 w-64 h-64 sm:w-72 sm:h-72 bg-emerald-400/25 rounded-full blur-3xl animate-float-fast" />
        <div className="absolute bottom-32 sm:bottom-40 right-1/4 w-80 h-80 sm:w-96 sm:h-96 bg-teal-400/20 rounded-full blur-3xl animate-float-slow reverse" />
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-white/30 bg-white/30 backdrop-blur-2xl shadow-md">
        <div className="px-4 sm:px-6 md:px-12 lg:px-20 py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-cyan-600 to-teal-600 text-white flex items-center justify-center text-xl sm:text-2xl font-extrabold group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
              SM
            </div>
            <div className="leading-tight text-center sm:text-left">
              <p className="text-base sm:text-lg font-extrabold text-slate-800 group-hover:text-cyan-700 transition">
                {t("logoTitle")}
              </p>
              <p className="text-xs text-slate-600">{t("logoSubtitle")}</p>
            </div>
          </Link>

          <p className="hidden lg:block text-sm font-medium text-slate-700 text-center opacity-90 max-w-md">
            {t("tagline")}
          </p>

          <button
            onClick={handleGetStarted}
            className="rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-6 sm:px-8 py-3 text-sm sm:text-base font-bold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-500 animate-pulse-subtle"
          >
            {session?.user ? t("ctaSignedIn") : t("ctaSignedOut")}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 py-12 sm:py-16 md:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="text-center lg:text-left space-y-6 sm:space-y-8">
            {/* Balanced Hero Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight">
              <span className="bg-gradient-to-r from-cyan-500 via-teal-600 to-emerald-600 bg-clip-text text-transparent animate-gradient-x">
                {t("heroTitle")}
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-slate-700 leading-relaxed max-w-2xl mx-auto lg:mx-0 opacity-90">
              {t("heroSubtitle")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center lg:justify-start">
              <button
                onClick={handleGetStarted}
                className="relative rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 px-8 sm:px-10 py-4 sm:py-5 text-lg sm:text-xl font-bold text-white shadow-xl overflow-hidden group"
              >
                <span className="relative z-10">{t("heroPrimary")}</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-2xl blur-lg opacity-60 group-hover:opacity-90 transition duration-800" />
              </button>

              <button className="rounded-2xl border-3 border-slate-300 px-8 sm:px-10 py-4 sm:py-5 text-lg sm:text-xl font-bold text-slate-800 hover:border-cyan-600 hover:bg-cyan-50/70 hover:text-cyan-700 hover:shadow-lg transition-all duration-500">
                {t("heroSecondary")}
              </button>
            </div>
          </div>

          {/* Feature Preview Card */}
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/25 to-teal-500/25 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition duration-1000" />
            <div className="relative rounded-3xl bg-white/85 backdrop-blur-xl shadow-xl border border-white/60 p-6 sm:p-8 md:p-10 lg:p-12 hover:shadow-2xl hover:-translate-y-4 transition-all duration-700">
              <p className="text-2xl sm:text-3xl font-bold text-slate-800 mb-8 sm:mb-10 bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                {t("featurePreview")}
              </p>

              <div className="space-y-8 sm:space-y-10">
                {[
                  { icon: "📋", color: "cyan", title: t("featureInquestsTitle"), desc: t("featureInquestsText") },
                  { icon: "🧑‍🏫", color: "teal", title: t("featureTeacherTitle"), desc: t("featureTeacherText") },
                  { icon: "🔔", color: "emerald", title: t("featureNotifyTitle"), desc: t("featureNotifyText") },
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start opacity-0 animate-fade-in-up"
                    style={{ animationDelay: `${i * 200 + 200}ms`, animationFillMode: "forwards" }}
                  >
                    <div className={`h-14 w-14 sm:h-16 sm:w-16 rounded-2xl sm:rounded-3xl bg-${feature.color}-100 flex items-center justify-center text-3xl sm:text-4xl flex-shrink-0 shadow-md ring-4 ring-${feature.color}-200/40`}>
                      {feature.icon}
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">{feature.title}</h3>
                      <p className="text-slate-700 mt-2 text-sm sm:text-base leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Global Animations */}
      <style jsx global>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-30px) translateX(15px); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-25px); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-35px); }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.92; }
        }

        .animate-float-slow { animation: float-slow 22s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 20s ease-in-out infinite; }
        .animate-float-fast { animation: float-fast 18s ease-in-out infinite; }
        .reverse { animation-direction: reverse; }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 10s ease infinite;
        }
        .animate-pulse-subtle { animation: pulse-subtle 3s ease-in-out infinite; }
        .animate-fade-in-up { animation: fade-in-up 0.9s ease-out forwards; }
      `}</style>
    </div>
  );
}