import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";

export async function GET() {
  await requirePermission("role:read");
  const roles = await prisma.role.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json({ roles });
}

export async function POST(request: Request) {
  await requirePermission("role:write");
  const { nama, permissions } = await request.json();
  if (!nama) {
    return Response.json({ error: "Nama role wajib diisi" }, { status: 400 });
  }

  const role = await prisma.role.create({
    data: { nama, permissions: permissions || [] },
  });
  return Response.json({ role }, { status: 201 });
}
