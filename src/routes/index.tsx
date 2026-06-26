import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import logoAsset from "@/assets/logo_jpm.jpeg.asset.json";
import {
  loadCustom,
  loadOverrides,
  mergeCatalog,
  type Product,
} from "@/lib/catalog";

const WHATSAPP = "5562981695886";
const WHATSAPP_DISPLAY = "(62) 8169-5886";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jacque Pegue & Monte | Catálogo de Decoração" },
      { name: "description", content: "Catálogo virtual de kits de festa Pegue e Monte em Goianésia - GO." },
      { property: "og:title", content: "Jacque Pegue & Monte | Catálogo" },
      { property: "og:description", content: "Catálogo virtual de kits de festa Pegue e Monte em Goianésia - GO." },
    ],
  }),
  component: Index,
});

function Index() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [catalog, setCatalog] = useState<Product[]>([]);

  useEffect(() => {
    const reload = () => setCatalog(mergeCatalog(loadOverrides(), loadCustom()));
    reload();
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith("jpm_")) reload();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", reload);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", reload);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter((p) => p.title.toLowerCase().includes(q));
  }, [query, catalog]);

  const cart = useMemo(() => {
    return catalog
      .map((p) => ({ ...p, qty: selected[p.id] ?? 0 }))
      .filter((p) => p.qty > 0);
  }, [selected, catalog]);

  const total = cart.reduce((sum, item) => sum + item.qty * item.price, 0);

  const brl = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const setQty = (id: string, delta: number) =>
    setSelected((s) => {
      const next = Math.max(0, (s[id] ?? 0) + delta);
      const copy = { ...s };
      if (next === 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });

  const sendBudget = () => {
    const lines = cart.flatMap((i) => [
      `• ${i.qty}x ${i.title} — ${brl(i.qty * i.price)}`,
      ...i.items.map((it) => `   - ${it}`),
    ]);
    const msg = [
      "Olá! Gostaria de um orçamento para os seguintes kits:",
      "",
      ...lines,
      "",
      `Total estimado: ${brl(total)}`,
    ].join("\n");
    window.open(
      `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-3">
            <img
              src={logoAsset.url}
              alt="Jacque Pegue & Monte"
              className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/30"
            />
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold tracking-tight text-foreground">
                Jacque Pegue & Monte
              </h1>
              <p className="text-xs text-muted-foreground">Decoração para sua festa · Goianésia - GO</p>
            </div>
          </a>
          <a
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition hover:opacity-90"
          >
            WhatsApp
          </a>
        </div>
      </header>

      <section
        id="top"
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.95 0.04 320) 0%, oklch(0.92 0.06 30) 100%)",
        }}
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div className="flex flex-col justify-center">
            <span className="mb-3 inline-block w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Pegue e Monte · Goianésia - GO
            </span>
            <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
              Monte a festa dos seus sonhos de forma prática e econômica!
            </h2>
            <p className="mt-4 max-w-xl text-base text-muted-foreground">
              Cenários infantis, adultos, chás e temáticos com cara de revista e
              montagem simplificada. Busque no centro de Goianésia ou contrate
              nossa entrega segura.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#catalogo"
                className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg hover:opacity-90"
              >
                Ver kits
              </a>
              <a
                href="#simulador"
                className="rounded-full border border-primary/30 bg-card px-5 py-3 text-sm font-semibold text-primary hover:bg-primary/5"
              >
                Simular orçamento
              </a>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <img
              src={logoAsset.url}
              alt="Logo Jacque Pegue & Monte"
              className="w-72 rounded-3xl shadow-2xl sm:w-96"
            />
          </div>
        </div>
      </section>

      <section id="catalogo" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Nossos Kits</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "tema disponível" : "temas disponíveis"}
            </p>
          </div>
          <input
            type="search"
            placeholder="Buscar tema..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border border-input bg-card px-4 py-2 text-sm text-foreground outline-none ring-ring/50 focus:ring-2 sm:w-72"
          />
        </div>

        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <li
              key={p.id}
              className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:shadow-md"
            >
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={p.image}
                  alt={p.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h3 className="text-sm font-semibold text-foreground">{p.title}</h3>
                <p className="text-base font-bold text-primary">{brl(p.price)}</p>
                <div className="mt-auto flex items-center justify-between gap-2">
                  <div className="flex items-center rounded-md border border-border">
                    <button
                      type="button"
                      onClick={() => setQty(p.id, -1)}
                      className="px-2 py-1 text-sm text-foreground hover:bg-muted"
                      aria-label="Remover"
                    >
                      −
                    </button>
                    <span className="min-w-6 text-center text-sm">
                      {selected[p.id] ?? 0}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty(p.id, 1)}
                      className="px-2 py-1 text-sm text-foreground hover:bg-muted"
                      aria-label="Adicionar"
                    >
                      +
                    </button>
                  </div>
                  <a
                    href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
                      `Olá! Gostaria de verificar a disponibilidade do kit "${p.title}".`,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                  >
                    Verificar disponibilidade
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {filtered.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Nenhum tema encontrado para "{query}".
          </p>
        )}
      </section>

      <section id="simulador" className="bg-muted/40 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Simulador de orçamento
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Adicione kits acima e veja o total estimado. Envie direto para o
            WhatsApp para confirmar disponibilidade.
          </p>

          <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
            {cart.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhum kit selecionado ainda.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {cart.map((i) => (
                  <li key={i.id} className="py-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">
                        {i.qty}× {i.title}
                      </span>
                      <span className="font-semibold text-foreground">
                        {brl(i.qty * i.price)}
                      </span>
                    </div>
                    {i.items.length > 0 && (
                      <>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Acompanha o kit:
                        </p>
                        <ul className="mt-1 ml-4 list-disc text-xs text-muted-foreground">
                          {i.items.map((it, idx) => (
                            <li key={idx}>{it}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-lg font-bold text-foreground">
                Total: <span className="text-primary">{brl(total)}</span>
              </div>
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={sendBudget}
                className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Enviar orçamento no WhatsApp
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="contato" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">Endereço</h3>
            <p className="mt-2 text-sm text-foreground">
              Rua 25, nº 328 — Centro<br />
              Goianésia - GO, 76380-000<br />
              <span className="text-muted-foreground">(Entre a R. 22 e a José Carrilho)</span>
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">Telefone / WhatsApp</h3>
            <a
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm font-medium text-foreground hover:text-primary"
            >
              {WHATSAPP_DISPLAY}
            </a>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">Funcionamento</h3>
            <p className="mt-2 text-sm text-foreground">
              Retiradas agendadas aos sábados, das <strong>08:30 às 11:30</strong>.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Consulte nossa taxa opcional de Entrega Segura para bairros locais.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Jacque Pegue & Monte · Goianésia - GO ·{" "}
        <Link to="/admin" className="hover:text-primary">Admin</Link>
      </footer>
    </div>
  );
}
