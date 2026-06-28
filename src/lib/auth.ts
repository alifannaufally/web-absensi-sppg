import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./db";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "sppg-satriadi-secret-key-change-in-production"
);
const COOKIE_NAME = "session";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createToken(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      nama: true,
      roles: { select: { role: { select: { permissions: true } } } },
    },
  });
  if (!user) throw new Error("User not found");

  const permissions = user.roles.flatMap((ur) => ur.role.permissions);
  const isSuperAdmin = permissions.includes("*");

  return new SignJWT({
    userId: user.id,
    email: user.email,
    nama: user.nama,
    permissions: isSuperAdmin ? ["*"] : permissions,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as {
      userId: string;
      email: string;
      nama: string;
      permissions: string[];
    };
  } catch {
    return null;
  }
}

export async function setSession(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function requirePermission(permission: string) {
  const session = await requireAuth();
  if (!session.permissions.includes("*") && !session.permissions.includes(permission)) {
    throw new Error("Forbidden");
  }
  return session;
}
