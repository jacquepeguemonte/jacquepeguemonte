import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

// Serve o arquivo de verificação do Google Search Console (googleXXXX.html)
// diretamente na raiz do site, sem precisar subir o arquivo manualmente.
export const Route = createFileRoute("/google{$}")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const rest = (params as { _splat?: string })._splat ?? "";
        const fileName = `google${rest}`;

        // Só responde a nomes válidos: google<token>.html
        if (!/^google[a-z0-9]+\.html$/i.test(fileName)) {
          return new Response("Not Found", { status: 404 });
        }

        return new Response(`google-site-verification: ${fileName}`, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});