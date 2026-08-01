import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { recortarPecaComIA } from "@/lib/removebg.functions";
import {
  CAMADA_LABELS,
  createPeca,
  uploadImage,
  type PecaCategoria,
} from "@/lib/firebase-catalog";

const ADMIN_PASSWORD = "3282";
const SESSION_KEY = "jpm_admin_session";

export const Route = createFileRoute("/admin_/recorte-ia")({
  head: () => ({
    meta: [
      { title: "Recorte Inteligente com IA | Jacque Pegue & Monte" },
      {
        name: "description",
        content:
          "Ferramenta interna de recorte inteligente de peças: remove o fundo das fotos com IA e salva os PNGs no catálogo do simulador.",
      },
      { property: "og:title", content: "Recorte Inteligente com IA" },
      {
        property: "og:description",
        content: "Remova o fundo das fotos de peças e cadastre no simulador.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: RecorteIA,
});

function RecorteIA() {
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY) === "1") setAuthed(true);
  }, []);

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (pwd === ADMIN_PASSWORD) {
              sessionStorage.setItem(SESSION_KEY, "1");
              setAuthed(true);
            } else setLoginError("Senha incorreta");
          }}
          className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow"
        >
          <h1 className="text-xl font-bold text-foreground">Recorte com IA</h1>
          <p className="mt-1 text-sm text-muted-foreground">Informe a senha para acessar.</p>
          <input
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="Senha"
            className="mt-4 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
            autoFocus
          />
          {loginError && <p className="mt-2 text-xs text-destructive">{loginError}</p>}
          <button
            type="submit"
            className="mt-4 w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Entrar
          </button>
          <Link to="/admin" className="mt-3 block text-center text-xs text-muted-foreground hover:text-primary">
            ← Voltar ao painel
          </Link>
        </form>
      </div>
    );
  }

  return <RecorteTool />;
}

function dataUrlToFile(dataUrl: string, name: string) {
  const [head, b64] = dataUrl.split(",");
  const mime = head?.match(/:(.*?);/)?.[1] ?? "image/png";
  const bin = atob(b64 ?? "");
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new File([arr], name, { type: mime });
}

function RecorteTool() {
  const recortar = useServerFn(recortarPecaComIA);
  const inputRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging] = useState(false);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [resultPng, setResultPng] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState<PecaCategoria>("Mobiliario");
  const [camada, setCamada] = useState<1 | 2 | 3 | 4>(3);
  const [saving, setSaving] = useState(false);

  const handleFile = async (file: File) => {
    setError("");
    setOk("");
    setResultPng(null);
    if (!file.type.startsWith("image/")) {
      setError("Envie um arquivo de imagem (JPG, PNG ou WEBP).");
      return;
    }
    const reader = new FileReader();
    const dataUrl: string = await new Promise((res, rej) => {
      reader.onload = () => res(reader.result as string);
      reader.onerror = () => rej(new Error("Falha ao ler o arquivo"));
      reader.readAsDataURL(file);
    });
    setOriginalPreview(dataUrl);
    if (!nome) setNome(file.name.replace(/\.[^.]+$/, ""));

    setBusy(true);
    try {
      const { pngBase64 } = await recortar({
        data: { imageBase64: dataUrl, fileName: file.name },
      });
      setResultPng(pngBase64);
    } catch (err) {
      setError((err as Error).message || "Erro no recorte da IA");
    } finally {
      setBusy(false);
    }
  };

  const salvar = async () => {
    if (!resultPng || !nome) return;
    setSaving(true);
    setError("");
    try {
      const file = dataUrlToFile(
        resultPng,
        `${nome.toLowerCase().replace(/\s+/g, "-")}.png`,
      );
      const { url, path } = await uploadImage("pecas", file);
      await createPeca({
        nome,
        categoria,
        camada_z: camada,
        foto_png: url,
        storage_path: path,
      });
      setOk(`Peça "${nome}" salva no Firebase e já disponível no simulador.`);
      setResultPng(null);
      setOriginalPreview(null);
      setNome("");
    } catch (err) {
      setError("Erro ao salvar: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-lg font-bold text-foreground">Recorte Inteligente de Peças (IA)</h1>
            <p className="text-xs text-muted-foreground">
              Suba a foto de um kit ou item, a IA remove o fundo e você cadastra a peça no simulador.
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin" className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted">
              Painel
            </Link>
            <Link to="/simulador" className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted">
              Simulador
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) void handleFile(f);
          }}
          onClick={() => inputRef.current?.click()}
          className={`grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition ${
            dragging ? "border-primary bg-primary/5" : "border-border bg-card"
          }`}
        >
          <p className="text-sm font-semibold text-foreground">
            Arraste a foto aqui ou clique para selecionar
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            JPG, PNG ou WEBP · a IA devolve um PNG com fundo transparente
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = "";
            }}
          />
        </div>

        {busy && (
          <p className="mt-4 text-sm text-muted-foreground">Recortando com IA…</p>
        )}
        {error && (
          <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        {ok && (
          <p className="mt-4 rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-sm text-primary">
            {ok}
          </p>
        )}

        {(originalPreview || resultPng) && (
          <section className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              {originalPreview && (
                <figure className="rounded-xl border border-border bg-card p-3">
                  <figcaption className="mb-2 text-xs font-semibold text-muted-foreground">
                    Original
                  </figcaption>
                  <img src={originalPreview} alt="Foto original enviada" className="max-h-64 w-full object-contain" />
                </figure>
              )}
              {resultPng && (
                <figure className="rounded-xl border border-border bg-[conic-gradient(#0000_90deg,#8883_0_180deg,#0000_0_270deg,#8883_0)] bg-[length:20px_20px] p-3">
                  <figcaption className="mb-2 text-xs font-semibold text-foreground">
                    Peça recortada (PNG transparente)
                  </figcaption>
                  <img src={resultPng} alt="Peça recortada com fundo transparente" className="max-h-64 w-full object-contain" />
                </figure>
              )}
            </div>

            {resultPng && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void salvar();
                }}
                className="h-fit space-y-3 rounded-xl border border-border bg-card p-4"
              >
                <h2 className="text-sm font-bold text-foreground">Dados da peça</h2>
                <div>
                  <label htmlFor="peca-nome" className="text-xs text-muted-foreground">Nome da peça</label>
                  <input
                    id="peca-nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Cilindro dourado"
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="peca-cat" className="text-xs text-muted-foreground">Categoria</label>
                  <select
                    id="peca-cat"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as PecaCategoria)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="Mobiliario">Mobiliário</option>
                    <option value="Decoracao">Decoração</option>
                    <option value="Baloes">Balões</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="peca-camada" className="text-xs text-muted-foreground">Camada Z</label>
                  <select
                    id="peca-camada"
                    value={camada}
                    onChange={(e) => setCamada(Number(e.target.value) as 1 | 2 | 3 | 4)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {[1, 2, 3, 4].map((z) => (
                      <option key={z} value={z}>
                        {z} - {CAMADA_LABELS[z]}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={saving || !nome}
                  className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "Salvando…" : "Salvar Peça no Firebase"}
                </button>
              </form>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
