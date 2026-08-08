import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import logoAsset from "@/assets/logo_jpm.jpeg.asset.json";
import heroVideoAsset from "@/assets/hero-video.mp4.asset.json";
import {
  loadCustom,
  loadOverrides,
  mergeCatalog,
  type Product,
} from "@/lib/catalog";
import { CATEGORIES, categorizeProduct, countByCategory } from "@/lib/categories";

const WHATSAPP = "5562981695886";
const WHATSAPP_DISPLAY = "(62) 8169-5886";
const CITY = "Goianésia - GO";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jacque Pegue & Monte | Catálogo de Decoração" },
      { name: "description", content: "Catálogo virtual de kits de festa Pegue e Monte em Goianésia - GO." },
      { property: "og:title", content: "Jacque Pegue & Monte | Catálogo" },
      { property: "og:description", content: "Catálogo virtual de kits de festa Pegue e Monte em Goianésia - GO." },
      { property: "og:url", content: "https://jacquepeguemonte.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://jacquepeguemonte.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "Jacque Pegue & Monte",
          image: "https://jacquepeguemonte.lovable.app/",
          url: "https://jacquepeguemonte.lovable.app/",
          telephone: "+55-62-98169-5886",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Rua 25, nº 328 — Centro",
            addressLocality: "Goianésia",
            addressRegion: "GO",
            postalCode: "76380-000",
            addressCountry: "BR",
          },
          openingHoursSpecification: [
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: "Saturday",
              opens: "08:30",
              closes: "11:30",
            },
          ],
        }),
      },
    ],
  }),
  component: Index,
});

