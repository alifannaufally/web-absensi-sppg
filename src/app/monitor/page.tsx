"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import * as XLSX from "xlsx";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { toast } from "sonner";

const STATUS_META: Record<string, { label: string; bg: string }> = {
  HADIR:     { label: "H", bg: "bg-green-100 text-green-700" },
  IZIN:      { label: "I", bg: "bg-yellow-100 text-yellow-700" },
  CUTI:      { label: "C", bg: "bg-purple-100 text-purple-700" },
  ALPHA:     { label: "A", bg: "bg-red-100 text-red-700" },
  TERLAMBAT: { label: "T", bg: "bg-orange-100 text-orange-700" },
  BELUM:     { label: "?", bg: "bg-gray-100 text-gray-400" },
};

function RincianCell({ k }: { k: { status: string; jamMasuk: string | null; jamPulang: string | null; keterangan: string | null } | undefined }) {
  const s = k?.status || "BELUM";
  const m = STATUS_META[s] || STATUS_META.BELUM;
  const masuk = k?.jamMasuk;
  const pulang = k?.jamPulang;
  const ket = k?.keterangan;
  const isKerja = s === "HADIR" || s === "TERLAMBAT";

  function handleClick() {
    if (s === "IZIN" && ket) {
      toast("Keterangan Izin", {
        description: ket,
        duration: 5000,
      });
    }
  }

  return (
    <div className="flex flex-col items-center gap-px">
      <span
        className={`inline-block w-4 h-4 sm:w-5 sm:h-5 rounded-full text-[8px] sm:text-[10px] leading-4 sm:leading-5 font-bold ${m.bg} ${s === "IZIN" && ket ? "cursor-pointer hover:ring-2 hover:ring-yellow-300" : ""}`}
        onClick={handleClick}
      >
        {m.label}
      </span>
      {isKerja && masuk && <span className="text-[9px] text-gray-500 leading-tight">{masuk}</span>}
      {isKerja && pulang && <span className="text-[9px] text-gray-400 leading-tight">{pulang}</span>}
      {!isKerja && s !== "BELUM" && ket && (
        <span className="text-[7px] text-gray-400 leading-tight max-w-[40px] truncate" title={ket}>{ket}</span>
      )}
    </div>
  );
}

