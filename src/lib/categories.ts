import type { Product } from "@/lib/catalog";

export type Category = {
  id: string;
  label: string;
  emoji: string;
  keywords: string[];
};

export const CATEGORIES: Category[] = [
  {
    id: "infantil",
    label: "Infantil",
    emoji: "🧸",
    keywords: [
      "mickey", "minnie", "princesa", "princesas", "fadinha", "bailarina",
      "mario", "hot wheels", "moranguinho", "bobbie", "ursinho", "urso",
      "ovelhinha", "fazendinha", "safari", "dino", "unicornio", "unicórnio",
      "sereia", "carro", "patrulha", "baby", "cute", "menino", "menina",
      "circo", "jardim", "borboleta",
    ],
  },
  {
    id: "aniversario",
    label: "Aniversário",
    emoji: "🎂",
    keywords: ["aniversário", "aniversario", "happy birthday", "anos", "elegance"],
  },
  {
    id: "chas",
    label: "Chás & Bebê",
    emoji: "🍼",
    keywords: ["chá", "cha de", "panela", "fralda", "revelação", "oh baby", "batizado"],
  },
  {
    id: "formatura",
    label: "Formatura & Corporativo",
    emoji: "🎓",
    keywords: ["formatura", "aula da saudade", "inauguração", "inauguracao", "empresa"],
  },
  {
    id: "religioso",
    label: "Religioso",
    emoji: "🙏",
    keywords: ["deus", "anjinho", "batizado", "primeira eucaristia", "fé"],
  },
  {
    id: "tematicos",
    label: "Temáticos & Rústicos",
    emoji: "✨",
    keywords: [
      "rústico", "rustico", "cowboy", "pool party", "tropical", "floral",
      "dourado", "marsala", "boho", "neon",
    ],
  },
];

export function categorizeProduct(p: Product): string[] {
  const text = `${p.title} ${p.description ?? ""}`.toLowerCase();
  const hits = CATEGORIES.filter((c) =>
    c.keywords.some((k) => text.includes(k)),
  ).map((c) => c.id);
  return hits.length ? hits : ["tematicos"];
}

export function countByCategory(products: Product[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const c of CATEGORIES) counts[c.id] = 0;
  for (const p of products) {
    for (const id of categorizeProduct(p)) counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}
