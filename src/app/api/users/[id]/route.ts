import { prisma } from "@/lib/db";
import { requirePermission, hashPassword } from "@/lib/auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requirePermission("user:write");
  const { id } = await params;
  const { password, nama, roleIds, pegawaiId } = await request.json();

  const data: any = {};
  if (nama) data.nama = nama;
  if (pegawaiId !== undefined) data.pegawaiId = pegawaiId || null;
  if (password) data.password = await hashPassword(password);

  if (roleIds) {
    await prisma.userRole.deleteMany({ where: { userId: id } });
    data.roles = { create: roleIds.map((roleId: string) => ({ roleId })) };
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      nama: true,
      pegawaiId: true,
      roles: { select: { roleId: true, role: { select: { nama: true } } } },
    },
  });

  return Response.json({ user });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requirePermission("user:delete");
  const { id } = await params;
  await prisma.user.delete({ where: { id } });
  return Response.json({ success: true });
}
