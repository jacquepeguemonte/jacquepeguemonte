import { Quote, Star } from "lucide-react";
import { InfiniteCarousel } from "@/components/infinite-carousel";

// Real Google reviews supplied by the owner (5.0, 15 reviews).
const REVIEWS = [
  { name: "Gabriella Munique", text: "Quero agradecer Jacque pelo capricho e carinho em cada detalhe! Ela é uma excelente profissional, super caprichosa, e os artigos de decoração são um mais lindo que o outro... Recomendo de olhos fechados para todo mundo! O trabalho dela vale muito a pena e faz toda a diferença na decoração da festa 👏" },
  { name: "Geovana Barbosa", text: "Jaque super rápida, atenciosa, pediu o tema que eu queria pq ela ainda não tinha. Com ctz farei novas festas com ela e indicarei para amigos!" },
  { name: "Kátia Fleury", text: "Minha experiência foi excelente. Ela entrega no prazo combinado. Tem um preço maravilhoso. Indico muito. Caprichosa!" },
  { name: "Jessica Valentin", text: "Tudo maravilhoso! Produtos e atendimento excelentes. 👏👏👏" },
  { name: "Ana Paula Vieira da Silva", text: "Excelente o serviço prestado!" },
  { name: "Isabela Castro Alves de Paula", text: "A melhor e mais completa!! Tudo de excelente qualidade e com os melhores preços 🤌🤌" },
  { name: "Valeria Leao", text: "Ficou tudo muito lindo. Materiais de excelência, tudo novinho." },
  { name: "Franciele Carrilho", text: "Perfeita!! Decoração impecável sem defeitos." },
  { name: "Nil Késia Silva", text: "Maravilhosa! Ela entrega no prazo combinado, tem um preço maravilhoso! Só aluguem, vcs irão amar. E olha que nem comentei da qualidade e beleza." },
  { name: "Amanda Emilly", text: "Simplesmente perfeita, Jacque super atenciosa, materiais bons e novos, pontual, compromissada, atendeu todas as minhas vontades. Eu amei de mais da conta." },
  { name: "Danubia Gomes", text: "Super indico!!! O melhor da cidade!!!!" },
  { name: "Joseane Elias", text: "Maravilhoso! A Jacque é super atenciosa e prestativa. As peças estavam novas e conservadas. Certamente quando precisar irei alugar dela. Super recomendo." },
  { name: "Reinaldo Freitas", text: "Recomendo preço justo" },
  { name: "Rayara Monteiro", text: "Simplesmente perfeito 👑 ❤️" },
  { name: "Talita Santos", text: "Nota mil ❤️ vou contratar mais vezes, super atenciosa, o pegue monte super fácil e prático ameii ❤️" },
  { name: "Professora Ludmila Espindola", text: "Ficou mais lindo que pensei, amei muito. Obrigada pelo carinho!" },
];

const GOOGLE_URL = "https://share.google/avc5Vr49EypK8L14i";

export function CustomerTestimonials() {
  return <section aria-labelledby="depoimentos-titulo" className="border-t border-border bg-muted/40 py-14">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase text-primary">Quem contrata, recomenda</span>
          <h2 id="depoimentos-titulo" className="mt-2 text-3xl font-bold text-foreground">Avaliações de Clientes</h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex gap-0.5 text-gold">{Array.from({ length: 5 }, (_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</span>
            <strong className="text-foreground">5.0</strong> · 16 avaliações no Google
          </p>
        </div>
        <a href={GOOGLE_URL} target="_blank" rel="noopener noreferrer" className="rounded-full border border-primary px-5 py-2 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground">Ver no Google</a>
      </div>
      <InfiniteCarousel label="Avaliações de clientes" kind="reviews">
        {REVIEWS.map((review) => <article key={review.name} className="flex h-full w-full flex-col rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-1 text-gold" aria-label="5 estrelas">{Array.from({ length: 5 }, (_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
            <Quote className="h-6 w-6 text-primary/25" aria-hidden="true" />
          </div>
          <blockquote className="mt-5 flex-1 text-sm leading-relaxed text-foreground">“{review.text}”</blockquote>
          <div className="mt-6 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-t border-border pt-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/20 font-bold text-primary">{review.name[0]}</span>
            <div className="min-w-0"><p className="text-sm font-semibold text-foreground">{review.name}</p><p className="text-xs text-muted-foreground">Avaliação no Google</p></div>
          </div>
        </article>)}
      </InfiniteCarousel>
    </div>
  </section>;
}
