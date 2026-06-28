import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { cacheGetOrFetch, cacheDelete } from "@/lib/cache";

const VALID_STATUSES = ["HADIR", "IZIN", "CUTI", "ALPHA", "TERLAMBAT"];

export async function GET(request: Request) {
  await requirePermission("absen:read");
  const { searchParams } = new URL(request.url);
  const tanggal = searchParams.get("tanggal");
  if (!tanggal) {
    return Response.json({ error: "Parameter tanggal wajib diisi" }, { status: 400 });
  }

  const dateStart = new Date(tanggal + "T00:00:00.000Z");
  const dateEnd = new Date(tanggal + "T23:59:59.999Z");

  const cacheKey = `absensi:${tanggal}`;

  const data = await cacheGetOrFetch(cacheKey, async () => {
    const [pegawai, absensiList] = await Promise.all([
      prisma.pegawai.findMany({
        select: { id: true, nama: true, nik: true, divisiId: true, divisi: { select: { nama: true } } },
        orderBy: [{ divisi: { nama: "asc" } }, { nama: "asc" }],
      }),
      prisma.absensi.findMany({
        where: { tanggal: { gte: dateStart, lte: dateEnd } },
        select: { id: true, pegawaiId: true, status: true, jamMasuk: true, jamPulang: true },
      }),
    ]);

    const absensiMap = new Map(absensiList.map((a) => [a.pegawaiId, a]));

    return pegawai.map((p) => ({
      id: p.id,
      nama: p.nama,
      nik: p.nik,
      divisiId: p.divisiId,
      divisi: p.divisi,
      absensi: absensiMap.get(p.id) || null,
    }));
  }, 30_000, 120_000);

  return Response.json({ data, tanggal });
}

export async function PUT(request: Request) {
  await requirePermission("absen:write");
  const { pegawaiId, tanggal, status, jamMasuk, jamPulang } = await request.json();
  if (!pegawaiId || !tanggal) {
    return Response.json({ error: "Data tidak lengkap" }, { status: 400 });
  }

  const dateObj = new Date(tanggal + "T00:00:00.000Z");

  const pegawaiExists = await prisma.pegawai.findUnique({ where: { id: pegawaiId }, select: { id: true } });
  if (!pegawaiExists) {
    return Response.json({ error: "Pegawai tidak ditemukan" }, { status: 400 });
  }

  cacheDelete(`absensi:${tanggal}`);
  cacheDelete("rekap:");

  if (!status || status === "BELUM") {
    await prisma.absensi.deleteMany({
      where: { pegawaiId, tanggal: dateObj },
    });
    return Response.json({ absensi: null });
  }

  if (!VALID_STATUSES.includes(status)) {
    return Response.json({ error: "Status tidak valid" }, { status: 400 });
  }

  const absensi = await prisma.absensi.upsert({
    where: { pegawaiId_tanggal: { pegawaiId, tanggal: dateObj } },
    update: { status: status as any, jamMasuk: jamMasuk || null, jamPulang: jamPulang || null },
    create: { pegawaiId, tanggal: dateObj, status: status as any, jamMasuk: jamMasuk || null, jamPulang: jamPulang || null },
    select: { id: true, pegawaiId: true, status: true, jamMasuk: true, jamPulang: true },
  });

  return Response.json({ absensi });
}
