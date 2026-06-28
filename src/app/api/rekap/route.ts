import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { periodeRange, toKey } from "@/lib/dates";
import { cacheGetOrFetch } from "@/lib/cache";

export async function GET(request: Request) {
  await requirePermission("monitor:read");
  const { searchParams } = new URL(request.url);
  const mode = (searchParams.get("mode") || "hari") as "hari" | "minggu" | "dua-minggu" | "bulan";
  const anchor = searchParams.get("anchor") || toKey(new Date());

  const { start, end } = periodeRange(mode, new Date(anchor + "T00:00:00.000Z"));

  const dates: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    dates.push(toKey(cur));
    cur.setDate(cur.getDate() + 1);
  }

  const cacheKey = `rekap:${mode}:${anchor}`;

  const { detail, rekap } = await cacheGetOrFetch(cacheKey, async () => {
    const [pegawai, absensiList] = await Promise.all([
      prisma.pegawai.findMany({
        select: { id: true, nik: true, nama: true, divisi: { select: { nama: true } } },
        orderBy: [{ divisi: { nama: "asc" } }, { nama: "asc" }],
      }),
      prisma.absensi.findMany({
        where: { tanggal: { gte: start, lte: end } },
        select: { pegawaiId: true, status: true, tanggal: true, jamMasuk: true, jamPulang: true },
      }),
    ]);

    const absensiByPegawai = new Map<string, typeof absensiList>();
    for (const a of absensiList) {
      const arr = absensiByPegawai.get(a.pegawaiId) || [];
      arr.push(a);
      absensiByPegawai.set(a.pegawaiId, arr);
    }

    const detail = pegawai.map((p) => {
      const absensi = absensiByPegawai.get(p.id) || [];
      const kehadiran: Record<string, { status: string; jamMasuk: string | null; jamPulang: string | null }> = {};
      for (const a of absensi) {
        const key = toKey(a.tanggal);
        kehadiran[key] = { status: a.status, jamMasuk: a.jamMasuk, jamPulang: a.jamPulang };
      }
      return { nik: p.nik, nama: p.nama, divisi: p.divisi.nama, kehadiran };
    });

    const rekap = pegawai.map((p) => {
      const absensi = absensiByPegawai.get(p.id) || [];
      const hadir = absensi.filter((a) => a.status === "HADIR" || a.status === "TERLAMBAT").length;
      const izin = absensi.filter((a) => a.status === "IZIN").length;
      const cuti = absensi.filter((a) => a.status === "CUTI").length;
      const alpha = absensi.filter((a) => a.status === "ALPHA").length;
      const terlambat = absensi.filter((a) => a.status === "TERLAMBAT").length;
      const belum = dates.length - hadir - izin - cuti - alpha;
      return { nik: p.nik, nama: p.nama, divisi: p.divisi.nama, hadir, izin, cuti, alpha, terlambat, belum, total: dates.length };
    });

    return { detail, rekap };
  }, 30_000, 120_000);

  return Response.json({ dates, detail, rekap });
}
