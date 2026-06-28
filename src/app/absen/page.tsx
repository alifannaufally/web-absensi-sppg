"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { Clock, Search } from "lucide-react";

function SkeletonRow() {
  return (
    <div className="px-4 py-3 flex items-center gap-2 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-28 sm:w-32" />
      <div className="h-3 bg-gray-200 rounded w-12 sm:w-16" />
      <div className="h-8 bg-gray-200 rounded w-20" />
      <div className="h-8 bg-gray-200 rounded w-20 sm:w-24" />
      <div className="h-8 bg-gray-200 rounded w-20 sm:w-24" />
    </div>
  );
}

function SkeletonSection() {
  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="px-4 py-2 h-8 bg-gray-100 animate-pulse" />
      <div className="divide-y">{[1, 2, 3].map((i) => <SkeletonRow key={i} />)}</div>
    </div>
  );
}

const STATUS_META: Record<string, { label: string; border: string; bg: string }> = {
  HADIR:     { label: "Hadir",     border: "border-green-400 text-green-700",     bg: "bg-green-100 text-green-700 border-green-300" },
  IZIN:      { label: "Izin",      border: "border-yellow-400 text-yellow-700",   bg: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  CUTI:      { label: "Cuti",      border: "border-purple-400 text-purple-700",   bg: "bg-purple-100 text-purple-700 border-purple-300" },
  ALPHA:     { label: "Alpha",     border: "border-red-400 text-red-700",         bg: "bg-red-100 text-red-700 border-red-300" },
  TERLAMBAT: { label: "Terlambat", border: "border-orange-400 text-orange-700",   bg: "bg-orange-100 text-orange-700 border-orange-300" },
  BELUM:     { label: "Belum",     border: "border-gray-300",                     bg: "bg-gray-100 text-gray-400 border-gray-200" },
};


function PulangStatus({ abs }: { abs: any }) {
  const s = abs?.status;
  if (!abs || !s || s === "BELUM") return <span className="text-[10px] text-gray-300">—</span>;
  if (s === "IZIN" || s === "CUTI" || s === "ALPHA") return <span className="text-[10px] text-gray-400">—</span>;
  return (
    <span className={`text-[10px] font-medium ${abs.jamPulang ? "text-green-600" : "text-orange-500"}`}>
      {abs.jamPulang ? "Done" : "Belum"}
    </span>
  );
}

function needsJam(status: string) {
  return status === "HADIR" || status === "TERLAMBAT";
}

export default function AbsenPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [tanggal, setTanggal] = useState(today);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDivisi, setFilterDivisi] = useState<string>("");
  const [searchName, setSearchName] = useState("");
  const [izinKet, setIzinKet] = useState<Record<string, string>>({});
  const [savingKet, setSavingKet] = useState<Record<string, boolean>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pendingUpdates = useRef<Map<string, any>>(new Map());

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/absensi?tanggal=${tanggal}`);
    const json = await res.json();
    const merged = (json.data || []).map((item: any) => {
      const pending = pendingUpdates.current.get(item.id);
      if (pending) return { ...item, absensi: { ...item.absensi, ...pending } };
      return item;
    });
    setData(merged);
    setLoading(false);
  }, [tanggal]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function upsert(pegawaiId: string, status: string, jamMasuk?: string, jamPulang?: string, keterangan?: string) {
    pendingUpdates.current.set(pegawaiId, { status, jamMasuk, jamPulang, keterangan });
    setData((prev) =>
      prev.map((item) =>
        item.id === pegawaiId
          ? { ...item, absensi: { ...item.absensi, status, jamMasuk, jamPulang } }
          : item,
      ),
    );
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const updates = Array.from(pendingUpdates.current.entries());
      pendingUpdates.current.clear();
      for (const [pid, vals] of updates) {
        await fetch("/api/absensi", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pegawaiId: pid, tanggal, ...vals }),
        });
      }
      fetchData();
    }, 400);
  }

  function setJam(pegawaiId: string, field: "jamMasuk" | "jamPulang") {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const item = data.find((d) => d.id === pegawaiId);
    const abs = item?.absensi || {};
    const s = abs.status || "HADIR";
    upsert(pegawaiId, s,
      field === "jamMasuk" ? time : abs.jamMasuk || undefined,
      field === "jamPulang" ? time : abs.jamPulang || undefined,
      abs.keterangan || undefined,
    );
  }

  const allDivisi = [...new Set(data.map((d) => d.divisi?.nama).filter(Boolean))] as string[];

  const filtered = data.filter((item) => {
    if (filterDivisi && item.divisi?.nama !== filterDivisi) return false;
    if (searchName && !item.nama.toLowerCase().includes(searchName.toLowerCase())) return false;
    return true;
  });

  const grouped: Record<string, any[]> = {};
  for (const item of filtered) {
    if (!grouped[item.divisi?.nama]) grouped[item.divisi?.nama] = [];
    grouped[item.divisi?.nama].push(item);
  }

  const STATUS_OPTIONS = ["BELUM", "HADIR", "IZIN", "CUTI", "ALPHA", "TERLAMBAT"];

  return (
    <AppShell>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-lg sm:text-xl font-bold text-navy">Setor &amp; Catat</h1>
          <div className="flex flex-wrap items-center gap-2 bg-white border rounded-xl px-3 py-2 shadow-sm">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Cari pegawai..."
                className="border rounded-lg pl-7 pr-2 py-1.5 text-sm w-36 sm:w-44 bg-white"
              />
            </div>
            <span className="w-px h-5 bg-gray-200 hidden sm:block" />
            <select
              value={filterDivisi}
              onChange={(e) => setFilterDivisi(e.target.value)}
              className="border rounded-lg px-2 py-1.5 text-sm bg-white"
            >
              <option value="">Semua divisi</option>
              {allDivisi.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <span className="w-px h-5 bg-gray-200 hidden sm:block" />
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="border rounded-lg px-2 py-1.5 text-sm bg-white"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6"><SkeletonSection /><SkeletonSection /></div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {Object.entries(grouped).map(([divisi, items]) => (
            <div key={divisi} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-4 py-2 font-semibold text-sm bg-gold text-navy">{divisi}</div>
              <div className="divide-y">
                {items.map((item: any) => {
                  const abs = item.absensi;
                  const status = abs?.status || "BELUM";
                  const meta = STATUS_META[status] || STATUS_META.BELUM;
                  return (
                    <div key={item.id} className="px-4 py-3 sm:py-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                        <div className="flex items-center gap-1.5 sm:w-36 shrink-0 sm:pt-1">
                          <span className="font-medium text-sm">{item.nama}</span>
                          <span className="text-[11px] text-gray-400 font-mono">{item.nik}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 flex-1">
                          <select
                            value={status}
                            onChange={(e) => {
                              const s = e.target.value;
                              const cur = data.find((d) => d.id === item.id)?.absensi || {};
                              upsert(item.id, s,
                                s === "BELUM" ? undefined : (cur.jamMasuk || undefined),
                                s === "BELUM" ? undefined : (cur.jamPulang || undefined),
                                s === "BELUM" ? undefined : (cur.keterangan || undefined),
                              );
                            }}
                            className={`text-sm border rounded-lg px-2 py-1.5 bg-white ${meta.border}`}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>{STATUS_META[opt].label}</option>
                            ))}
                          </select>

                          {needsJam(status) ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="flex items-center gap-1">
                                <input
                                  type="time"
                                  value={abs?.jamMasuk || ""}
                                  onChange={(e) => upsert(item.id, status, e.target.value, abs?.jamPulang || undefined, abs?.keterangan || undefined)}
                                  className="border rounded-lg px-2 py-1.5 text-sm w-22 bg-white"
                                  title="Jam masuk"
                                />
                                <button
                                  onClick={() => setJam(item.id, "jamMasuk")}
                                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition"
                                  title="Sekarang"
                                >
                                  <Clock size={14} />
                                </button>
                              </div>
                              <span className="text-[11px] text-gray-300 hidden sm:inline">→</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="time"
                                  value={abs?.jamPulang || ""}
                                  onChange={(e) => upsert(item.id, status, abs?.jamMasuk || undefined, e.target.value, abs?.keterangan || undefined)}
                                  className="border rounded-lg px-2 py-1.5 text-sm w-22 bg-white"
                                  title="Jam pulang"
                                />
                                <button
                                  onClick={() => setJam(item.id, "jamPulang")}
                                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition"
                                  title="Sekarang"
                                >
                                  <Clock size={14} />
                                </button>
                              </div>
                              <PulangStatus abs={abs} />
                            </div>
                          ) : status === "IZIN" ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={izinKet[item.id] ?? abs?.keterangan ?? ""}
                                onChange={(e) => setIzinKet((prev) => ({ ...prev, [item.id]: e.target.value }))}
                                placeholder="Keterangan izin..."
                                className="border rounded-lg px-2 py-1.5 text-xs w-full min-w-[140px] sm:w-48 bg-white"
                              />
                              <button
                                onClick={async () => {
                                  const val = izinKet[item.id] ?? abs?.keterangan ?? "";
                                  setSavingKet((p) => ({ ...p, [item.id]: true }));
                                  try {
                                    await fetch("/api/absensi", {
                                      method: "PUT",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ pegawaiId: item.id, tanggal, status: "IZIN", keterangan: val || null }),
                                    });
                                    await fetchData();
                                  } finally {
                                    setSavingKet((p) => ({ ...p, [item.id]: false }));
                                    setIzinKet((prev) => {
                                      const next = { ...prev };
                                      delete next[item.id];
                                      return next;
                                    });
                                  }
                                }}
                                disabled={savingKet[item.id]}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-navy hover:bg-navy-soft transition disabled:opacity-40 shrink-0"
                              >
                                {savingKet[item.id] ? "Menyimpan..." : "Simpan"}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-300 italic">—</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
