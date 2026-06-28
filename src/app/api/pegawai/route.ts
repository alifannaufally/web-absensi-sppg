import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { cacheGetOrFetch, cacheDelete } from "@/lib/cache";

export async function GET() {
  await requirePermission("pegawai:read");
  const pegawai = await cacheGetOrFetch("pegawai:list", () =>
    prisma.pegawai.findMany({
      select: { id: true, nik: true, nama: true, divisiId: true, divisi: { select: { nama: true } } },
      orderBy: { nama: "asc" },
    }),
  );
  return Response.json({ pegawai });
}

export async function POST(request: Request) {
  await requirePermission("pegawai:write");
  const { nik, nama, divisiId } = await request.json();
  if (!nik || !nama || !divisiId) {
    return Response.json({ error: "NIK, nama, divisi wajib diisi" }, { status: 400 });
  }
  const existing = await prisma.pegawai.findUnique({ where: { nik } });
  if (existing) {
    return Response.json({ error: "NIK sudah digunakan" }, { status: 400 });
  }
  const pegawai = await prisma.pegawai.create({ data: { nik, nama, divisiId } });
  cacheDelete("pegawai:");
  return Response.json({ pegawai }, { status: 201 });
}
