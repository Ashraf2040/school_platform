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
    <div className="min-h-screen text-slate-900 relative overflow-hidden selection:bg-emerald-200 selection:text-emerald-900 bg-slate-50">
      
      {/* ENHANCED BACKGROUND */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        {/* Radial Glow - tightened height to focus on center */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-100/40 rounded-full blur-[80px] opacity-70" />
        
        {/* The Grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.35]">
          <defs>
            <pattern id="soft-green-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#16a34a" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#soft-green-grid)" />
        </svg>
        
        {/* Bottom Fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/90" />
      </div>

      {/* HEADER: Seamless Blend with Background */}
      <header className="sticky top-0 z-50 transition-all duration-300 bg-slate-50/70 backdrop-blur-md border-b border-emerald-100/30">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex items-center justify-center font-extrabold text-base shadow-lg group-hover:scale-105 transition-transform duration-300">
              SM
            </div>
            <div>
              <p className="font-bold text-slate-800 leading-tight tracking-tight text-sm">{t("logoTitle")}</p>
              <p className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">{t("logoSubtitle")}</p>
            </div>
          </Link>

          <button
            onClick={handleGetStarted}
            className="relative overflow-hidden rounded-full px-6 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 shadow-md hover:shadow-emerald-300 transition-all duration-300 hover:-translate-y-0.5 active:scale-95 group"
          >
            <span className="relative z-10">{session?.user ? t("ctaSignedIn") : t("ctaSignedOut")}</span>
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
          </button>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <main className="relative z-10">
        <div className="max-w-[1440px] mx-auto px-6 py-8 lg:py-10 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Left - Text Content */}
          <div className="space-y-6 text-center lg:text-left animate-fade-up">
            {/* Small Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-[10px] font-semibold uppercase tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {"Live Preview"}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.15] tracking-tight text-slate-900">
              {locale === "en" ? (
                <>
                  <span className="relative inline-block">
                    <span className="absolute inset-0 bg-gradient-to-r from-emerald-300 to-cyan-300 blur-lg opacity-40 animate-pulse"></span>
                    <span className="relative bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 animate-gradient-x">
                      O
                    </span>
                  </span>
                  {t("heroTitle")}
                </>
              ) : (
                t("heroTitle")
              )}
            </h1>

            <p className="text-base md:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              {t("heroSubtitle")}
            </p>

            <div className="flex flex-wrap gap-3 justify-center lg:justify-start pt-1">
              <button
                onClick={handleGetStarted}
                className="relative rounded-xl px-6 py-3 text-base font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all duration-300 hover:-translate-y-0.5"
              >
                {t("heroPrimary")}
              </button>

              <button className="group rounded-xl px-6 py-3 text-base font-bold border-2 border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-700 hover:bg-white transition-all duration-300 flex items-center gap-2">
                {t("heroSecondary")}
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
              </button>
            </div>
            
            {/* Social Proof */}
            <div className="pt-6 flex items-center justify-center lg:justify-start gap-4 text-slate-400 text-xs font-medium">
              <p>Trusted by:</p>
              <div className="flex gap-4 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                 <span className="font-serif text-base">Cognia</span>
                 <span className="font-mono text-base">AdvancED</span>
                 <span className="font-sans font-bold text-base">HMH</span>
              </div>
            </div>
          </div>

          {/* Right - Dashboard Preview */}
          <div className="relative hidden lg:block perspective-1000">
            <div className="absolute -inset-3 bg-gradient-to-tr from-emerald-200 to-cyan-100 rounded-[2rem] blur-xl opacity-40 animate-pulse" />
            
            <div className="relative rounded-[1.5rem] bg-slate-900 border-4 border-white/80 shadow-2xl overflow-hidden animate-float transform transition-transform hover:scale-[1.01] duration-500">
              {/* Browser Bar */}
              <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center px-5 gap-2">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
                </div>
                <div className="ml-3 h-5 w-56 rounded bg-slate-800/50 border border-slate-700/50 text-[10px] text-slate-500 flex items-center px-2 font-mono">
                  dashboard.school-management.com
                </div>
              </div>
              
              {/* Image Container - Changed Aspect Ratio to 4/3 to fit viewport */}
              <div className="relative w-full  bg-white overflow-hidden group">
                <img
                  src="/hero3.jpg"
                  alt="School Management Dashboard Preview"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none z-10" />
                
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-emerald-100 flex items-center gap-3 animate-bounce-slow">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-sm">✓</div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">System Status</p>
                    <p className="text-xs font-bold text-slate-800">All systems operational</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= FEATURES ================= */}
        <section className="max-w-7xl mx-auto px-6 py-12 lg:py-16">


          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="group relative bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-6 hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 hover:-translate-y-2 overflow-hidden"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-0" />
                
                <div className="relative z-10">
                  <div className="mb-4 w-12 h-12 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-emerald-200 transition-all duration-300">
                    {f.icon}
                  </div>
                  
                  <h3 className="text-lg font-bold mb-2 text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {f.title}
                  </h3>
                  
                  <p className="text-sm text-slate-600 leading-relaxed group-hover:text-slate-700">
                    {f.desc}
                  </p>

                  <div className="mt-4 flex items-center text-xs font-semibold text-emerald-600 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    Learn more <span className="ml-1">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <style jsx global>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }

        @keyframes gradient-x {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 8s ease infinite;
        }

        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}