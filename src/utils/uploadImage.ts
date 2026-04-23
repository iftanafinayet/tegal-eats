import { supabase } from "../supabaseClient";

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const DEFAULT_BUCKET = "images";

function normalizeEnvValue(value: string | undefined) {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  return normalized;
}

function getBucketName() {
  return normalizeEnvValue(process.env.REACT_APP_SUPABASE_STORAGE_BUCKET) || DEFAULT_BUCKET;
}

function buildObjectPath(folder: string, file: File) {
  const normalizedFolder = folder.replace(/[^a-z0-9/_-]/gi, "-");
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const objectId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return `tegal-eats/${normalizedFolder}/${objectId}.${extension}`;
}

/**
 * Upload an image file to Supabase Storage and return its public URL.
 * The configured bucket must be public for persisted display URLs to work directly in the app.
 */
export async function uploadImage(file: File, folder: string): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("File harus berupa gambar.");
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Ukuran gambar maksimal 10MB.");
  }

  const bucket = getBucketName();
  const objectPath = buildObjectPath(folder, file);

  const { error: uploadError } = await supabase.storage.from(bucket).upload(objectPath, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    throw new Error(`Upload gagal ke Supabase Storage: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  if (!data.publicUrl) {
    throw new Error("Supabase Storage tidak mengembalikan public URL.");
  }

  return data.publicUrl;
}
