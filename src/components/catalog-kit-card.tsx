import { MapPin, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProductPhotos, type Product } from "@/lib/catalog";

export function CatalogKitCard({ product, quantity, onQuantity, onDetails, onAvailability }: {
  product: Product; quantity: number; onQuantity: (delta: number) => void;
  onDetails: () => void; onAvailability: () => void;
}) {
  const photos = getProductPhotos(product).length;
  return <article className="group flex w-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
    <div className="relative aspect-square overflow-hidden bg-muted">
      <img src={product.image} alt={product.title} loading="lazy" draggable={false} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none" />
      <span className="absolute left-2 top-2 rounded-full bg-gold px-2 py-1 text-[10px] font-bold text-gold-foreground">Pegue e Monte</span>
      {photos > 1 && <span className="absolute bottom-2 right-2 rounded-full bg-card/90 px-2 py-1 text-[10px] font-bold text-primary">{photos} fotos</span>}
    </div>
    <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
      <h3 className="line-clamp-2 min-h-10 text-sm font-semibold text-foreground">{product.title}</h3>
      <p className="text-xs text-muted-foreground">a partir de <strong className="block text-lg text-primary">{product.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></p>
      <p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3 shrink-0" />Goianésia - GO</p>
      <p className="text-[11px] text-muted-foreground">Balões não incluso</p>
      <div className="mt-auto grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 pt-2">
        <div className="flex shrink-0 items-center rounded-md border border-border">
          <Button variant="ghost" size="icon" className="h-8 w-7" disabled={!quantity} aria-label={`Remover ${product.title}`} onClick={() => onQuantity(-1)}><Minus /></Button>
          <span className="min-w-5 text-center text-sm tabular-nums">{quantity}</span>
          <Button variant="ghost" size="icon" className="h-8 w-7" aria-label={`Adicionar ${product.title}`} onClick={() => onQuantity(1)}><Plus /></Button>
        </div>
        <Button variant="outline" size="sm" className="min-w-0 whitespace-normal px-1 text-primary" onClick={onDetails}>Ver detalhes</Button>
        <Button className="col-span-2 h-auto min-h-10 whitespace-normal px-2 text-xs" onClick={onAvailability}>Verificar disponibilidade</Button>
      </div>
    </div>
  </article>;
}