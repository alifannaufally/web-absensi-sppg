import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "sppg-satriadi-secret-key-change-in-production"
);
const COOKIE_NAME = "session";

const publicPaths = ["/login", "/api/auth/login", "/api/auth/logout"];

const pathPermissions: Record<string, string> = {
  "/absen": "absen:read",
  "/monitor": "monitor:read",
  "/pegawai": "pegawai:read",
  "/divisi": "divisi:read",
  "/users": "user:read",
  "/roles": "role:read",
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);
    const permissions = (payload as any).permissions || [];

    const required = Object.entries(pathPermissions).find(([path]) =>
      pathname.startsWith(path)
    )?.[1];

    if (required && !permissions.includes("*") && !permissions.includes(required)) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
