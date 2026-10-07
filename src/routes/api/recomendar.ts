import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import products from "@/data/products.json";

const Input = z.object({
  tipoFesta: z.string().trim().min(2).max(100),
  orcamento: z.enum(["ate-200", "200-400", "400-700", "700-mais"]),
  data: z.string().trim().max(20).optional(),
  detalhes: z.string().trim().max(400).optional(),
});

const FAIXAS: Record<string, string> = {
  "ate-200": "até R$ 200",
  "200-400": "de R$ 200 a R$ 400",
  "400-700": "de R$ 400 a R$ 700",
  "700-mais": "acima de R$ 700",
};

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["resumo", "recomendacoes"],
  properties: {
    resumo: { type: "string" },
    recomendacoes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "motivo"],
        properties: { id: { type: "string" }, motivo: { type: "string" } },
      },
    },
  },
};

export const Route = createFileRoute("/api/recomendar")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = Input.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "Dados inválidos." }, { status: 400 });
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return Response.json({ error: "IA não configurada." }, { status: 500 });
        const { tipoFesta, orcamento, data, detalhes } = parsed.data;

        const catalogo = products.map((p) => `${p.id} | ${p.title} | a partir de R$ ${p.price}`).join("\n");
        const prompt = `Cliente quer: festa "${tipoFesta}", orçamento ${FAIXAS[orcamento]}, data ${data || "não informada"}. ${detalhes ? `Detalhes: ${detalhes}` : ""}

Catálogo (id | tema | preço inicial):
${catalogo}

Recomende de 3 a 6 temas do catálogo mais adequados (use apenas ids existentes). Cada kit acompanha painel temático, painel romano, mesa ou trio de cilindros, bandejas/boleiras e tapete. Se o orçamento permitir, sugira combinar com balões (não inclusos, cobrados à parte). Escreva em português, resumo com até 2 frases e cada motivo com até 1 frase. Não confirme disponibilidade da data.`;

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
          method: "POST",
          signal: request.signal,
          headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
          body: JSON.stringify({
            model: "openai/gpt-6-astra",
            input: prompt,
            stream: true,
            store: false,
            reasoning: { effort: "low", summary: "auto" },
            include: ["reasoning.encrypted_content"],
            text: { format: { type: "json_schema", name: "recomendacao", strict: true, schema } },
          }),
        }).catch((e) => {
          if (request.signal.aborted) return null;
          throw e;
        });
        if (!upstream) return new Response(null, { status: 499 });
        if (!upstream.ok || !upstream.body) {
          const body = await upstream.text();
          console.error("AI gateway", upstream.status, body);
          const msg =
            upstream.status === 429 ? "Muitas solicitações, tente novamente em instantes."
            : upstream.status === 402 ? "Créditos de IA esgotados."
            : "Não foi possível gerar recomendações agora.";
          return Response.json({ error: msg }, { status: upstream.status });
        }

        const reader = upstream.body.getReader();
        const dec = new TextDecoder();
        let buf = "", text = "", failed = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let i;
          while ((i = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, i).trim();
            buf = buf.slice(i + 1);
            if (!line.startsWith("data:")) continue;
            const raw = line.slice(5).trim();
            if (!raw || raw === "[DONE]") continue;
            try {
              const ev = JSON.parse(raw);
              if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
              else if (ev.type === "response.failed" || ev.type === "error") failed = "erro";
              else if (ev.type === "response.refusal.delta") failed = "recusa";
            } catch { /* partial */ }
          }
        }
        if (failed || !text) return Response.json({ error: "Não foi possível gerar recomendações agora." }, { status: 502 });

        try {
          const out = JSON.parse(text) as { resumo: string; recomendacoes: { id: string; motivo: string }[] };
          const recs = out.recomendacoes
            .map((r) => {
              const p = products.find((x) => x.id === r.id);
              return p ? { id: p.id, title: p.title, price: p.price, image: p.image, motivo: r.motivo } : null;
            })
            .filter(Boolean)
            .slice(0, 6);
          return Response.json({ resumo: out.resumo, recomendacoes: recs });
        } catch {
          return Response.json({ error: "Resposta inválida da IA." }, { status: 502 });
        }
      },
    },
  },
});
