/** Resize to max 1920px and convert to WebP in the browser, then upload to Netlify Blobs via /api/media/upload. Returns a same-origin URL. */
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
  const form = new FormData();
  form.append("file", blob, `upload.${ext}`);
  form.append("folder", folder);
  const res = await fetch("/api/media/upload", { method: "POST", body: form });
  if (!res.ok) throw new Error((await res.text().catch(() => "")) || "Upload failed");
  const { path } = (await res.json()) as { path: string };
  return path;
}

export function errMsg(e: unknown) {
  return e instanceof Error ? e.message : typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : String(e);
}
