import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { cacheDelete } from "@/lib/cache";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requirePermission("pegawai:write");
  const { id } = await params;
  const data = await request.json();
  if (data.nik) {
    const existing = await prisma.pegawai.findUnique({ where: { nik: data.nik } });
    if (existing && existing.id !== id) {
      return Response.json({ error: "NIK sudah digunakan" }, { status: 400 });
    }
  }
  const pegawai = await prisma.pegawai.update({
    where: { id },
    data,
    select: { id: true, nik: true, nama: true, divisiId: true, divisi: { select: { nama: true } } },
  });
  cacheDelete("pegawai:");
  return Response.json({ pegawai });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requirePermission("pegawai:delete");
  const { id } = await params;
  await prisma.pegawai.delete({ where: { id } });
  cacheDelete("pegawai:");
  cacheDelete("rekap:");
  cacheDelete("absensi:");
  return Response.json({ success: true });
}
