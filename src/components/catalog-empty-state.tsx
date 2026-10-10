import { MessageCircle, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CatalogEmptyState({ filtered = false }: { filtered?: boolean }) {
  return <div role="status" className="flex flex-col items-center px-2 py-12 text-center">
    <PartyPopper className="mb-4 h-9 w-9 text-primary" aria-hidden="true" />
    <h3 className="text-xl font-semibold text-foreground">{filtered ? "Seu tema pode estar esperando por você!" : "Vamos encontrar o cenário da sua festa?"}</h3>
    <p className="mt-2 max-w-lg text-sm text-muted-foreground">{filtered ? "Não encontramos kits com esses filtros. Conte para a gente o que você imagina para a sua comemoração." : "Ainda não há temas disponíveis aqui. Fale com a Jacque para conhecer as opções para sua data."}</p>
    <Button asChild className="mt-5 h-auto min-h-12 max-w-full whitespace-normal px-5 py-3 text-sm font-semibold">
      <a href="https://wa.me/5562981695886?text=Ol%C3%A1!%20N%C3%A3o%20encontrei%20meu%20tema.%20Podem%20me%20ajudar%20a%20escolher%20um%20kit%20para%20minha%20festa%3F" target="_blank" rel="noreferrer"><MessageCircle />Não encontrou o seu tema? Chame a gente no WhatsApp!</a>
    </Button>
  </div>;
}