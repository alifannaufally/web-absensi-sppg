"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login gagal");
        return;
      }
      router.push("/absen");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-navy">
      <div className="absolute inset-0 opacity-5">
        <img src="/bgn.svg" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gold/10 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gold/5 blur-3xl" />

      <div className="m-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-16 z-10 px-4">
        <div className="hidden lg:flex flex-col items-center text-white max-w-xs">
          <img src="/bgn.svg" alt="SPPG" className="w-48 h-48 object-contain mb-6 opacity-90" />
          <h2 className="text-2xl font-bold text-gold text-center">Absensi SPPG</h2>
          <p className="text-white/60 text-sm text-center mt-2">
            Sistem absensi terpadu untuk Pos Security dapur SPPG
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 sm:p-10 w-full max-w-md shadow-2xl">
          <div className="text-center mb-8">
            <div className="lg:hidden w-16 h-16 mx-auto mb-4">
              <img src="/bgn.svg" alt="SPPG" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-navy lg:hidden">Absensi SPPG</h1>
            <p className="text-xs sm:text-sm mt-1 text-gray-400">
              Masuk ke akun Anda
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold text-sm bg-gray-50/50 transition"
                  placeholder="nama@email.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold text-sm bg-gray-50/50 transition"
                placeholder="••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-2.5 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd"/></svg>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white transition text-sm sm:text-base disabled:opacity-60 bg-navy hover:bg-navy-soft active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Memproses...
                </span>
              ) : "Masuk"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
