"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@pms.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex bg-linear-to-br from-slate-900 via-blue-950 to-teal-900 items-center justify-center p-5">
      <div className="flex w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl">
        {/* Form Side */}
        <div className="w-full bg-white flex flex-col justify-center p-10">
          <h2 className="text-2xl font-bold text-slate-800 mb-1">
            Welcome back
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            Sign in to access your dashboard
          </p>

          {/* Error */}
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  📧
                </span>
                <input
                  type="email"
                  id="emailInput"
                  placeholder="you@hospital.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-blue-500 focus:bg-white text-black transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  🔑
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="passInput"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-blue-500 focus:bg-white text-black transition"
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "🙈" : "👁️"}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
                <input type="checkbox" className="accent-blue-700" /> Remember
                me
              </label>
              <span className="text-sm text-blue-700 font-semibold cursor-pointer hover:underline">
                Forgot password?
              </span>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "⏳ Signing in..." : "🔐 Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Need an account? <b>Contact your administrator</b>
          </p>

          {/* Demo hint */}
          <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
              Demo Credentials
            </p>
            <p className="text-xs text-slate-600">📧 admin@pms.com</p>
            <p className="text-xs text-slate-600">🔑 admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
