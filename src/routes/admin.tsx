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
import {
  CAMADA_LABELS,
  createPeca,
  createTema,
  deletePeca,
  deleteTema,
  removeStorage,
  subscribePecas,
  subscribeTemas,
  updatePeca,
  updateTema,
  uploadImage,
  type Peca,
  type PecaCategoria,
  type Tema,
} from "@/lib/firebase-catalog";

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
  const [tab, setTab] = useState<"kits" | "temas" | "pecas">("kits");
  const [temas, setTemas] = useState<Tema[]>([]);
  const [pecas, setPecas] = useState<Peca[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY) === "1") setAuthed(true);
    setOverrides(loadOverrides());
    setCustom(loadCustom());
  }, []);

  useEffect(() => {
    if (!authed) return;
    const u1 = subscribeTemas(setTemas);
    const u2 = subscribePecas(setPecas);
    return () => {
      u1();
      u2();
    };
  }, [authed]);

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
            <Link
              to="/admin/recorte-ia"
              className="rounded-md border border-primary/40 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5"
            >
              Recorte IA
            </Link>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl gap-1 border-t border-border px-4 sm:px-6">
          {(
            [
              ["kits", "Kits (catálogo)"],
              ["temas", "Temas (simulador)"],
              ["pecas", "Peças (simulador)"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`border-b-2 px-3 py-2 text-xs font-semibold ${
                tab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {tab === "temas" && <TemasAdmin temas={temas} />}
        {tab === "pecas" && <PecasAdmin pecas={pecas} />}
        {tab === "kits" && (
          <>
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
          </>
        )}
      </main>
    </div>
  );
}

// ---------- Temas (Firestore) ----------
function TemasAdmin({ temas }: { temas: Tema[] }) {
  const [nome, setNome] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !file) return;
    setBusy(true);
    try {
      const { url } = await uploadImage("temas", file);
      await createTema({ nome, foto_inspiracao: url });
      setNome("");
      setFile(null);
    } catch (err) {
      alert("Erro ao salvar tema: " + (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-bold text-foreground">Novo tema de inspiração</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do tema"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-xs"
          />
          <button
            type="submit"
            disabled={busy || !nome || !file}
            className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Enviando…" : "Cadastrar"}
          </button>
        </div>
      </form>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {temas.map((t) => (
          <li
            key={t.id}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            <img
              src={t.foto_inspiracao}
              alt={t.nome}
              className="h-32 w-full object-cover"
            />
            <div className="flex items-center justify-between gap-2 p-3">
              <input
                defaultValue={t.nome}
                onBlur={(e) => {
                  if (e.target.value !== t.nome)
                    updateTema(t.id, { nome: e.target.value });
                }}
                className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
              />
              <button
                onClick={() => {
                  if (confirm(`Remover tema "${t.nome}"?`)) deleteTema(t.id);
                }}
                className="rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
              >
                ✕
              </button>
            </div>
          </li>
        ))}
        {temas.length === 0 && (
          <p className="text-xs text-muted-foreground">Nenhum tema cadastrado.</p>
        )}
      </ul>
    </div>
  );
}

// ---------- Peças (Firestore + Storage) ----------
function PecasAdmin({ pecas }: { pecas: Peca[] }) {
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState<PecaCategoria>("Mobiliario");
  const [camada, setCamada] = useState<1 | 2 | 3 | 4>(3);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !file) return;
    setBusy(true);
    try {
      const { url, path } = await uploadImage("pecas", file);
      await createPeca({
        nome,
        categoria,
        camada_z: camada,
        foto_png: url,
        storage_path: path,
      });
      setNome("");
      setFile(null);
    } catch (err) {
      alert("Erro ao salvar peça: " + (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-bold text-foreground">Nova peça</h2>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Use PNG com fundo transparente para melhor resultado no palco.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome (ex: Cilindro dourado)"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as PecaCategoria)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="Mobiliario">Mobiliário</option>
            <option value="Decoracao">Decoração</option>
            <option value="Baloes">Balões</option>
          </select>
          <select
            value={camada}
            onChange={(e) => setCamada(Number(e.target.value) as 1 | 2 | 3 | 4)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {[1, 2, 3, 4].map((z) => (
              <option key={z} value={z}>
                {CAMADA_LABELS[z]}
              </option>
            ))}
          </select>
          <input
            type="file"
            accept="image/png,image/webp,image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-xs"
          />
        </div>
        <button
          type="submit"
          disabled={busy || !nome || !file}
          className="mt-3 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Enviando…" : "Cadastrar peça"}
        </button>
      </form>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {pecas.map((p) => (
          <li
            key={p.id}
            className="flex gap-3 rounded-xl border border-border bg-card p-3"
          >
            <div className="grid h-20 w-20 flex-shrink-0 place-items-center rounded-md bg-muted">
              <img src={p.foto_png} alt={p.nome} className="max-h-full max-w-full" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <input
                defaultValue={p.nome}
                onBlur={(e) => {
                  if (e.target.value !== p.nome)
                    updatePeca(p.id, { nome: e.target.value });
                }}
                className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm font-medium"
              />
              <div className="flex gap-2">
                <select
                  defaultValue={p.categoria}
                  onChange={(e) =>
                    updatePeca(p.id, {
                      categoria: e.target.value as PecaCategoria,
                    })
                  }
                  className="rounded-md border border-input bg-background px-1 py-1 text-[11px]"
                >
                  <option value="Mobiliario">Mobiliário</option>
                  <option value="Decoracao">Decoração</option>
                  <option value="Baloes">Balões</option>
                </select>
                <select
                  defaultValue={p.camada_z}
                  onChange={(e) =>
                    updatePeca(p.id, {
                      camada_z: Number(e.target.value) as 1 | 2 | 3 | 4,
                    })
                  }
                  className="rounded-md border border-input bg-background px-1 py-1 text-[11px]"
                >
                  {[1, 2, 3, 4].map((z) => (
                    <option key={z} value={z}>
                      Camada {z}
                    </option>
                  ))}
                </select>
                <button
                  onClick={async () => {
                    if (!confirm(`Remover "${p.nome}"?`)) return;
                    await removeStorage(p.storage_path);
                    await deletePeca(p.id);
                  }}
                  className="ml-auto rounded-md border border-destructive/40 px-2 py-1 text-[11px] text-destructive hover:bg-destructive/10"
                >
                  ✕
                </button>
              </div>
            </div>
          </li>
        ))}
        {pecas.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Nenhuma peça cadastrada. Cadastre PNGs com fundo transparente para
            que apareçam no simulador.
          </p>
        )}
      </ul>
    </div>
  );
}