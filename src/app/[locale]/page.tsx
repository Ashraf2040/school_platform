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
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        {/* Flipped / darker gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#1e293b]" />
        <div className="absolute inset-0 bg-gradient-to-tl from-[#0f766e]/50 via-transparent to-[#22c55e]/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#f97316]/10 via-transparent to-transparent" />

        {/* Grid + Dots (light over dark) */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <pattern
              id="grid"
              x="0"
              y="0"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 60 0 L 0 0 0 60"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="0.8"
                opacity="0.12"
              />
            </pattern>
            <pattern
              id="dots"
              x="0"
              y="0"
              width="100"
              height="100"
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx="50"
                cy="50"
                r="2"
                fill="#22c55e"
                opacity="0.18"
              />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#grid)" />
          <rect x="0" y="0" width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* Floating Orbs (now glows on dark) */}
        <div
          className="absolute top-0 left-0 w-80 h-80 sm:w-96 sm:h-96 rounded-full blur-3xl animate-float-slow"
          style={{ backgroundColor: "rgba(15, 118, 110, 0.32)" }} // teal
        />
        <div
          className="absolute top-20 sm:top-32 right-5 sm:right-10 w-72 h-72 sm:w-80 sm:h-80 rounded-full blur-3xl animate-float-medium"
          style={{ backgroundColor: "rgba(56, 189, 248, 0.30)" }} // cyan
        />
        <div
          className="absolute bottom-10 left-1/4 w-64 h-64 sm:w-72 sm:h-72 rounded-full blur-3xl animate-float-fast"
          style={{ backgroundColor: "rgba(248, 250, 252, 0.14)" }} // soft light
        />
        <div
          className="absolute bottom-32 sm:bottom-40 right-1/4 w-80 h-80 sm:w-96 sm:h-96 rounded-full blur-3xl animate-float-slow reverse"
          style={{ backgroundColor: "rgba(248, 113, 113, 0.18)" }} // soft red
        />
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-white/10 bg-slate-900/40 backdrop-blur-2xl">
        <div className="px-4 sm:px-6 md:px-12 lg:px-20 py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl text-white flex items-center justify-center text-xl sm:text-2xl font-extrabold group-hover:scale-110 group-hover:rotate-6 transition-all duration-500"
              style={{
                background:
                  "linear-gradient(135deg, #0f172a, #0284c7)",
              }}
            >
              SM
            </div>
            <div className="leading-tight text-center sm:text-left">
              <p className="text-base sm:text-lg font-extrabold text-slate-50 group-hover:text-sky-300 transition">
                {t("logoTitle")}
              </p>
              <p className="text-xs text-slate-300/80">
                {t("logoSubtitle")}
              </p>
            </div>
          </Link>

          <p className="hidden lg:block text-sm font-medium text-slate-200/80 text-center max-w-md">
            {t("tagline")}
          </p>

          <button
            onClick={handleGetStarted}
            className="rounded-xl px-6 sm:px-8 py-3 text-sm sm:text-base font-bold text-slate-900 transition-all duration-500 animate-pulse-subtle shadow-lg shadow-emerald-500/30"
            style={{
              background:
                "linear-gradient(to right, #22c55e, #06b6d4)",
            }}
          >
            {session?.user ? t("ctaSignedIn") : t("ctaSignedOut")}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 py-12 sm:py-16 md:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="text-center lg:text-left space-y-6 sm:space-y-8">
            {/* Hero Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
              <span
                className="bg-clip-text text-transparent animate-gradient-x"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #22c55e, #38bdf8, #f97316)",
                }}
              >
              { locale === "en" ? <span className="text-7xl">O</span> : ""}{t("heroTitle")}
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-slate-100/90 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              {t("heroSubtitle")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center lg:justify-start">
              <button
                onClick={handleGetStarted}
                className="relative rounded-2xl px-8 sm:px-10 py-4 sm:py-5 text-lg sm:text-xl font-bold text-slate-950 overflow-hidden group shadow-xl shadow-emerald-500/30"
                style={{
                  background:
                    "linear-gradient(to right, #22c55e, #06b6d4)",
                }}
              >
                <span className="relative z-10">{t("heroPrimary")}</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                <div
                  className="absolute -inset-1 rounded-2xl blur-lg opacity-60 group-hover:opacity-90 transition duration-800"
                  style={{
                    background:
                      "linear-gradient(to right, #38bdf8, #22c55e)",
                  }}
                />
              </button>

              <button
                className="rounded-2xl border px-8 sm:px-10 py-4 sm:py-5 text-lg sm:text-xl font-bold transition-all duration-500 text-slate-100 border-slate-400/60 bg-slate-900/40 backdrop-blur-sm"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#1e293b";
                  e.currentTarget.style.color = "#e5e7eb";
                  e.currentTarget.style.borderColor = "#38bdf8";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(15,23,42,0.4)";
                  e.currentTarget.style.color = "#f9fafb";
                  e.currentTarget.style.borderColor = "rgba(148,163,184,0.6)";
                }}
              >
                {t("heroSecondary")}
              </button>
            </div>
          </div>

          {/* Feature Preview Card */}
          <div className="relative group">
            <div
              className="absolute -inset-2 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition duration-1000"
              style={{
                background:
                  "linear-gradient(to right, #22c55e, #38bdf8)",
              }}
            />
            <div className="relative rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/70 p-6 sm:p-8 md:p-10 lg:p-12 hover:-translate-y-4 transition-all duration-700 shadow-2xl shadow-black/40">
              <p
                className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-10 bg-clip-text text-transparent animate-gradient-x"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #22c55e, #38bdf8, #f97316)",
                }}
              >
                {t("featurePreview")}
              </p>

              <div className="space-y-8 sm:space-y-10">
                {[
                  {
                    icon: "📋",
                    color: "#38bdf8",
                    title: t("featureInquestsTitle"),
                    desc: t("featureInquestsText"),
                  },
                  {
                    icon: "🧑‍🏫",
                    color: "#22c55e",
                    title: t("featureTeacherTitle"),
                    desc: t("featureTeacherText"),
                  },
                  {
                    icon: "🔔",
                    color: "#f97316",
                    title: t("featureNotifyTitle"),
                    desc: t("featureNotifyText"),
                  },
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start opacity-0 animate-fade-in-up"
                    style={{
                      animationDelay: `${i * 200 + 200}ms`,
                      animationFillMode: "forwards",
                    }}
                  >
                    <div
                      className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl sm:rounded-3xl flex items-center justify-center text-3xl sm:text-4xl flex-shrink-0 ring-4"
                      style={{
                        backgroundColor: feature.color + "33",
                        boxShadow: `0 0 40px ${feature.color}44`,
                        borderColor: "transparent",
                      }}
                    >
                      {feature.icon}
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-50">
                        {feature.title}
                      </h3>
                      <p className="text-slate-300 mt-2 text-sm sm:text-base leading-relaxed">
                        {feature.desc}
                      </p>
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
          0%,
          100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-30px) translateX(15px);
          }
        }
        @keyframes float-medium {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-25px);
          }
        }
        @keyframes float-fast {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-35px);
          }
        }
        @keyframes gradient-x {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse-subtle {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.92;
          }
        }

        .animate-float-slow {
          animation: float-slow 22s ease-in-out infinite;
        }
        .animate-float-medium {
          animation: float-medium 20s ease-in-out infinite;
        }
        .animate-float-fast {
          animation: float-fast 18s ease-in-out infinite;
        }
        .reverse {
          animation-direction: reverse;
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 10s ease infinite;
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 3s ease-in-out infinite;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.9s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
