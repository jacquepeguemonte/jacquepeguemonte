import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ password: z.string().min(1).max(1000) }).parse(data))
  .handler(async ({ data }) => {
    const { adminSession, passwordMatches, requireSameOrigin } = await import("./admin-session.server");
    requireSameOrigin();
    const expected = process.env["ADMIN_PASSWORD"];
    if (!expected) throw new Error("Acesso administrativo indisponível.");
    const session = await adminSession();
    // Clear an existing session on failed reauthentication too.
    await session.clear();
    if (!passwordMatches(data.password, expected)) return { ok: false };
    await session.update({ unlocked: true });
    return { ok: true };
  });

export const adminStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { adminSession } = await import("./admin-session.server");
  const session = await adminSession();
  return { ok: session.data.unlocked === true };
});

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { adminSession, requireSameOrigin } = await import("./admin-session.server");
  requireSameOrigin();
  await (await adminSession()).clear();
  return { ok: true };
});