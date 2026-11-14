import { createFileRoute } from "@tanstack/react-router";
import { getStore } from "@netlify/blobs";
import { auth } from "@/lib/auth.server";
import { isStaff } from "@/lib/roles.server";

// Staff-gated upload target for admin-client.ts's uploadImage(). Replaces
// the old direct-from-browser Supabase Storage upload — Netlify Blobs is
// server-only, so the already-resized/WebP blob is posted here instead.
export const Route = createFileRoute("/api/media/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user || !(await isStaff(session.user.id))) return new Response("Unauthorized", { status: 401 });

        const form = await request.formData();
        const file = form.get("file");
        const folder = String(form.get("folder") ?? "uploads").replace(/[^a-z0-9/_-]/gi, "");
        if (!(file instanceof File)) return new Response("No file", { status: 400 });

        const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
        const path = `${folder}/${crypto.randomUUID()}.${ext}`;
        const store = getStore("media");
        await store.set(path, await file.arrayBuffer(), { metadata: { contentType: file.type || "application/octet-stream" } });
        return Response.json({ path: `/media/${path}` });
      },
    },
  },
});
