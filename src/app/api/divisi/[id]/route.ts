import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { cacheDelete } from "@/lib/cache";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requirePermission("divisi:write");
  const { id } = await params;
  const data = await request.json();
  if (data.jamMasuk === "") data.jamMasuk = null;
  if (data.jamPulang === "") data.jamPulang = null;
  const divisi = await prisma.divisi.update({
    where: { id },
    data,
    select: { id: true, nama: true, isPantau: true, jamMasuk: true, jamPulang: true, _count: { select: { pegawai: true } } },
  });
  cacheDelete("divisi:");
  return Response.json({ divisi });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requirePermission("divisi:delete");
  const { id } = await params;
  const count = await prisma.pegawai.count({ where: { divisiId: id } });
  if (count > 0) {
    return Response.json({ error: "Divisi masih memiliki pegawai" }, { status: 400 });
  }
  await prisma.divisi.delete({ where: { id } });
  cacheDelete("divisi:");
  return Response.json({ success: true });
}
