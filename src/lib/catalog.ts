import productsData from "@/data/products.json";

export type Product = {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  items: string[];
};

export type ProductOverride = Partial<Omit<Product, "id">> & { hidden?: boolean };

export const OVERRIDES_KEY = "jpm_overrides_v2";
export const CUSTOM_KEY = "jpm_custom_v2";
export const LEGACY_PRICE_KEY = "jpm_price_overrides";

export const DEFAULT_ITEMS: string[] = [
  "Painel temático",
  "Mesa principal decorada",
  "Topo de bolo e displays",
  "Toalha de mesa",
  "Bandejas, boleiras e suportes",
  "Itens decorativos do tema",
];

const BASE: Product[] = (productsData as Array<Omit<Product, "items"> & { items?: string[] }>)
  .filter((p) => p.title)
  .map((p) => ({ ...p, items: p.items ?? DEFAULT_ITEMS }));

export function getBaseProducts(): Product[] {
  return BASE;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadOverrides(): Record<string, ProductOverride> {
  if (typeof window === "undefined") return {};
  const next = safeParse<Record<string, ProductOverride>>(
    localStorage.getItem(OVERRIDES_KEY),
    {},
  );
  // migrate legacy price-only overrides
  const legacy = safeParse<Record<string, number>>(
    localStorage.getItem(LEGACY_PRICE_KEY),
    {},
  );
  for (const [id, price] of Object.entries(legacy)) {
    if (!next[id]) next[id] = { price };
    else if (next[id].price == null) next[id].price = price;
  }
  return next;
}

export function saveOverrides(o: Record<string, ProductOverride>) {
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(o));
}

export function loadCustom(): Product[] {
  if (typeof window === "undefined") return [];
  return safeParse<Product[]>(localStorage.getItem(CUSTOM_KEY), []);
}

export function saveCustom(c: Product[]) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(c));
}

export function mergeCatalog(
  overrides: Record<string, ProductOverride>,
  custom: Product[],
): Product[] {
  const merged: Product[] = [];
  for (const p of BASE) {
    const o = overrides[p.id];
    if (o?.hidden) continue;
    merged.push({
      ...p,
      title: o?.title ?? p.title,
      description: o?.description ?? p.description,
      image: o?.image ?? p.image,
      price: o?.price ?? p.price,
      items: o?.items ?? p.items,
    });
  }
  return [...merged, ...custom];
}

export function isBaseId(id: string): boolean {
  return BASE.some((p) => p.id === id);
}

export function newCustomId(): string {
  return `CUSTOM_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}