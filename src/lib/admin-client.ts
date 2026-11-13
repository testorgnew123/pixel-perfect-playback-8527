import { supabase } from "@/integrations/supabase/client";

export async function audit(action: string, entity: string, entityId?: string | null, details?: unknown) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("audit_logs").insert({ actor_id: data.user.id, action, entity, entity_id: entityId ?? null, details: (details ?? null) as never });
}

/** Resize to max 1920px and convert to WebP in the browser, then upload to the media bucket. Returns a same-origin URL. */
export async function uploadImage(file: File, folder = "uploads"): Promise<string> {
  let blob: Blob = file;
  let ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  if (file.type.startsWith("image/") && file.type !== "image/gif" && file.type !== "image/svg+xml") {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1920 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("Compression failed"))), "image/webp", 0.82));
    ext = "webp";
  }
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, blob, { contentType: blob.type || file.type, upsert: false });
  if (error) throw new Error(error.message);
  return `/media/${path}`;
}

export function errMsg(e: unknown) {
  return e instanceof Error ? e.message : typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : String(e);
}
