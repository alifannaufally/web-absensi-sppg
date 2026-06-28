import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { cacheGetOrFetch, cacheDelete } from "@/lib/cache";

export async function GET() {
  await requirePermission("divisi:read");
  const divisi = await cacheGetOrFetch("divisi:list", () =>
    prisma.divisi.findMany({
      select: { id: true, nama: true, isPantau: true, jamMasuk: true, jamPulang: true, _count: { select: { pegawai: true } } },
      orderBy: { createdAt: "asc" },
    }),
  );
  return Response.json({ divisi });
}

export async function POST(request: Request) {
  await requirePermission("divisi:write");
  const { nama, isPantau, jamMasuk, jamPulang } = await request.json();
  if (!nama) {
    return Response.json({ error: "Nama divisi wajib diisi" }, { status: 400 });
  }
  const divisi = await prisma.divisi.create({
    data: { nama, isPantau: !!isPantau, jamMasuk: jamMasuk || null, jamPulang: jamPulang || null },
  });
  cacheDelete("divisi:");
  return Response.json({ divisi }, { status: 201 });
}
