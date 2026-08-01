import { createServerFn } from "@tanstack/react-start";

/**
 * Recorte inteligente de peças (remoção de fundo) via Remove.bg.
 * A chave fica no servidor (secret REMOVE_BG_API_KEY) e nunca vai para o browser.
 * Recebe a imagem em base64 (data URL ou base64 puro) e devolve um PNG transparente em base64.
 */
export const recortarPecaComIA = createServerFn({ method: "POST" })
  .inputValidator((data: { imageBase64: string; fileName?: string }) => {
    if (!data?.imageBase64) throw new Error("Imagem obrigatória");
    return data;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env["REMOVE_BG_API_KEY"];
    if (!apiKey) throw new Error("REMOVE_BG_API_KEY não configurada");

    const base64 = data.imageBase64.includes(",")
      ? data.imageBase64.split(",")[1]!
      : data.imageBase64;

    const formData = new FormData();
    formData.append("image_file_b64", base64);
    formData.append("size", "auto");
    formData.append("format", "png");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Erro no recorte da IA (${response.status}). ${text.slice(0, 300)}`,
      );
    }

    const buf = new Uint8Array(await response.arrayBuffer());
    let binary = "";
    for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]!);
    return { pngBase64: `data:image/png;base64,${btoa(binary)}` };
  });
