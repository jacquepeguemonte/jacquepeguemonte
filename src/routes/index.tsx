import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import productsData from "@/data/products.json";

type Product = {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
};

const products = productsData as Product[];
const WHATSAPP = "5562000000000"; // TODO: replace with real number

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
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.title.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              Jacque Pegue & Monte
            </h1>
            <p className="text-xs text-muted-foreground">Catálogo Virtual · Goianésia - GO</p>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 sm:inline-flex"
          >
            Falar no WhatsApp
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
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
                <p className="text-base font-bold text-foreground">
                  {p.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
                <a
                  href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
                    `Olá! Tenho interesse no kit "${p.title}".`,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-auto inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90"
                >
                  Reservar
                </a>
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

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Jacque Pegue & Monte · Goianésia - GO
      </footer>
    </div>
  );
}
