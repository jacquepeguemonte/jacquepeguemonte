import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import products from "@/data/products.json";

const DEFAULT_ITEMS = [
  "Painel temático",
  "Mesa principal decorada",
  "Topo de bolo e displays",
  "Toalha de mesa",
  "Bandejas, boleiras e suportes",
  "Itens decorativos do tema",
];

export default defineTool({
  name: "consultar_tema",
  title: "Consultar tema",
  description: "Mostra preço inicial, fotos e itens de um tema específico do catálogo público.",
  inputSchema: {
    id: z.string().min(1).describe("Identificador do tema, como JPM_1."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ id }) => {
    const theme = products.find((item) => item.id.toLowerCase() === id.trim().toLowerCase());
    if (!theme) throw new ToolError(`Tema ${id} não encontrado.`);

    const fotosExtras = "photos" in theme && Array.isArray(theme.photos) ? theme.photos : [];
    const itens = "items" in theme && Array.isArray(theme.items) ? theme.items : DEFAULT_ITEMS;
    const tema = {
      id: theme.id,
      nome: theme.title,
      descricao: theme.description,
      precoInicial: theme.price,
      moeda: "BRL",
      fotos: [theme.image, ...fotosExtras],
      itens,
      cidade: "Goianésia - GO",
      aviso: "Valor a partir de. Balões não inclusos. Consulte a disponibilidade para a data do evento.",
    };

    return {
      content: [{ type: "text", text: `${tema.nome}: a partir de R$ ${tema.precoInicial.toFixed(2).replace(".", ",")}. Balões não inclusos.` }],
      structuredContent: { tema },
    };
  },
});