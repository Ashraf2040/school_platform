// app/login/LoginForm.tsx
"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);

    const res = await signIn("credentials", {
      redirect: false,
      identifier,
      password,
      callbackUrl,
    });

    setPending(false);

    if (res?.error) {
      toast.error("Invalid credentials");
    } else {
      router.push(callbackUrl);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-teal-50 to-emerald-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-800 mb-2 text-center">
          School Management Platform
        </h1>
        <p className="text-sm text-slate-500 mb-6 text-center">
          Sign in to access your personalized dashboard.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email or Username
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-teal-600 text-white py-2.5 text-sm font-medium shadow-sm hover:bg-teal-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {pending ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 flex flex-col sm:flex-row justify-between text-xs text-slate-500 gap-3">
          <a href="/forgot-password" className="text-teal-600 hover:underline text-center sm:text-left">
            Forgot your password?
          </a>
          <button
            type="button"
            onClick={() => router.push("/register")}
            className="hover:text-teal-600 text-center sm:text-right"
          >
            New user? Contact admin
          </button>
        </div>
      </div>
    </div>
  );
}