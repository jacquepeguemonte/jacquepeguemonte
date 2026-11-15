import { useSession, getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

export function passwordMatches(input: string, expected: string) {
  return timingSafeEqual(createHash("sha256").update(input).digest(), createHash("sha256").update(expected).digest());
}

export async function adminSession() {
  const password = process.env["ADMIN_SESSION_SECRET"];
  if (!password) throw new Error("Acesso administrativo indisponível.");
  setResponseHeader("Cache-Control", "no-store");
  return useSession<{ unlocked?: boolean }>({
    password,
    name: "jpm-admin",
    sessionHeader: false,
    maxAge: 60 * 60 * 8,
    cookie: { httpOnly: true, secure: true, sameSite: "strict", path: "/" },
  });
}

export function requireSameOrigin() {
  const request = getRequest();
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== new URL(request.url).origin)) {
    throw new Error("Acesso não autorizado.");
  }
}

export async function requireAdminSession() {
  requireSameOrigin();
  const session = await adminSession();
  if (!session.data.unlocked) throw new Error("Acesso não autorizado.");
}