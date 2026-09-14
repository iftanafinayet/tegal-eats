const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

export async function uploadImage(file: File, folder: string): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("File harus berupa gambar.");
  if (file.size > MAX_IMAGE_SIZE_BYTES) throw new Error("Ukuran gambar maksimal 10MB.");
  const form = new FormData();
  form.set("file", file);
  form.set("folder", folder);
  const response = await fetch("/api/upload", { method: "POST", body: form });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Upload gambar gagal.");
  return body.url;
}
