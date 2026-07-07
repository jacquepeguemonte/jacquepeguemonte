import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  DEFAULT_ITEMS,
  getBaseProducts,
  isBaseId,
  loadCustom,
  loadOverrides,
  mergeCatalog,
  newCustomId,
  saveCustom,
  saveOverrides,
  type Product,
  type ProductOverride,
} from "@/lib/catalog";

const ADMIN_PASSWORD = "3282";
const SESSION_KEY = "jpm_admin_session";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administração | Jacque Pegue & Monte" },
      { name: "description", content: "Painel de administração interno do catálogo Jacque Pegue & Monte para gestão de kits, preços e temas." },
      { name: "robots", content: "noindex,nofollow" },
    ],
    links: [
      { rel: "canonical", href: "https://jacquepeguemonte.lovable.app/admin" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");
  const [overrides, setOverrides] = useState<Record<string, ProductOverride>>({});
  const [custom, setCustom] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY) === "1") setAuthed(true);
    setOverrides(loadOverrides());
    setCustom(loadCustom());
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

  const persistOverrides = (next: Record<string, ProductOverride>) => {
    setOverrides(next);
    saveOverrides(next);
  };
  const persistCustom = (next: Product[]) => {
    setCustom(next);
    saveCustom(next);
  };

  const merged = mergeCatalog(overrides, custom);
  // Include hidden base ones in admin view so they can be re-enabled
  const adminList: Array<Product & { hidden?: boolean }> = [
    ...getBaseProducts().map((p) => {
      const o = overrides[p.id] ?? {};
      return {
        ...p,
        title: o.title ?? p.title,
        description: o.description ?? p.description,
        image: o.image ?? p.image,
        price: o.price ?? p.price,
        items: o.items ?? p.items,
        hidden: !!o.hidden,
      };
    }),
    ...custom.map((p) => ({ ...p, hidden: false })),
  ];

  const editProduct = (
    id: string,
    patch: Partial<Product> & { hidden?: boolean },
  ) => {
    if (isBaseId(id)) {
      const next = { ...overrides, [id]: { ...overrides[id], ...patch } };
      persistOverrides(next);
    } else {
      const next = custom.map((p) => (p.id === id ? { ...p, ...patch } : p));
      persistCustom(next);
    }
  };

  const deleteProduct = (id: string) => {
    if (!confirm("Remover este tema?")) return;
    if (isBaseId(id)) {
      const next = { ...overrides, [id]: { ...overrides[id], hidden: true } };
      persistOverrides(next);
    } else {
      persistCustom(custom.filter((p) => p.id !== id));
    }
  };

  const unhide = (id: string) => {
    const next = { ...overrides };
    if (next[id]) {
      const { hidden: _h, ...rest } = next[id];
      void _h;
      next[id] = rest;
    }
    persistOverrides(next);
  };

  const addNew = () => {
    const np: Product = {
      id: newCustomId(),
      title: "Novo tema",
      description: "Kit de festa Pegue e Monte.",
      image: "https://placehold.co/600x600?text=Novo+Tema",
      price: 170,
      items: [...DEFAULT_ITEMS],
    };
    persistCustom([...custom, np]);
    setEditingId(np.id);
  };

  const resetAll = () => {
    if (!confirm("Restaurar tudo ao padrão? Isso apaga edições e temas novos.")) return;
    localStorage.removeItem("jpm_overrides_v2");
    localStorage.removeItem("jpm_custom_v2");
    localStorage.removeItem("jpm_price_overrides");
    setOverrides({});
    setCustom([]);
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
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-lg font-bold text-foreground">Administração</h1>
            <p className="text-xs text-muted-foreground">
              Edite imagens, preços e itens dos kits, ou cadastre novos temas. As alterações ficam salvas neste navegador.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addNew}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              + Novo tema
            </button>
            <button
              onClick={resetAll}
              className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
            >
              Restaurar padrão
            </button>
            <button
              onClick={logout}
              className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
            >
              Sair
            </button>
            <Link
              to="/"
              className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
            >
              Ver site
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p className="mb-4 text-xs text-muted-foreground">
          {merged.length} {merged.length === 1 ? "tema visível" : "temas visíveis"} no site.
        </p>
        <ul className="space-y-3">
          {adminList.map((p) => {
            const isEditing = editingId === p.id;
            return (
              <li
                key={p.id}
                className={`rounded-xl border bg-card p-4 ${
                  p.hidden ? "border-dashed border-border opacity-60" : "border-border"
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row">
                  <img
                    src={p.image}
                    alt={p.title}
                    className="h-24 w-24 flex-shrink-0 rounded-lg object-cover"
                  />
                  <div className="flex-1 space-y-2">
                    {isEditing ? (
                      <>
                        <input
                          defaultValue={p.title}
                          onBlur={(e) => editProduct(p.id, { title: e.target.value })}
                          placeholder="Título"
                          className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm font-medium"
                        />
                        <input
                          defaultValue={p.image}
                          onBlur={(e) => editProduct(p.id, { image: e.target.value })}
                          placeholder="URL da imagem"
                          className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">R$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={p.price}
                            onBlur={(e) => {
                              const n = parseFloat(e.target.value.replace(",", "."));
                              if (Number.isFinite(n) && n > 0)
                                editProduct(p.id, { price: n });
                            }}
                            className="w-28 rounded-md border border-input bg-background px-2 py-1 text-sm"
                          />
                        </div>
                        <textarea
                          defaultValue={p.items.join("\n")}
                          onBlur={(e) =>
                            editProduct(p.id, {
                              items: e.target.value
                                .split("\n")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                          placeholder="Itens inclusos (um por linha)"
                          rows={4}
                          className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                        />
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-foreground">
                          {p.title}
                          {p.hidden && (
                            <span className="ml-2 rounded bg-muted px-2 py-0.5 text-[10px] uppercase">
                              Oculto
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          R$ {p.price.toFixed(2)} ·{" "}
                          {p.items.length} {p.items.length === 1 ? "item" : "itens"} inclusos
                        </p>
                        {p.items.length > 0 && (
                          <ul className="ml-4 list-disc text-xs text-muted-foreground">
                            {p.items.slice(0, 4).map((it, i) => (
                              <li key={i}>{it}</li>
                            ))}
                            {p.items.length > 4 && (
                              <li>+{p.items.length - 4} mais…</li>
                            )}
                          </ul>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex flex-shrink-0 flex-col gap-2">
                    <button
                      onClick={() => setEditingId(isEditing ? null : p.id)}
                      className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                    >
                      {isEditing ? "Concluir" : "Editar"}
                    </button>
                    {p.hidden ? (
                      <button
                        onClick={() => unhide(p.id)}
                        className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
                      >
                        Reexibir
                      </button>
                    ) : (
                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="rounded-md border border-destructive/40 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}