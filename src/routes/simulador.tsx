import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  subscribePecas,
  subscribeTemas,
  type Peca,
  type PecaCategoria,
  type Tema,
} from "@/lib/firebase-catalog";
import {
  loadCustom,
  loadOverrides,
  mergeCatalog,
  type Product,
} from "@/lib/catalog";

const WHATSAPP = "5562981695886";

type CanvasItem = {
  uid: string;
  pecaId: string;
  nome: string;
  foto_png: string;
  camada_z: number;
  x: number;
  y: number;
  w: number;
};

export const Route = createFileRoute("/simulador")({
  head: () => ({
    meta: [
      { title: "Simulador Pegue e Monte | Jacque Pegue & Monte" },
      {
        name: "description",
        content:
          "Monte digitalmente o cenário da sua festa: arraste móveis, painéis, balões e decoração para o palco e envie seu orçamento pelo WhatsApp.",
      },
      { property: "og:title", content: "Simulador Pegue e Monte" },
      {
        property: "og:description",
        content:
          "Ferramenta interativa para montar seu cenário de festa antes de reservar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "https://jacquepeguemonte.lovable.app/simulador" },
    ],
    links: [
      { rel: "canonical", href: "https://jacquepeguemonte.lovable.app/simulador" },
    ],
  }),
  component: Simulador,
});

const CATEGORIAS: PecaCategoria[] = ["Mobiliario", "Decoracao", "Baloes"];
type Tab = PecaCategoria | "Kits";

function Simulador() {
  const [temas, setTemas] = useState<Tema[]>([]);
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [temaId, setTemaId] = useState<string>("");
  const [tab, setTab] = useState<Tab>("Mobiliario");
  const [items, setItems] = useState<CanvasItem[]>([]);
  const [kitBase, setKitBase] = useState<{ nome: string; baseline: string[] } | null>(
    null,
  );
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [kits, setKits] = useState<Product[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => subscribeTemas(setTemas), []);
  useEffect(() => subscribePecas(setPecas), []);
  useEffect(() => {
    setKits(mergeCatalog(loadOverrides(), loadCustom()));
  }, []);

  const tema = temas.find((t) => t.id === temaId) ?? null;

  const addPeca = (p: Peca) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const w = 110;
    const cx = rect ? rect.width / 2 - w / 2 + (Math.random() * 60 - 30) : 60;
    const cy = rect ? rect.height / 2 - w / 2 + (Math.random() * 60 - 30) : 60;
    setItems((prev) => [
      ...prev,
      {
        uid: `${p.id}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
        pecaId: p.id,
        nome: p.nome,
        foto_png: p.foto_png,
        camada_z: p.camada_z,
        x: Math.max(0, cx),
        y: Math.max(0, cy),
        w,
      },
    ]);
  };

  const removeItem = (uid: string) =>
    setItems((prev) => prev.filter((i) => i.uid !== uid));

  const clearCanvas = () => {
    if (items.length && !confirm("Limpar todo o palco?")) return;
    setItems([]);
    setKitBase(null);
  };

  // Auto-monta um kit escolhendo peças por categoria/camada, com preset posicional.
  const mountKit = (kit: Product) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const W = rect?.width ?? 600;
    const H = rect?.height ?? 400;

    const pickFirst = (pred: (p: Peca) => boolean, n = 1) =>
      pecas.filter(pred).slice(0, n);

    const chosen: Array<{ peca: Peca; x: number; y: number; w: number }> = [];
    // 1 · tapete
    for (const p of pickFirst((p) => p.camada_z === 1)) {
      chosen.push({ peca: p, x: W * 0.15, y: H * 0.65, w: W * 0.7 });
    }
    // 2 · painel/arco (fundo, centro)
    for (const p of pickFirst(
      (p) => p.camada_z === 2 && p.categoria !== "Baloes",
    )) {
      chosen.push({ peca: p, x: W * 0.25, y: H * 0.08, w: W * 0.5 });
    }
    // 2 · balões laterais
    const baloes = pickFirst((p) => p.categoria === "Baloes", 2);
    baloes.forEach((p, i) => {
      chosen.push({
        peca: p,
        x: i === 0 ? W * 0.02 : W * 0.78,
        y: H * 0.15,
        w: W * 0.2,
      });
    });
    // 3 · mesa/cilindros
    const mesa = pickFirst(
      (p) =>
        p.camada_z === 3 &&
        (p.nome.toLowerCase().includes("mesa") ||
          p.categoria === "Mobiliario"),
    );
    mesa.forEach((p) => {
      chosen.push({ peca: p, x: W * 0.3, y: H * 0.55, w: W * 0.4 });
    });
    const cilindros = pecas
      .filter((p) => p.camada_z === 3 && p.nome.toLowerCase().includes("cilindro"))
      .slice(0, 3);
    cilindros.forEach((p, i) => {
      chosen.push({
        peca: p,
        x: W * (0.12 + i * 0.3),
        y: H * 0.45,
        w: W * 0.14,
      });
    });
    // 4 · arranjos / bandejas em cima
    const topo = pickFirst((p) => p.camada_z === 4, 2);
    topo.forEach((p, i) => {
      chosen.push({
        peca: p,
        x: W * (0.35 + i * 0.2),
        y: H * 0.5,
        w: W * 0.12,
      });
    });

    const newItems: CanvasItem[] = chosen.map(({ peca, x, y, w }) => ({
      uid: `${peca.id}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
      pecaId: peca.id,
      nome: peca.nome,
      foto_png: peca.foto_png,
      camada_z: peca.camada_z,
      x,
      y,
      w,
    }));

    setItems(newItems);
    setKitBase({ nome: kit.title, baseline: newItems.map((i) => i.pecaId) });
  };

  // drag
  const onPointerDown = (e: React.PointerEvent, uid: string) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setSelectedUid(uid);
    const item = items.find((i) => i.uid === uid);
    if (!item) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = item.x;
    const origY = item.y;
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      setItems((prev) =>
        prev.map((i) =>
          i.uid === uid ? { ...i, x: origX + dx, y: origY + dy } : i,
        ),
      );
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const sendWhatsapp = () => {
    const lines: string[] = [];
    lines.push("Olá Jacque! Montei meu cenário no simulador Pegue e Monte:");
    if (tema) lines.push(`\n🎨 Tema de inspiração: ${tema.nome}`);
    if (kitBase) {
      lines.push(`\n📦 Kit base: ${kitBase.nome}`);
      const currentIds = items.map((i) => i.pecaId);
      const added = items.filter((i) => !kitBase.baseline.includes(i.pecaId));
      const removed = kitBase.baseline.filter((id) => !currentIds.includes(id));
      if (added.length)
        lines.push(
          `➕ Adicionei: ${added.map((i) => i.nome).join(", ")}`,
        );
      if (removed.length) {
        const names = removed
          .map((id) => pecas.find((p) => p.id === id)?.nome ?? id)
          .join(", ");
        lines.push(`➖ Retirei: ${names}`);
      }
    }
    lines.push("\n🛠️ Peças no palco:");
    if (items.length === 0) lines.push("(nenhuma peça)");
    const count = new Map<string, { nome: string; n: number }>();
    items.forEach((i) => {
      const cur = count.get(i.pecaId);
      if (cur) cur.n++;
      else count.set(i.pecaId, { nome: i.nome, n: 1 });
    });
    count.forEach(({ nome, n }) => lines.push(`• ${n}× ${nome}`));
    const msg = encodeURIComponent(lines.join("\n"));
    window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, "_blank");
  };

  const pecasFiltradas = useMemo(
    () => (tab === "Kits" ? [] : pecas.filter((p) => p.categoria === tab)),
    [pecas, tab],
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3">
          <Link to="/" className="text-sm font-semibold text-primary hover:underline">
            ← Voltar
          </Link>
          <h1 className="text-sm font-bold text-foreground sm:text-base">
            Simulador Pegue e Monte
          </h1>
          <button
            onClick={clearCanvas}
            className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
          >
            Limpar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-3 py-4">
        {/* Topo — inspiração */}
        <section className="mb-3">
          <label
            htmlFor="tema"
            className="block text-xs font-medium text-muted-foreground"
          >
            Escolha um tema de inspiração
          </label>
          <select
            id="tema"
            value={temaId}
            onChange={(e) => setTemaId(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">— Selecionar tema —</option>
            {temas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
          {tema?.foto_inspiracao && (
            <div className="mt-2 overflow-hidden rounded-xl border border-border">
              <img
                src={tema.foto_inspiracao}
                alt={`Inspiração ${tema.nome}`}
                className="h-32 w-full object-cover sm:h-40"
              />
            </div>
          )}
          {temas.length === 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Nenhum tema cadastrado ainda. Cadastre em{" "}
              <Link to="/admin" className="text-primary underline">
                /admin
              </Link>
              .
            </p>
          )}
        </section>

        {/* Centro — canvas */}
        <section>
          <div
            ref={canvasRef}
            onClick={() => setSelectedUid(null)}
            className="relative h-[420px] w-full overflow-hidden rounded-2xl border-2 border-dashed border-primary/40 bg-gradient-to-b from-accent/20 via-background to-muted shadow-inner sm:h-[520px]"
            style={{ touchAction: "none" }}
          >
            {/* linha do chão */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-muted-foreground/10 to-transparent" />
            {items.length === 0 && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center text-xs text-muted-foreground">
                Toque nas peças abaixo para adicioná-las ao palco.
                <br />
                Arraste livremente. Toque uma peça e use ✕ para remover.
              </div>
            )}
            {items
              .slice()
              .sort((a, b) => a.camada_z - b.camada_z)
              .map((it) => (
                <div
                  key={it.uid}
                  onPointerDown={(e) => onPointerDown(e, it.uid)}
                  className={`absolute cursor-grab select-none touch-none active:cursor-grabbing ${
                    selectedUid === it.uid ? "outline outline-2 outline-primary rounded-md" : ""
                  }`}
                  style={{
                    left: it.x,
                    top: it.y,
                    width: it.w,
                    zIndex: it.camada_z * 10,
                  }}
                >
                  <img
                    src={it.foto_png}
                    alt={it.nome}
                    draggable={false}
                    className="pointer-events-none h-auto w-full"
                  />
                  {selectedUid === it.uid && (
                    <button
                      onPointerDown={(e) => {
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(it.uid);
                      }}
                      className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground shadow"
                      aria-label={`Remover ${it.nome}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
          </div>

          <button
            onClick={sendWhatsapp}
            className="mt-3 w-full rounded-xl bg-secondary px-4 py-3 text-sm font-bold text-secondary-foreground shadow hover:opacity-90"
          >
            📲 Enviar Orçamento via WhatsApp
          </button>
          <p className="mt-1 text-center text-[11px] text-muted-foreground">
            {items.length} {items.length === 1 ? "peça" : "peças"} no palco
            {kitBase ? ` · Kit base: ${kitBase.nome}` : ""}
          </p>
        </section>

        {/* Base — catálogo */}
        <section className="mt-4">
          <div className="flex gap-1 overflow-x-auto border-b border-border">
            {CATEGORIAS.map((c) => (
              <button
                key={c}
                onClick={() => setTab(c)}
                className={`whitespace-nowrap px-3 py-2 text-xs font-semibold ${
                  tab === c
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {c}
              </button>
            ))}
            <button
              onClick={() => setTab("Kits")}
              className={`whitespace-nowrap px-3 py-2 text-xs font-semibold ${
                tab === "Kits"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground"
              }`}
            >
              ⭐ Kits Prontos
            </button>
          </div>

          {tab !== "Kits" && (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {pecasFiltradas.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addPeca(p)}
                  className="group flex flex-col items-center rounded-lg border border-border bg-card p-2 text-center hover:border-primary hover:shadow"
                >
                  <img
                    src={p.foto_png}
                    alt={p.nome}
                    className="h-16 w-full object-contain"
                  />
                  <span className="mt-1 line-clamp-2 text-[10px] font-medium text-foreground">
                    {p.nome}
                  </span>
                </button>
              ))}
              {pecasFiltradas.length === 0 && (
                <p className="col-span-full py-6 text-center text-xs text-muted-foreground">
                  Nenhuma peça em <b>{tab}</b>. Cadastre em{" "}
                  <Link to="/admin" className="text-primary underline">
                    /admin
                  </Link>
                  .
                </p>
              )}
            </div>
          )}

          {tab === "Kits" && (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {kits.map((k) => (
                <button
                  key={k.id}
                  onClick={() => mountKit(k)}
                  className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card text-left hover:border-primary hover:shadow"
                >
                  <img
                    src={k.image}
                    alt={k.title}
                    className="h-24 w-full object-cover"
                  />
                  <div className="p-2">
                    <p className="line-clamp-2 text-[11px] font-semibold text-foreground">
                      {k.title}
                    </p>
                    <p className="mt-0.5 text-[10px] text-primary">
                      Auto-montar no palco →
                    </p>
                  </div>
                </button>
              ))}
              {pecas.length === 0 && (
                <p className="col-span-full py-4 text-center text-[11px] text-muted-foreground">
                  Cadastre peças no /admin para os kits serem montados automaticamente.
                </p>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}