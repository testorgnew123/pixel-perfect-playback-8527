// AES-GCM encryption for traveller ID numbers. Key comes from the ID_ENCRYPTION_KEY secret.
async function key() {
  const raw = new TextEncoder().encode(process.env["ID_ENCRYPTION_KEY"] ?? "");
  if (!raw.length) throw new Error("ID_ENCRYPTION_KEY missing");
  const digest = await crypto.subtle.digest("SHA-256", raw);
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function encryptText(plain: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(), new TextEncoder().encode(plain)));
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv); out.set(ct, iv.length);
  return b64(out);
}
export async function decryptText(cipher: string) {
  const all = unb64(cipher);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: all.slice(0, 12) }, await key(), all.slice(12));
  return new TextDecoder().decode(pt);
}