const NAV = [
  { label: "Início", href: "#top" },
  { label: "Categorias", href: "#categorias" },
  { label: "Catálogo", href: "#catalogo" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Orçamento", href: "#simulador" },
  { label: "Contato", href: "#contato" },
];

const HOW_IT_WORKS = [
  { step: "1", title: "Escolha o tema", text: "Navegue pelas categorias e selecione os kits que combinam com a sua festa." },
  { step: "2", title: "Simule o orçamento", text: "Monte a lista, veja o valor estimado e envie tudo direto no WhatsApp." },
  { step: "3", title: "Reserve a data", text: "Confirmamos a disponibilidade e reservamos o kit para o seu evento." },
  { step: "4", title: "Retire ou receba", text: "Retiradas aos sábados, 08:30 às 11:30, ou contrate a Entrega Segura." },
];

function Index() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("todos");
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [sort, setSort] = useState<"recentes" | "menor" | "maior" | "az">("recentes");
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [details, setDetails] = useState<Product | null>(null);
  const [availability, setAvailability] = useState<Product | null>(null);
  const [availName, setAvailName] = useState("");
  const [availDate, setAvailDate] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string>("");
  const [receiptName, setReceiptName] = useState("");
  const [receiptValue, setReceiptValue] = useState("");
  const [receiptDate, setReceiptDate] = useState("");
  const [receiptKind, setReceiptKind] = useState<"pagamento" | "recebimento">("pagamento");

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

  const counts = useMemo(() => countByCategory(catalog), [catalog]);
  const priceCeiling = useMemo(
    () => catalog.reduce((max, p) => Math.max(max, p.price), 0),
    [catalog],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = catalog.filter((p) => {
      if (q && !p.title.toLowerCase().includes(q)) return false;
      if (category !== "todos" && !categorizeProduct(p).includes(category)) return false;
      if (maxPrice > 0 && p.price > maxPrice) return false;
      return true;
    });
    if (sort === "menor") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "maior") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "az") list = [...list].sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
    if (sort === "recentes") list = [...list].reverse();
    return list;
  }, [catalog, query, category, maxPrice, sort]);

  const cart = useMemo(
    () => catalog.map((p) => ({ ...p, qty: selected[p.id] ?? 0 })).filter((p) => p.qty > 0),
    [selected, catalog],
  );
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

  const clearFilters = () => {
    setQuery("");
    setCategory("todos");
    setMaxPrice(0);
    setSort("recentes");
  };

  const sendBudget = () => {
    const lines = cart.flatMap((i) => [
      `• ${i.qty}x ${i.title} — a partir de ${brl(i.qty * i.price)}`,
      ...i.items.map((it) => `   - ${it}`),
    ]);
    const msg = [
      "Olá! Gostaria de um orçamento para os seguintes kits:",
      "",
      ...lines,
      "",
      `Total estimado a partir de: ${brl(total)}`,
      "Balões não incluso",
    ].join("\n");
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const openAvailability = (p: Product) => {
    setDetails(null);
    setAvailability(p);
    setAvailName("");
    setAvailDate("");
  };

  const sendAvailability = (e: React.FormEvent) => {
    e.preventDefault();
    if (!availability) return;
    const prettyDate = availDate
      ? new Date(availDate + "T00:00:00").toLocaleDateString("pt-BR")
      : "";
    const msg = [
      `Olá! Gostaria de verificar a disponibilidade do kit "${availability.title}".`,
      "",
      `Nome: ${availName}`,
      `Data do evento: ${prettyDate}`,
    ].join("\n");
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");
    setAvailability(null);
  };

  const onReceiptFile = (f: File | null) => {
    setReceiptFile(f);
    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    setReceiptPreview(f ? URL.createObjectURL(f) : "");
  };

  const sendReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    const prettyDate = receiptDate
      ? new Date(receiptDate + "T00:00:00").toLocaleDateString("pt-BR")
      : "";
    const valueNum = Number(receiptValue.replace(",", "."));
    const valueFmt = isNaN(valueNum) ? receiptValue : brl(valueNum);
    const msg = [
      `Olá! Envio comprovante de ${receiptKind}.`,
      "",
      `Nome: ${receiptName}`,
      `Valor: ${valueFmt}`,
      `Data: ${prettyDate}`,
      "",
      "Vou anexar a imagem do comprovante em seguida.",
    ].join("\n");
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <a href="#top" className="flex min-w-0 items-center gap-3">
            <img
              src={logoAsset.url}
              alt="Jacque Pegue & Monte"
              className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-primary/30"
            />
            <div className="min-w-0">
              <p className="truncate text-base font-extrabold tracking-tight text-foreground">
                Jacque Pegue &amp; Monte
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Catálogo de decoração · {CITY}
              </p>
            </div>
          </a>
          <a
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90"
          >
            WhatsApp
          </a>
        </div>
        <nav className="border-t border-border/70">
          <ul className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 text-sm sm:px-6 lg:px-8">
            {NAV.map((n) => (
              <li key={n.href}>
                <a
                  href={n.href}
                  className="whitespace-nowrap rounded-full px-3 py-1.5 font-medium text-muted-foreground transition hover:bg-muted hover:text-primary"
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main>
        {/* HERO */}
        <section
          id="top"
          className="relative overflow-hidden"
          style={{ background: "var(--gradient-soft)" }}
        >
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
            <div className="flex flex-col justify-center">
              <span className="mb-3 inline-block w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                Pegue e Monte · {CITY}
              </span>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
                Monte a festa dos seus sonhos de forma prática e econômica!
              </h1>
              <p className="mt-4 max-w-xl text-base text-muted-foreground">
                Cenários infantis, adultos, chás e temáticos com cara de revista e
                montagem simplificada. Busque no centro de Goianésia ou contrate
                nossa entrega segura.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="#catalogo"
                  className="rounded-full px-5 py-3 text-sm font-semibold text-primary-foreground"
                  style={{ background: "var(--gradient-festive)", boxShadow: "var(--shadow-festive)" }}
                >
                  Ver catálogo
                </a>
                <Link
                  to="/simulador"
                  className="rounded-full bg-secondary px-5 py-3 text-sm font-semibold text-secondary-foreground shadow hover:opacity-90"
                >
                  🎨 Simulador Pegue e Monte
                </Link>
                <a
                  href="#simulador"
                  className="rounded-full border border-primary/30 bg-card px-5 py-3 text-sm font-semibold text-primary hover:bg-primary/5"
                >
                  Simular orçamento
                </a>
              </div>
              <dl className="mt-8 grid max-w-md grid-cols-3 gap-3 text-center">
                {[
                  { k: "Temas", v: `${catalog.length}+` },
                  { k: "Cidade", v: "Goianésia" },
                  { k: "Retiradas", v: "Sábados" },
                ].map((s) => (
                  <div key={s.k} className="rounded-2xl border border-border bg-card/80 px-3 py-3">
                    <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.k}</dt>
                    <dd className="text-base font-bold text-primary">{s.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="flex items-center justify-center">
              <video
                src={heroVideoAsset.url}
                autoPlay
                muted
                loop
                playsInline
                poster={logoAsset.url}
                className="max-h-[28rem] w-auto rounded-3xl object-cover"
                style={{ boxShadow: "var(--shadow-festive)" }}
                aria-label="Vídeo de decoração de festa Pegue e Monte"
              />
            </div>
          </div>
        </section>

        {/* CATEGORIAS */}
        <section id="categorias" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Categorias</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Escolha o estilo da sua festa e veja os kits disponíveis.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.map((c) => {
              const active = category === c.id;
              return (
                <li key={c.id}>
                  <a
                    href="#catalogo"
                    onClick={() => setCategory(active ? "todos" : c.id)}
                    className={`flex h-full flex-col items-center gap-1 rounded-2xl border p-4 text-center transition hover:-translate-y-0.5 hover:shadow-md ${
                      active
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card"
                    }`}
                  >
                    <span className="text-2xl" aria-hidden="true">{c.emoji}</span>
                    <span className="text-sm font-semibold text-foreground">{c.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {counts[c.id] ?? 0} {(counts[c.id] ?? 0) === 1 ? "item" : "itens"}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>

        {/* CATÁLOGO + FILTROS */}
        <section id="catalogo" className="bg-muted/40 py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                  Itens mais recentes
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {filtered.length} {filtered.length === 1 ? "tema encontrado" : "temas encontrados"}
                </p>
              </div>
              <button
                type="button"
                onClick={clearFilters}
                className="w-fit rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Limpar filtros
              </button>
            </div>

            <div className="mb-8 grid gap-4 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="f-busca" className="block text-xs font-semibold text-foreground">
                  Buscar tema
                </label>
                <input
                  id="f-busca"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ex.: Princesas"
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
                />
              </div>
              <div>
                <label htmlFor="f-cat" className="block text-xs font-semibold text-foreground">
                  Tipo de evento
                </label>
                <select
                  id="f-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
                >
                  <option value="todos">Todos os tipos</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label} ({counts[c.id] ?? 0})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="f-preco" className="block text-xs font-semibold text-foreground">
                  Faixa de preço {maxPrice > 0 ? `— até ${brl(maxPrice)}` : "— qualquer"}
                </label>
                <input
                  id="f-preco"
                  type="range"
                  min={0}
                  max={priceCeiling || 500}
                  step={10}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="mt-3 w-full accent-[var(--primary)]"
                />
              </div>
              <div>
                <label htmlFor="f-ordem" className="block text-xs font-semibold text-foreground">
                  Ordenar por
                </label>
                <select
                  id="f-ordem"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
                >
                  <option value="recentes">Mais recentes</option>
                  <option value="menor">Menor preço</option>
                  <option value="maior">Maior preço</option>
                  <option value="az">Nome (A-Z)</option>
                </select>
              </div>
            </div>

            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((p) => (
                <li
                  key={p.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img
                      src={p.image}
                      alt={p.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute left-2 top-2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-foreground">
                      Pegue e Monte
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{p.title}</h3>
                    <p className="text-base font-bold text-primary">
                      <span className="text-xs font-medium text-muted-foreground">a partir de </span>
                      {brl(p.price)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      📍 {CITY} · Balões não incluso
                    </p>
                    <div className="mt-auto space-y-2 pt-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center rounded-md border border-border">
                          <button
                            type="button"
                            onClick={() => setQty(p.id, -1)}
                            className="px-2 py-1 text-sm text-foreground hover:bg-muted"
                            aria-label={`Remover ${p.title}`}
                          >
                            −
                          </button>
                          <span className="min-w-6 text-center text-sm">{selected[p.id] ?? 0}</span>
                          <button
                            type="button"
                            onClick={() => setQty(p.id, 1)}
                            className="px-2 py-1 text-sm text-foreground hover:bg-muted"
                            aria-label={`Adicionar ${p.title}`}
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDetails(p)}
                          className="rounded-md border border-primary/40 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5"
                        >
                          Ver detalhes
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => openAvailability(p)}
                        className="w-full rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
                      >
                        Verificar disponibilidade
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {filtered.length === 0 && (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Nenhum tema encontrado com esses filtros.
              </p>
            )}
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section id="como-funciona" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Como funciona</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((s) => (
              <li key={s.step} className="rounded-2xl border border-border bg-card p-5">
                <span
                  className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-primary-foreground"
                  style={{ background: "var(--gradient-festive)" }}
                >
                  {s.step}
                </span>
                <h3 className="mt-3 text-sm font-bold text-foreground">{s.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* SIMULADOR */}
        <section id="simulador" className="bg-muted/40 py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Simulador de orçamento
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Adicione kits no catálogo e veja o total estimado. Envie direto para o
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
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-foreground">
                          {i.qty}× {i.title}
                        </span>
                        <span className="whitespace-nowrap font-semibold text-foreground">
                          a partir de {brl(i.qty * i.price)}
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
                  Total a partir de: <span className="text-primary">{brl(total)}</span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    Balões não incluso
                  </span>
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

        {/* COMPROVANTE */}
        <section id="comprovante" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Enviar comprovante</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Anexe o comprovante bancário (pagamento) ou de recebimento e preencha os dados abaixo.
          </p>

          <form
            onSubmit={sendReceipt}
            className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="flex flex-wrap gap-2">
              {(["pagamento", "recebimento"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setReceiptKind(k)}
                  className={`rounded-full border px-4 py-1.5 text-xs font-semibold capitalize transition ${
                    receiptKind === k
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  Comprovante de {k}
                </button>
              ))}
            </div>

            <div>
              <label htmlFor="rec-file" className="block text-xs font-medium text-foreground">
                Arquivo do comprovante (imagem ou PDF)
              </label>
              <input
                id="rec-file"
                required
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => onReceiptFile(e.target.files?.[0] ?? null)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-foreground"
              />
              {receiptPreview && receiptFile?.type.startsWith("image/") && (
                <img
                  src={receiptPreview}
                  alt="Prévia do comprovante"
                  className="mt-3 max-h-64 rounded-md border border-border object-contain"
                />
              )}
              {receiptFile && !receiptFile.type.startsWith("image/") && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Arquivo selecionado: {receiptFile.name}
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="rec-name" className="block text-xs font-medium text-foreground">
                  Nome
                </label>
                <input
                  id="rec-name"
                  required
                  value={receiptName}
                  onChange={(e) => setReceiptName(e.target.value)}
                  maxLength={100}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <label htmlFor="rec-value" className="block text-xs font-medium text-foreground">
                  Valor (R$)
                </label>
                <input
                  id="rec-value"
                  required
                  inputMode="decimal"
                  value={receiptValue}
                  onChange={(e) => setReceiptValue(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
                  placeholder="0,00"
                />
              </div>
              <div>
                <label htmlFor="rec-date" className="block text-xs font-medium text-foreground">
                  Data
                </label>
                <input
                  id="rec-date"
                  required
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Ao enviar, abriremos o WhatsApp com os dados preenchidos.{" "}
              <strong>Anexe a imagem/PDF do comprovante</strong> na conversa antes de enviar.
            </p>

            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow hover:opacity-90"
              >
                Enviar no WhatsApp
              </button>
            </div>
          </form>
        </section>

        {/* CONTATO / NAP */}
        <section id="contato" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
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
              <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
                Telefone / WhatsApp
              </h3>
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
              <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
                Funcionamento
              </h3>
              <p className="mt-2 text-sm text-foreground">
                Retiradas agendadas aos sábados, das <strong>08:30 às 11:30</strong>.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Consulte nossa taxa opcional de Entrega Segura para bairros locais.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* RODAPÉ */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <img
                src={logoAsset.url}
                alt="Jacque Pegue & Monte"
                className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-primary/30"
              />
              <span className="text-base font-extrabold text-foreground">
                Jacque Pegue &amp; Monte
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Kits de decoração pegue e monte para festas infantis, adultas, chás e
              temáticos em {CITY}.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-primary">Navegação</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="text-muted-foreground hover:text-primary">
                    {n.label}
                  </a>
                </li>
              ))}
              <li>
                <Link to="/simulador" className="text-muted-foreground hover:text-primary">
                  Simulador Pegue e Monte
                </Link>
              </li>
              <li>
                <a href="#comprovante" className="text-muted-foreground hover:text-primary">
                  Enviar comprovante
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-primary">Contato</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" className="hover:text-primary">
                  WhatsApp {WHATSAPP_DISPLAY}
                </a>
              </li>
              <li>Rua 25, nº 328 — Centro</li>
              <li>Goianésia - GO, 76380-000</li>
              <li>Retiradas: sábados, 08:30 às 11:30</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-primary">Redes sociais</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://www.instagram.com/jacquepeguemonte"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://br.pinterest.com/jacquepeguemonte"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary"
                >
                  Pinterest
                </a>
              </li>
            </ul>
            <a
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex rounded-full px-5 py-3 text-sm font-semibold text-primary-foreground"
              style={{ background: "var(--gradient-festive)", boxShadow: "var(--shadow-festive)" }}
            >
              Falar no WhatsApp
            </a>
          </div>
        </div>
        <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Jacque Pegue &amp; Monte · {CITY} ·{" "}
          <Link to="/admin" className="hover:text-primary">Admin</Link>
        </div>
      </footer>

      {/* MODAL DETALHES */}
      {details && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDetails(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-6 shadow-2xl"
          >
            <img
              src={details.image}
              alt={details.title}
              className="aspect-square w-full rounded-xl object-cover"
            />
            <h3 className="mt-4 text-lg font-bold text-foreground">{details.title}</h3>
            <p className="mt-1 text-base font-bold text-primary">
              <span className="text-xs font-medium text-muted-foreground">a partir de </span>
              {brl(details.price)}
            </p>
            <p className="text-xs text-muted-foreground">📍 {CITY} · Balões não incluso</p>
            {details.items.length > 0 && (
              <>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Acompanha o kit
                </p>
                <ul className="mt-1 ml-4 list-disc text-sm text-muted-foreground">
                  {details.items.map((it, idx) => (
                    <li key={idx}>{it}</li>
                  ))}
                </ul>
              </>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDetails(null)}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => openAvailability(details)}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Verificar disponibilidade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DISPONIBILIDADE */}
      {availability && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setAvailability(null)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={sendAvailability}
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-foreground">Verificar disponibilidade</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Kit: <strong>{availability.title}</strong>
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="avail-name" className="block text-xs font-medium text-foreground">
                  Nome do contato
                </label>
                <input
                  id="avail-name"
                  required
                  value={availName}
                  onChange={(e) => setAvailName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <label htmlFor="avail-date" className="block text-xs font-medium text-foreground">
                  Data do evento
                </label>
                <input
                  id="avail-date"
                  required
                  type="date"
                  value={availDate}
                  onChange={(e) => setAvailDate(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAvailability(null)}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Enviar no WhatsApp
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}