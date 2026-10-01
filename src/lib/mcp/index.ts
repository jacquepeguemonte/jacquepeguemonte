import { defineMcp } from "@lovable.dev/mcp-js";
import searchThemes from "./tools/search-themes";
import getTheme from "./tools/get-theme";
import createBudget from "./tools/create-budget";

export default defineMcp({
  name: "catalogo",
  title: "Catálogo",
  version: "0.1.0",
  instructions: "Consulte o catálogo público da Jacque Pegue & Monte. Use buscar_temas para descobrir opções, consultar_tema para ver os detalhes e montar_orcamento para gerar uma estimativa. Informe sempre que os valores são iniciais, os balões não estão inclusos e a disponibilidade deve ser confirmada pelo WhatsApp.",
  tools: [searchThemes, getTheme, createBudget],
});