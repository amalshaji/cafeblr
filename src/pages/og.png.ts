import type { APIRoute } from "astro";
import { renderOgPng } from "@/src/lib/og-image";

export const prerender = true;

export const GET: APIRoute = async () =>
  new Response(await renderOgPng(), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
