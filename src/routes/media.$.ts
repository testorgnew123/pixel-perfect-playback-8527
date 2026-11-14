import { createFileRoute } from "@tanstack/react-router";
import { getStore } from "@netlify/blobs";

// Serves uploaded images from the "media" Netlify Blobs store at /media/<path>.
export const Route = createFileRoute("/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = (params as { _splat?: string })._splat ?? "";
        if (!path || path.includes("..")) return new Response("Not found", { status: 404 });
        const store = getStore("media");
        const result = await store.getWithMetadata(path, { type: "arrayBuffer" });
        if (!result) return new Response("Not found", { status: 404 });
        return new Response(result.data, {
          headers: { "content-type": (result.metadata["contentType"] as string | undefined) || "image/webp", "cache-control": "public, max-age=31536000, immutable" },
        });
      },
    },
  },
});
