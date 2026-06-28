"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X } from "lucide-react";

function Skeleton() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="shadow-md animate-pulse bg-navy">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="h-5 bg-white/20 rounded w-32" />
          <div className="h-4 bg-white/20 rounded w-20" />
        </div>
        <nav className="max-w-6xl mx-auto px-4 hidden sm:flex gap-1 pb-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 bg-white/10 rounded w-20" />
          ))}
        </nav>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <div className="space-y-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48" />
          <div className="h-10 bg-gray-100 rounded" />
          <div className="h-64 bg-gray-100 rounded" />
        </div>
      </main>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.push("/login");
          return;
        }
        setUser(data.user);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }, [router]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (loading) return <Skeleton />;
  if (!user) return null;

  const perms = user.permissions || [];
  const has = (p: string) => perms.includes("*") || perms.includes(p);

  const navItems = [
    { label: "Setor & Catat", href: "/absen", perm: "absen:read" },
    { label: "Rekapitulasi", href: "/monitor", perm: "monitor:read" },
    { label: "Pegawai", href: "/pegawai", perm: "pegawai:read" },
    { label: "Divisi", href: "/divisi", perm: "divisi:read" },
    { label: "Users", href: "/users", perm: "user:read" },
    { label: "Roles", href: "/roles", perm: "role:read" },
  ].filter((item) => has(item.perm));

  return (
    <div className="min-h-screen flex flex-col">
      <header className="shadow-md bg-navy sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden text-white/80 hover:text-white"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <Link href="/absen" className="text-white font-bold text-base sm:text-lg">
              Absensi SPPG
            </Link>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="text-gold text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
              {user.nama}
            </span>
            <button
              onClick={handleLogout}
              className="text-white/70 hover:text-white text-xs sm:text-sm transition"
            >
              Keluar
            </button>
          </div>
        </div>

        <nav className="hidden sm:flex max-w-6xl mx-auto px-4 gap-1 pb-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 text-sm rounded-t font-medium transition ${
                pathname.startsWith(item.href)
                  ? "bg-white text-navy"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {menuOpen && (
          <div className="sm:hidden border-t border-white/10">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-2.5 text-sm font-medium transition ${
                  pathname.startsWith(item.href)
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        {children}
      </main>
    </div>
  );
}
