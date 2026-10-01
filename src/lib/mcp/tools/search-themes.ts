import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import products from "@/data/products.json";

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const toThemeJson = (theme: (typeof products)[number]) => ({
  id: theme.id,
  nome: theme.title,
  descricao: theme.description,
  precoInicial: theme.price,
  moeda: "BRL",
  foto: theme.image,
  fotos: "photos" in theme && Array.isArray(theme.photos) ? theme.photos : [],
});

export default defineTool({
  name: "buscar_temas",
  title: "Buscar temas",
  description: "Busca temas de decoração no catálogo público por nome ou descrição.",
  inputSchema: {
    busca: z.string().optional().describe("Nome, palavra ou estilo procurado."),
    precoMaximo: z.number().positive().optional().describe("Preço inicial máximo em reais."),
    limite: z.number().int().min(1).max(50).default(20).describe("Quantidade máxima de resultados."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ busca, precoMaximo, limite }) => {
    const termo = normalize(busca?.trim() ?? "");
    const temas = products
      .filter((theme) => !termo || normalize(`${theme.title} ${theme.description}`).includes(termo))
      .filter((theme) => precoMaximo === undefined || theme.price <= precoMaximo)
      .slice(0, limite)
      .map(toThemeJson);

    return {
      content: [{ type: "text", text: temas.length ? `${temas.length} tema(s) encontrado(s). Os valores são a partir do preço informado e não incluem balões.` : "Nenhum tema encontrado com esses critérios." }],
      structuredContent: { temas, total: temas.length, aviso: "Valores a partir de. Balões não inclusos." },
    };
  },
});