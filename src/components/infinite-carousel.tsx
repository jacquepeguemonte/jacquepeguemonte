import { Children, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function InfiniteCarousel({ children, label, kind = "kits" }: {
  children: ReactNode;
  label: string;
  kind?: "kits" | "reviews";
}) {
  const slides = Children.toArray(children);
  const autoScroll = useMemo(() => AutoScroll({ speed: 0.65, startDelay: 1800, playOnInit: false, stopOnInteraction: true, stopOnFocusIn: true, stopOnMouseEnter: true }), []);
  const [viewport, api] = useEmblaCarousel({ loop: true, align: "start", dragFree: true }, [autoScroll]);
  const [index, setIndex] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const region = useRef<HTMLDivElement>(null);
  const hovered = useRef(false);
  const touched = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const resume = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!paused && !reduced && !hovered.current && !touched.current && !region.current?.contains(document.activeElement)) autoScroll.play(0);
    }, 1800);
  }, [autoScroll, paused, reduced]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!api) return;
    const update = () => { setIndex(api.selectedScrollSnap()); setSnaps(api.scrollSnapList()); };
    const reinitialize = () => {
      update();
      if (paused || reduced || hovered.current || region.current?.contains(document.activeElement)) autoScroll.stop();
      else resume();
    };
    update();
    api.on("select", update).on("reInit", reinitialize);
    if (paused || reduced) autoScroll.stop();
    else resume();
    return () => { api.off("select", update).off("reInit", reinitialize); clearTimeout(timer.current); autoScroll.stop(); };
  }, [api, autoScroll, paused, reduced, resume]);

  const navigate = (target: number) => { autoScroll.stop(); api?.scrollTo(target); resume(); };
  const visibleDots = snaps.map((_, i) => i).slice(Math.max(0, Math.min(index - 3, snaps.length - 7)), Math.max(0, Math.min(index - 3, snaps.length - 7)) + 7);

  return (
    <div ref={region} role="region" aria-roledescription="carrossel" aria-label={label}
      onMouseEnter={() => { hovered.current = true; autoScroll.stop(); }}
      onMouseLeave={() => { hovered.current = false; resume(); }}
      onFocusCapture={() => autoScroll.stop()}
      onBlurCapture={resume}
      onPointerDownCapture={() => { touched.current = true; autoScroll.stop(); }}
      onPointerUpCapture={() => { touched.current = false; autoScroll.stop(); resume(); }}
      onPointerCancel={() => { touched.current = false; resume(); }}
      onKeyDown={(event) => {
        if ((event.key === "ArrowRight" || event.key === "ArrowLeft") && event.target === event.currentTarget) {
          event.preventDefault(); navigate(index + (event.key === "ArrowRight" ? 1 : -1));
        }
      }} tabIndex={0} className="relative min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <div ref={viewport} className="overflow-hidden touch-pan-y">
        <div className="-ml-4 flex items-stretch">
          {slides.map((slide, i) => (
            <div key={typeof slide === "object" && slide !== null && "key" in slide ? String(slide.key) : i}
              role="group" aria-roledescription="slide" aria-label={`${i + 1} de ${slides.length}`}
              className={cn("flex min-w-0 shrink-0 grow-0 pl-4", kind === "kits" ? "basis-2/3 sm:basis-1/2 md:basis-1/3 lg:basis-1/4" : "basis-[88%] sm:basis-1/2 lg:basis-1/3")}>
              {slide}
            </div>
          ))}
        </div>
      </div>
      <Button variant="outline" size="icon" title="Anterior" aria-label={`Anterior — ${label}`} disabled={!api?.canScrollPrev()}
        onClick={() => navigate(index - 1)} className="absolute -left-2 top-[38%] z-10 h-10 w-10 rounded-full border-primary/20 bg-card shadow-md sm:-left-4"><ArrowLeft /></Button>
      <Button variant="outline" size="icon" title="Próximo" aria-label={`Próximo — ${label}`} disabled={!api?.canScrollNext()}
        onClick={() => navigate(index + 1)} className="absolute -right-2 top-[38%] z-10 h-10 w-10 rounded-full border-primary/20 bg-card shadow-md sm:-right-4"><ArrowRight /></Button>
      <div className="mt-6 flex min-h-9 items-center justify-center gap-1">
        {visibleDots.map((i) => <Button key={i} variant="ghost" size="icon" className="h-8 w-7 rounded-full" aria-label={`Ir para item ${i + 1} — ${label}`} aria-current={index === i ? "true" : undefined} onClick={() => navigate(i)}>
          <span className={cn("h-2 rounded-full transition-all motion-reduce:transition-none", index === i ? "w-5 bg-primary" : "w-2 bg-primary/25")} />
        </Button>)}
        <span className="ml-2 min-w-12 text-center text-xs tabular-nums text-muted-foreground">{snaps.length ? index + 1 : 0} / {snaps.length}</span>
        {!reduced && snaps.length > 1 && <Button variant="ghost" size="icon" className="ml-1 rounded-full" title={paused ? "Retomar movimento" : "Pausar movimento"} aria-label={paused ? `Retomar — ${label}` : `Pausar — ${label}`} onClick={() => setPaused(!paused)}>{paused ? <Play /> : <Pause />}</Button>}
      </div>
    </div>
  );
}