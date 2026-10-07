import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

const WHATSAPP = "5562981695886";

export const Route = createFileRoute("/recomendar")({
  head: () => ({
    meta: [
      { title: "Recomendação de temas com IA | Jacque Pegue & Monte" },
      { name: "description", content: "Informe o tipo de festa, orçamento e data e receba sugestões de temas Pegue e Monte em Goianésia - GO." },
      { property: "og:title", content: "Recomendação de temas com IA | Jacque Pegue & Monte" },
      { property: "og:description", content: "Sugestões personalizadas de kits Pegue e Monte para sua festa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Recomendar,
});

type Rec = { id: string; title: string; price: number; image: string; motivo: string };
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Recomendar() {
  const [tipoFesta, setTipo] = useState("");
  const [orcamento, setOrc] = useState("200-400");
  const [data, setData] = useState("");
  const [detalhes, setDet] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [res, setRes] = useState<{ resumo: string; recomendacoes: Rec[] } | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErro(""); setRes(null);
    try {
      const r = await fetch("/api/recomendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipoFesta, orcamento, data, detalhes }),
      });
      const j = await r.json().catch(() => ({ error: "Erro inesperado." }));
      if (!r.ok) setErro(j.error ?? "Erro inesperado.");
      else setRes(j);
    } catch {
      setErro("Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }

  const zap = (t: string) =>
    `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Olá! Vi a recomendação do site e gostaria de verificar a disponibilidade do tema ${t}${data ? ` para ${data.split("-").reverse().join("/")}` : ""}.`)}`;

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <Link to="/" className="text-sm text-muted-foreground hover:text-primary">← Voltar ao catálogo</Link>
        <h1 className="mt-4 text-3xl font-bold text-foreground">✨ Encontre o tema ideal</h1>
        <p className="mt-2 text-muted-foreground">Conte sobre sua festa e nossa assistente sugere temas e kits do catálogo.</p>

        <form onSubmit={enviar} className="mt-6 grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium sm:col-span-2">Tipo de festa
            <input required minLength={2} maxLength={100} value={tipoFesta} onChange={(e) => setTipo(e.target.value)}
              placeholder="Ex.: chá de bebê, aniversário infantil de menina, formatura"
              className="rounded-lg border border-input bg-background px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm font-medium">Faixa de orçamento
            <select value={orcamento} onChange={(e) => setOrc(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2">
              <option value="ate-200">Até R$ 200</option>
              <option value="200-400">R$ 200 a R$ 400</option>
              <option value="400-700">R$ 400 a R$ 700</option>
              <option value="700-mais">Acima de R$ 700</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium">Data desejada
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm font-medium sm:col-span-2">Preferências (opcional)
            <textarea maxLength={400} value={detalhes} onChange={(e) => setDet(e.target.value)} rows={2}
              placeholder="Cores, personagem, idade..." className="rounded-lg border border-input bg-background px-3 py-2" />
          </label>
          <button disabled={loading} className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:opacity-60 sm:col-span-2">
            {loading ? "Pensando nas melhores opções..." : "Recomendar temas"}
          </button>
        </form>

        {erro && <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-destructive">{erro}</p>}

        {res && (
          <section className="mt-8">
            <p className="text-foreground">{res.resumo}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {res.recomendacoes.map((r) => (
                <article key={r.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <img src={r.image} alt={r.title} loading="lazy" className="aspect-square w-full object-cover" />
                  <div className="p-4">
                    <h2 className="font-semibold text-foreground">{r.title}</h2>
                    <p className="text-sm font-bold text-primary">a partir de {brl(r.price)}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{r.motivo}</p>
                    <a href={zap(r.title)} target="_blank" rel="noreferrer"
                      className="mt-3 inline-block rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground">
                      Verificar disponibilidade
                    </a>
                  </div>
                </article>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Valores a partir de. Balões não inclusos. Disponibilidade confirmada pelo WhatsApp.</p>
          </section>
        )}
      </div>
    </main>
  );
}
