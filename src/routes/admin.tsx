import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import productsData from "@/data/products.json";

type Product = { id: string; title: string; price: number; image: string };
const products = productsData as Product[];
const ADMIN_PASSWORD = "3282";
const STORAGE_KEY = "jpm_price_overrides";
const SESSION_KEY = "jpm_admin_session";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administração | Jacque Pegue & Monte" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");
  const [overrides, setOverrides] = useState<Record<string, number>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY) === "1") setAuthed(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setOverrides(JSON.parse(raw));
    } catch {}
  }, []);

  const tryLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setAuthed(true);
      setError("");
    } else {
      setError("Senha incorreta");
    }
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
    setPwd("");
  };

  const updatePrice = (id: string, value: string) => {
    const n = parseFloat(value.replace(",", "."));
    setOverrides((o) => {
      const next = { ...o };
      if (!Number.isFinite(n) || n <= 0) delete next[id];
      else next[id] = n;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const reset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setOverrides({});
  };

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <form
          onSubmit={tryLogin}
          className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow"
        >
          <h1 className="text-xl font-bold text-foreground">Área administrativa</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Informe a senha para acessar.
          </p>
          <input
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="Senha"
            className="mt-4 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
            autoFocus
          />
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
          <button
            type="submit"
            className="mt-4 w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Entrar
          </button>
          <Link to="/" className="mt-3 block text-center text-xs text-muted-foreground hover:text-primary">
            ← Voltar ao site
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-lg font-bold text-foreground">Administração</h1>
            <p className="text-xs text-muted-foreground">
              Edite os preços dos kits. As alterações ficam salvas neste navegador.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={reset}
              className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
            >
              Restaurar padrão
            </button>
            <button
              onClick={logout}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {products
            .filter((p) => p.title)
            .map((p) => (
              <li key={p.id} className="flex items-center gap-4 p-3">
                <img
                  src={p.image}
                  alt={p.title}
                  className="h-12 w-12 rounded object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{p.title}</p>
                  <p className="text-xs text-muted-foreground">Padrão: R$ {p.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={overrides[p.id] ?? p.price}
                    onBlur={(e) => updatePrice(p.id, e.target.value)}
                    className="w-28 rounded-md border border-input bg-background px-2 py-1 text-sm"
                  />
                </div>
              </li>
            ))}
        </ul>
      </main>
    </div>
  );
}