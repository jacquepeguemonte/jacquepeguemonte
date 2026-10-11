import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Same admin password the panel already uses; checked on the server before any change.
const ADMIN_PASSWORD = "3282";
const pw = z.string().refine((v) => v === ADMIN_PASSWORD, "Senha inválida");

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const temaPatch = z.object({ nome: z.string().min(1).max(200), foto_inspiracao: z.string().max(2000) });
const pecaPatch = z.object({
  nome: z.string().min(1).max(200),
  categoria: z.enum(["Mobiliario", "Decoracao", "Baloes"]),
  foto_png: z.string().max(2000),
  camada_z: z.number().int().min(1).max(4),
  storage_path: z.string().max(500).optional().nullable(),
});

export const simCreate = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .discriminatedUnion("table", [
        z.object({ password: pw, table: z.literal("sim_temas"), row: temaPatch }),
        z.object({ password: pw, table: z.literal("sim_pecas"), row: pecaPatch }),
      ])
      .parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { error } = await db.from(data.table).insert(data.row as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const simUpdate = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .discriminatedUnion("table", [
        z.object({ password: pw, table: z.literal("sim_temas"), id: z.string().uuid(), patch: temaPatch.partial() }),
        z.object({ password: pw, table: z.literal("sim_pecas"), id: z.string().uuid(), patch: pecaPatch.partial() }),
      ])
      .parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { error } = await db.from(data.table).update(data.patch as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const simDelete = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({ password: pw, table: z.enum(["sim_temas", "sim_pecas"]), id: z.string().uuid() })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { error } = await db.from(data.table).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const simUpload = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        password: pw,
        folder: z.enum(["temas", "pecas"]),
        ext: z.string().regex(/^[a-z0-9]{1,5}$/i),
        contentType: z.string().max(100),
        base64: z.string().max(28_000_000),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const path = `${data.folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${data.ext}`;
    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    const { error } = await db.storage
      .from("simulador")
      .upload(path, bytes, { contentType: data.contentType || undefined });
    if (error) throw new Error(error.message);
    return { path, url: `/api/public/sim-img/${path}` };
  });

export const simRemoveFile = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ password: pw, path: z.string().max(500) }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    await db.storage.from("simulador").remove([data.path]);
    return { ok: true };
  });
