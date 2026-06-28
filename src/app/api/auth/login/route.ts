import { prisma } from "@/lib/db";
import { verifyPassword, createToken, setSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return Response.json({ error: "Email dan password wajib diisi" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        nama: true,
        password: true,
        roles: { select: { role: { select: { permissions: true } } } },
      },
    });
    if (!user || !(await verifyPassword(password, user.password))) {
      return Response.json({ error: "Email atau password salah" }, { status: 401 });
    }

    const token = await createToken(user.id);
    await setSession(token);

    const permissions = user.roles.flatMap((ur) => ur.role.permissions);
    return Response.json({
      user: { id: user.id, email: user.email, nama: user.nama, permissions },
    });
  } catch (e) {
    return Response.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
