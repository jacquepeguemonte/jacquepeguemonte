import { Quote, Star } from "lucide-react";
import { InfiniteCarousel } from "@/components/infinite-carousel";

const EXAMPLES = [
  { occasion: "Festa infantil", text: "A decoração deixou o aniversário ainda mais especial. Tudo combinou com o tema que imaginamos!" },
  { occasion: "Chá de bebê", text: "Um cenário delicado para um dia cheio de carinho. As fotos ficaram lindas e a montagem foi tranquila." },
  { occasion: "Aniversário adulto", text: "O kit deu um toque especial à comemoração. Uma opção prática para celebrar com a família." },
  { occasion: "Festa temática", text: "Adoramos a combinação das peças. A mesa ficou cheia de personalidade e do jeitinho que queríamos." },
];

export function CustomerTestimonials() {
  return <section aria-labelledby="depoimentos-titulo" className="border-t border-border bg-muted/40 py-14">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-7">
        <span className="text-xs font-semibold uppercase text-primary">Momentos para celebrar</span>
        <h2 id="depoimentos-titulo" className="mt-2 text-3xl font-bold text-foreground">Depoimentos de Clientes</h2>
        <p className="mt-2 text-sm text-muted-foreground">Avaliações ilustrativas — não são depoimentos reais nem avaliações do Google.</p>
      </div>
      <InfiniteCarousel label="Depoimentos de clientes" kind="reviews">
        {EXAMPLES.map((review) => <article key={review.occasion} className="flex w-full flex-col rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-1 text-gold" aria-label="5 estrelas ilustrativas">{Array.from({ length: 5 }, (_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
            <Quote className="h-6 w-6 text-primary/25" aria-hidden="true" />
          </div>
          <blockquote className="mt-5 flex-1 text-sm leading-relaxed text-foreground">“{review.text}”</blockquote>
          <div className="mt-6 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-t border-border pt-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/20 text-primary"><Quote className="h-4 w-4" /></span>
            <div className="min-w-0"><p className="text-sm font-semibold text-foreground">{review.occasion}</p><p className="text-xs text-muted-foreground">Exemplo ilustrativo</p></div>
          </div>
        </article>)}
      </InfiniteCarousel>
    </div>
  </section>;
}