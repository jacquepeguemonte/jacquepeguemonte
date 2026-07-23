import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes, deleteObject } from "firebase/storage";
import { db, storage } from "./firebase";

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

const TEMAS = "temas";
const PECAS = "pecas";

export async function listTemas(): Promise<Tema[]> {
  const snap = await getDocs(query(collection(db, TEMAS), orderBy("nome")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Tema, "id">) }));
}

export function subscribeTemas(cb: (temas: Tema[]) => void) {
  return onSnapshot(query(collection(db, TEMAS), orderBy("nome")), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Tema, "id">) })));
  });
}

export function subscribePecas(cb: (pecas: Peca[]) => void) {
  return onSnapshot(query(collection(db, PECAS), orderBy("camada_z")), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Peca, "id">) })));
  });
}

export async function uploadImage(
  folder: "temas" | "pecas",
  file: File,
): Promise<{ url: string; path: string }> {
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const r = ref(storage, path);
  await uploadBytes(r, file, { contentType: file.type || undefined });
  const url = await getDownloadURL(r);
  return { url, path };
}

export async function removeStorage(path?: string) {
  if (!path) return;
  try {
    await deleteObject(ref(storage, path));
  } catch {
    /* ignore */
  }
}

export async function createTema(t: Omit<Tema, "id">) {
  return addDoc(collection(db, TEMAS), t);
}
export async function updateTema(id: string, patch: Partial<Omit<Tema, "id">>) {
  return updateDoc(doc(db, TEMAS, id), patch);
}
export async function deleteTema(id: string) {
  return deleteDoc(doc(db, TEMAS, id));
}

export async function createPeca(p: Omit<Peca, "id">) {
  return addDoc(collection(db, PECAS), p);
}
export async function updatePeca(id: string, patch: Partial<Omit<Peca, "id">>) {
  return updateDoc(doc(db, PECAS, id), patch);
}
export async function deletePeca(id: string) {
  return deleteDoc(doc(db, PECAS, id));
}

export const CAMADA_LABELS: Record<number, string> = {
  1: "1 · Base (tapetes)",
  2: "2 · Fundo (painéis, arcos, balões)",
  3: "3 · Meio (mesas, cilindros)",
  4: "4 · Topo (bandejas, flores, LEDs)",
};