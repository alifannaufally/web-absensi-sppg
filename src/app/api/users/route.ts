import { prisma } from "@/lib/db";
import { requirePermission, hashPassword } from "@/lib/auth";

export async function GET() {
  await requirePermission("user:read");
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      nama: true,
      pegawaiId: true,
      roles: { select: { roleId: true, role: { select: { nama: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ users });
}

export async function POST(request: Request) {
  await requirePermission("user:write");
  const { email, password, nama, roleIds, pegawaiId } = await request.json();
  if (!email || !password || !nama || !roleIds?.length) {
    return Response.json({ error: "Data tidak lengkap" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "Email sudah digunakan" }, { status: 400 });
  }

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    select: {
      id: true,
      email: true,
      nama: true,
      pegawaiId: true,
      roles: { select: { roleId: true, role: { select: { nama: true } } } },
    },
    data: {
      email,
      password: hashed,
      nama,
      pegawaiId: pegawaiId || null,
      roles: { create: roleIds.map((roleId: string) => ({ roleId })) },
    },
  });

  return Response.json({ user }, { status: 201 });
}
