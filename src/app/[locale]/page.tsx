"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations("HomePage");
  const locale = useLocale();

  // لوج للحالة والبيانات عشان نتأكد إيه اللي جاي من session والlocale
  console.log("Session status:", status);
  console.log("Session data:", session);
  console.log("Current locale:", locale);

  const handleGetStarted = () => {
    console.log("Get started clicked");
    if (session?.user) {
      const role = session.user.role?.toLowerCase() || "teacher";
      console.log("User role:", role);
      router.push(`/${locale}/dashboard/${role}`);
    } else {
      console.log("User not signed in, calling signIn");
      signIn(undefined, {
        callbackUrl: `/${locale}/dashboard`,
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-br from-sky-50 via-teal-50 to-emerald-50" />
        <div className="absolute inset-0 bg-linear-to-tl from-teal-200/30 via-transparent to-sky-200/30" />
        <div className="absolute inset-0 bg-linear-to-tr from-emerald-100/20 via-transparent to-transparent" />

        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <pattern id="dotGrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1.5" fill="#14b8a6" opacity="0.15" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#dotGrid)" />
        </svg>

        <div className="absolute top-10 left-10 w-96 h-96 bg-teal-400/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-sky-400/30 rounded-full blur-3xl animate-float-delay" />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl animate-float-delay-2" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/20 bg-white/10 backdrop-blur-xl">
        <div className="px-6 py-5 md:px-12 lg:px-20 flex items-center justify-between gap-8">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="h-12 w-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-2xl font-extrabold group-hover:bg-teal-700 group-hover:scale-105 transition-all duration-300">
              SM
            </div>
            <div className="leading-tight">
              <p className="text-lg font-extrabold text-slate-800 group-hover:text-teal-700 transition">
                {t("logoTitle")}
              </p>
              <p className="text-xs text-slate-600">
                {t("logoSubtitle")}
              </p>
            </div>
          </Link>

          <p className="hidden lg:block text-sm font-medium text-slate-700 max-w-lg text-center opacity-90">
            {t("tagline")}
          </p>

          <div className="flex items-center">
            {session?.user ? (
              <button
                onClick={() => {
                  const role = session.user.role?.toLowerCase() || "teacher";
                  router.push(`/dashboard/${role}`);
                }}
                className="rounded-xl bg-teal-600 px-7 py-3 text-base font-bold text-white hover:bg-teal-700 hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                {t("ctaSignedIn")}
              </button>
            ) : (
              <button
                onClick={handleGetStarted}
                className="rounded-xl bg-teal-600 px-8 py-3.5 text-base font-bold text-white hover:bg-teal-700 hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                {t("ctaSignedOut")}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 py-16 px-16 md:py-24 lg:py-32 relative z-10">
        <div className="mx-auto grid lg:grid-cols-2 md:w-4/5 gap-10 lg:gap-20 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight drop-shadow-lg">
              {t("heroTitle")}
            </h1>
            <p className="mt-8 md:mt-12 text-lg sm:text-xl lg:text-2xl text-slate-700 leading-relaxed max-w-3xl mx-auto lg:mx-0 opacity-95">
              {t("heroSubtitle")}
            </p>
            <div className="mt-12 md:mt-16 flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
              <button
                onClick={handleGetStarted}
                className="rounded-2xl bg-teal-600 px-12 py-6 text-2xl font-bold text-white shadow-2xl hover:bg-teal-700 hover:scale-105 hover:shadow-3xl transition-all duration-500"
              >
                {t("heroPrimary")}
              </button>
              <button className="rounded-2xl border-3 border-slate-300 px-12 py-6 text-2xl font-bold text-slate-800 hover:border-teal-600 hover:bg-teal-50/50 hover:text-teal-700 transition-all duration-300">
                {t("heroSecondary")}
              </button>
            </div>
          </div>

          {/* Feature preview */}
          <div className="rounded-3xl bg-white/75 backdrop-blur-xl shadow-2xl border border-white/60 p-12 hover:shadow-3xl hover:-translate-y-4 transition-all duration-700">
            <p className="text-2xl font-bold text-slate-800 mb-12">
              {t("featurePreview")}
            </p>
            <div className="space-y-12">
              <div className="flex gap-8">
                <div className="h-20 w-20 rounded-3xl bg-teal-100 flex items-center justify-center text-5xl flex-shrink-0 shadow-lg">
                  📋
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {t("featureInquestsTitle")}
                  </h3>
                  <p className="text-slate-700 mt-3 text-lg">
                    {t("featureInquestsText")}
                  </p>
                </div>
              </div>

              <div className="flex gap-8">
                <div className="h-20 w-20 rounded-3xl bg-sky-100 flex items-center justify-center text-5xl flex-shrink-0 shadow-lg">
                  🧑‍🏫
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {t("featureTeacherTitle")}
                  </h3>
                  <p className="text-slate-700 mt-3 text-lg">
                    {t("featureTeacherText")}
                  </p>
                </div>
              </div>

              <div className="flex gap-8">
                <div className="h-20 w-20 rounded-3xl bg-emerald-100 flex items-center justify-center text-5xl flex-shrink-0 shadow-lg">
                  🔔
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {t("featureNotifyTitle")}
                  </h3>
                  <p className="text-slate-700 mt-3 text-lg">
                    {t("featureNotifyText")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delay {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-float {
          animation: float 14s ease-in-out infinite;
        }
        .animate-float-delay {
          animation: float-delay 18s ease-in-out infinite;
        }
        .animate-float-delay-2 {
          animation: float 16s ease-in-out infinite reverse;
        }
      `}</style>
    </div>
  );
}