export default function MonitorPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [anchor, setAnchor] = useState(today);
  const [mode, setMode] = useState<"hari" | "minggu" | "dua-minggu" | "bulan">("hari");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    const res = await fetch(`/api/rekap?mode=${mode}&anchor=${anchor}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [mode, anchor]);

  function exportExcel() {
    if (!data) return;
    const wb = XLSX.utils.book_new();
    const detailRows = data.detail.flatMap((d: any) =>
      data.dates.map((t: string) => {
        const k = d.kehadiran[t];
        return {
          Tanggal: t,
          NIK: d.nik,
          Nama: d.nama,
          Divisi: d.divisi,
          Status: k?.status || "BELUM",
          "Jam Masuk": k?.jamMasuk || "",
          "Jam Pulang": k?.jamPulang || "",
          "Keterangan (Izin)": k?.status === "IZIN" ? (k?.keterangan || "") : "",
        };
      })
    );
    const ws1 = XLSX.utils.json_to_sheet(detailRows);
    XLSX.utils.book_append_sheet(wb, ws1, "Detail");
    const ws2 = XLSX.utils.json_to_sheet(data.rekap);
    XLSX.utils.book_append_sheet(wb, ws2, "Rekap");
    const label = mode === "hari" ? "Harian" : mode === "minggu" ? "Mingguan" : mode === "dua-minggu" ? "2-Mingguan" : "Bulanan";
    XLSX.writeFile(wb, `Rekap_Absensi_${label}_${anchor}.xlsx`);
  }

  function navigate(dir: number) {
    const d = new Date(anchor);
    const deltas: Record<string, number> = { hari: 1, minggu: 7, "dua-minggu": 14, bulan: 30 };
    d.setDate(d.getDate() + deltas[mode] * dir);
    setAnchor(d.toISOString().slice(0, 10));
  }

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl font-bold text-navy">Rekapitulasi Absen</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
            className="border rounded-lg px-2 py-1.5 text-sm bg-white"
          >
            <option value="hari">Harian</option>
            <option value="minggu">Mingguan</option>
            <option value="dua-minggu">2 Mingguan</option>
            <option value="bulan">Bulanan</option>
          </select>
          <div className="flex items-center gap-1 bg-white border rounded-lg">
            <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-gray-100 rounded-l-lg transition">
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs sm:text-sm font-medium px-2 min-w-[80px] text-center">{anchor}</span>
            <button onClick={() => navigate(1)} className="p-1.5 hover:bg-gray-100 rounded-r-lg transition">
              <ChevronRight size={16} />
            </button>
          </div>
          <button
            onClick={exportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white font-medium bg-navy hover:bg-navy-soft transition"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-full" />
          <div className="h-64 bg-gray-100 rounded" />
        </div>
      ) : data ? (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b bg-gold text-navy">
                  <th className="px-2 sm:px-3 py-2 text-left whitespace-nowrap">NIK</th>
                  <th className="px-2 sm:px-3 py-2 text-left whitespace-nowrap">Nama</th>
                  <th className="px-2 sm:px-3 py-2 text-left whitespace-nowrap hidden sm:table-cell">Divisi</th>
                  {data.dates.map((t: string) => (
                    <th key={t} className="px-1 sm:px-2 py-2 text-center text-[10px] sm:text-xs whitespace-nowrap">
                      {t.slice(5)}
                    </th>
                  ))}
                  <th className="px-1 sm:px-2 py-2 text-center whitespace-nowrap text-green-700">H</th>
                  <th className="px-1 sm:px-2 py-2 text-center whitespace-nowrap text-yellow-700">I</th>
                  <th className="px-1 sm:px-2 py-2 text-center whitespace-nowrap text-purple-700">C</th>
                  <th className="px-1 sm:px-2 py-2 text-center whitespace-nowrap text-red-700">A</th>
                  <th className="px-1 sm:px-2 py-2 text-center whitespace-nowrap text-orange-700">T</th>
                  <th className="px-1 sm:px-2 py-2 text-center whitespace-nowrap text-gray-400">B</th>
                </tr>
              </thead>
              <tbody>
                {data.rekap.map((r: any) => (
                  <tr key={r.nik} className="border-b hover:bg-gray-50 transition">
                    <td className="px-2 sm:px-3 py-2 font-mono text-[10px] sm:text-xs whitespace-nowrap">{r.nik}</td>
                    <td className="px-2 sm:px-3 py-2 font-medium text-xs sm:text-sm whitespace-nowrap">{r.nama}</td>
                    <td className="px-2 sm:px-3 py-2 text-[10px] sm:text-xs text-gray-500 hidden sm:table-cell">{r.divisi}</td>
                    {data.dates.map((t: string) => {
                      const d = data.detail.find((dd: any) => dd.nik === r.nik);
                      return (
                        <td key={t} className="px-1 sm:px-2 py-1 text-center align-middle">
                          <RincianCell k={d?.kehadiran?.[t]} />
                        </td>
                      );
                    })}
                    <td className="px-1 sm:px-2 py-2 text-center font-medium text-green-600 text-xs">{r.hadir}</td>
                    <td className="px-1 sm:px-2 py-2 text-center font-medium text-yellow-600 text-xs">{r.izin}</td>
                    <td className="px-1 sm:px-2 py-2 text-center font-medium text-purple-600 text-xs">{r.cuti}</td>
                    <td className="px-1 sm:px-2 py-2 text-center font-medium text-red-600 text-xs">{r.alpha}</td>
                    <td className="px-1 sm:px-2 py-2 text-center font-medium text-orange-600 text-xs">{r.terlambat}</td>
                    <td className="px-1 sm:px-2 py-2 text-center font-medium text-gray-400 text-xs">{r.belum}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">Tidak ada data</p>
      )}
    </AppShell>
  );
}
