import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import products from "@/data/products.json";

export default defineTool({
  name: "montar_orcamento",
  title: "Montar orçamento",
  description: "Monta um resumo público de orçamento para temas escolhidos, sem reservar uma data.",
  inputSchema: {
    temaIds: z.array(z.string()).min(1).max(20).describe("Identificadores dos temas escolhidos."),
    nomeCliente: z.string().optional().describe("Nome da pessoa interessada."),
    dataEvento: z.string().optional().describe("Data do evento, preferencialmente no formato AAAA-MM-DD."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ temaIds, nomeCliente, dataEvento }) => {
    const ids = new Set(temaIds.map((id) => id.trim().toLowerCase()));
    const selected = products.filter((theme) => ids.has(theme.id.toLowerCase()));
    if (!selected.length) throw new ToolError("Nenhum dos temas informados foi encontrado.");

    const totalInicial = selected.reduce((sum, theme) => sum + theme.price, 0);
    const linhas = selected.map((theme) => `• ${theme.title}: a partir de R$ ${theme.price.toFixed(2).replace(".", ",")}`);
    const mensagemWhatsApp = [
      "Olá! Gostaria de verificar a disponibilidade deste orçamento:",
      nomeCliente?.trim() ? `Nome: ${nomeCliente.trim()}` : null,
      dataEvento?.trim() ? `Data do evento: ${dataEvento.trim()}` : null,
      ...linhas,
      `Total inicial: R$ ${totalInicial.toFixed(2).replace(".", ",")}`,
      "Balões não inclusos.",
    ].filter(Boolean).join("\n");

    const itens = selected.map((theme) => ({ id: theme.id, nome: theme.title, precoInicial: theme.price }));
    return {
      content: [{ type: "text", text: `${mensagemWhatsApp}\n\nA disponibilidade precisa ser confirmada com a Jacque Pegue & Monte.` }],
      structuredContent: {
        itens,
        totalInicial,
        moeda: "BRL",
        mensagemWhatsApp,
        whatsapp: "5562981695886",
        aviso: "Estimativa sem reserva. Valores a partir de. Balões não inclusos.",
      },
    };
  },
});