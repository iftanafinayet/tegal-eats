import { supabase, supabaseUrl } from "../../supabaseClient";

const SIGNED_URL_TTL_SECONDS = 60 * 60;
const signedUrlCache = new Map<string, { expiresAt: number; url: string }>();

function parseSupabaseStorageUrl(value: string) {
  if (!value) return null;

  if (value.startsWith("supabase://")) {
    const remainder = value.slice("supabase://".length);
    const slashIndex = remainder.indexOf("/");
    if (slashIndex <= 0) return null;

    return {
      bucket: remainder.slice(0, slashIndex),
      path: remainder.slice(slashIndex + 1),
    };
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const normalizedBase = supabaseUrl.replace(/\/+$/, "");
  if (url.origin !== normalizedBase) {
    return null;
  }

  const publicMatch = url.pathname.match(/^\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (publicMatch) {
    return {
      bucket: decodeURIComponent(publicMatch[1]),
      path: decodeURIComponent(publicMatch[2]),
    };
  }

  const signMatch = url.pathname.match(/^\/storage\/v1\/object\/sign\/([^/]+)\/(.+)$/);
  if (signMatch) {
    return {
      bucket: decodeURIComponent(signMatch[1]),
      path: decodeURIComponent(signMatch[2]),
    };
  }

  return null;
}

export async function resolveStorageUrl(value: string | null | undefined) {
  if (!value) return null;

  const parsed = parseSupabaseStorageUrl(value);
  if (!parsed) {
    return value;
  }

  const cacheKey = `${parsed.bucket}/${parsed.path}`;
  const cached = signedUrlCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  const { data, error } = await supabase.storage
    .from(parsed.bucket)
    .createSignedUrl(parsed.path, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    return value;
  }

  signedUrlCache.set(cacheKey, {
    url: data.signedUrl,
    expiresAt: Date.now() + (SIGNED_URL_TTL_SECONDS - 30) * 1000,
  });

  return data.signedUrl;
}

export async function resolveStorageUrls(values: string[] | null | undefined) {
  if (!values?.length) return [];
  return Promise.all(values.map((value) => resolveStorageUrl(value)));
}
