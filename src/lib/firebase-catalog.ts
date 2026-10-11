// Simulator data (themes + pieces), stored in Lovable Cloud.
// File name kept so existing imports keep working.
import { supabase } from "@/integrations/supabase/client";
import {
  simCreate,
  simDelete,
  simRemoveFile,
  simUpdate,
  simUpload,
} from "./simulador.functions";

export type Tema = {
  id: string;
  nome: string;
  foto_inspiracao: string;
};

export type PecaCategoria = "Mobiliario" | "Decoracao" | "Baloes";

export type Peca = {
  id: string;
  nome: string;
  categoria: PecaCategoria;
  foto_png: string;
  camada_z: 1 | 2 | 3 | 4;
  storage_path?: string;
};

const PASSWORD = "3282";

export async function listTemas(): Promise<Tema[]> {
  const { data } = await supabase.from("sim_temas").select("id,nome,foto_inspiracao").order("nome");
  return (data ?? []) as Tema[];
}

async function listPecas(): Promise<Peca[]> {
  const { data } = await supabase
    .from("sim_pecas")
    .select("id,nome,categoria,foto_png,camada_z,storage_path")
    .order("camada_z");
  return (data ?? []).map((p) => ({ ...p, storage_path: p.storage_path ?? undefined })) as Peca[];
}

function subscribe<T>(table: "sim_temas" | "sim_pecas", load: () => Promise<T>, cb: (v: T) => void) {
  let alive = true;
  const refresh = () => load().then((v) => alive && cb(v));
  refresh();
  const ch = supabase
    .channel(`${table}-${Math.random().toString(36).slice(2)}`)
    .on("postgres_changes", { event: "*", schema: "public", table }, refresh)
    .subscribe();
  return () => {
    alive = false;
    supabase.removeChannel(ch);
  };
}

export const subscribeTemas = (cb: (t: Tema[]) => void) => subscribe("sim_temas", listTemas, cb);
export const subscribePecas = (cb: (p: Peca[]) => void) => subscribe("sim_pecas", listPecas, cb);

function toBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(",")[1] ?? "");
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export async function uploadImage(folder: "temas" | "pecas", file: File) {
  const ext = (file.name.split(".").pop() ?? "png").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "png";
  return simUpload({
    data: { password: PASSWORD, folder, ext, contentType: file.type, base64: await toBase64(file) },
  });
}

export async function removeStorage(path?: string) {
  if (!path) return;
  try {
    await simRemoveFile({ data: { password: PASSWORD, path } });
  } catch {
    /* ignore */
  }
}

export const createTema = (t: Omit<Tema, "id">) =>
  simCreate({ data: { password: PASSWORD, table: "sim_temas", row: t } });
export const updateTema = (id: string, patch: Partial<Omit<Tema, "id">>) =>
  simUpdate({ data: { password: PASSWORD, table: "sim_temas", id, patch } });
export const deleteTema = (id: string) =>
  simDelete({ data: { password: PASSWORD, table: "sim_temas", id } });

export const createPeca = (p: Omit<Peca, "id">) =>
  simCreate({ data: { password: PASSWORD, table: "sim_pecas", row: p } });
export const updatePeca = (id: string, patch: Partial<Omit<Peca, "id">>) =>
  simUpdate({ data: { password: PASSWORD, table: "sim_pecas", id, patch } });
export const deletePeca = (id: string) =>
  simDelete({ data: { password: PASSWORD, table: "sim_pecas", id } });

export const CAMADA_LABELS: Record<number, string> = {
  1: "1 · Base (tapetes)",
  2: "2 · Fundo (painéis, arcos, balões)",
  3: "3 · Meio (mesas, cilindros)",
  4: "4 · Topo (bandejas, flores, LEDs)",
};
