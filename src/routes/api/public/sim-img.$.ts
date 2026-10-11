import { createFileRoute } from "@tanstack/react-router";

// Serves simulator images (themes and pieces) from the private storage bucket.
// Only files inside the "temas/" and "pecas/" folders are readable.
export const Route = createFileRoute("/api/public/sim-img/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = (params as { _splat?: string })._splat ?? "";
        if (!/^(temas|pecas)\/[\w.-]+$/.test(path)) return new Response("Not found", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("simulador").download(path);
        if (error || !data) return new Response("Not found", { status: 404 });
        return new Response(data, {
          headers: {
            "Content-Type": data.type || "application/octet-stream",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
