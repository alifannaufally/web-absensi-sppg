import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requirePermission("role:write");
  const { id } = await params;
  const { nama, permissions } = await request.json();

  const data: any = {};
  if (nama) data.nama = nama;
  if (permissions) data.permissions = permissions;

  const role = await prisma.role.update({ where: { id }, data });
  return Response.json({ role });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requirePermission("role:delete");
  const { id } = await params;
  await prisma.role.delete({ where: { id } });
  return Response.json({ success: true });
}
