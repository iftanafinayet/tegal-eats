import { supabase } from "../../supabaseClient";
import { normalizePlace, normalizeReview, PlaceRecord, ReviewRecord } from "./contracts";
import { resolveStorageUrl, resolveStorageUrls } from "./storage";

function cleanText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export async function fetchPlaces() {
  const { data, error } = await supabase.from("app_places").select("*").order("avg_rating", { ascending: false });
  if (error) throw error;
  return Promise.all(
    (data || []).map(async (place) => {
      const normalized = normalizePlace(place as PlaceRecord);
      return {
        ...normalized,
        imageUrl: await resolveStorageUrl(normalized.imageUrl),
      };
    })
  );
}

export async function fetchPlaceById(id: string) {
  const { data, error } = await supabase.from("app_places").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const normalized = normalizePlace(data as PlaceRecord);
  return {
    ...normalized,
    imageUrl: await resolveStorageUrl(normalized.imageUrl),
  };
}

export async function fetchPlaceNameById(id: string) {
  const place = await fetchPlaceById(id);
  return place?.name || "Tempat Ini";
}

export async function fetchMapPlaces(limit = 50) {
  const { data, error } = await supabase.from("app_places").select("*").limit(limit);
  if (error) throw error;
  const resolved = await Promise.all(
    (data || []).map(async (place) => {
      const normalized = normalizePlace(place as PlaceRecord);
      return {
        ...normalized,
        imageUrl: await resolveStorageUrl(normalized.imageUrl),
      };
    })
  );
  return resolved.filter((place) => place.lat != null && place.lng != null);
}

export async function fetchFavoritePlaces(placeIds: string[]) {
  if (placeIds.length === 0) return [];
  const { data, error } = await supabase
    .from("app_places")
    .select("*")
    .in("id", placeIds)
    .order("avg_rating", { ascending: false });

  if (error) throw error;
  return Promise.all(
    (data || []).map(async (place) => {
      const normalized = normalizePlace(place as PlaceRecord);
      return {
        ...normalized,
        imageUrl: await resolveStorageUrl(normalized.imageUrl),
      };
    })
  );
}

export async function fetchReviewsForPlace(placeId: string) {
  const { data, error } = await supabase
    .from("app_reviews")
    .select("*")
    .eq("place_id", placeId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return Promise.all(
    (data || []).map(async (review) => {
      const normalized = normalizeReview(review as ReviewRecord, placeId);
      return {
        ...normalized,
        avatarUrl: (await resolveStorageUrl(normalized.avatarUrl)) || normalized.avatarUrl,
        imageUrls: (await resolveStorageUrls(normalized.imageUrls)).filter(Boolean) as string[],
      };
    })
  );
}

export async function fetchUserReviews(userId: string) {
  const { data, error } = await supabase
    .from("app_reviews")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw error;
  return Promise.all(
    (data || []).map(async (review) => {
      const normalized = normalizeReview(review as ReviewRecord);
      return {
        ...normalized,
        avatarUrl: (await resolveStorageUrl(normalized.avatarUrl)) || normalized.avatarUrl,
        imageUrls: (await resolveStorageUrls(normalized.imageUrls)).filter(Boolean) as string[],
      };
    })
  );
}

export async function createPlace(input: {
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  imageUrl: string | null;
  description?: string;
  hours?: string | null;
  priceLabel?: string | null;
}) {
  const payload = {
    name: cleanText(input.name),
    category: cleanText(input.category).toLowerCase(),
    address: cleanText(input.address),
    lat: input.lat,
    lng: input.lng,
    description: input.description ? cleanText(input.description) : "",
    hours: input.hours || null,
    price_range: input.priceLabel || null,
    avg_rating: 0,
    review_count: 0,
    image_url: input.imageUrl,
  };

  const { data, error } = await supabase
    .from("places")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;

  if (input.imageUrl && !data?.image_url) {
    throw new Error("Image URL tidak tersimpan di tabel places. Periksa schema/policy Supabase untuk kolom image_url.");
  }

  return data as PlaceRecord;
}

export async function importInternetPlace(input: {
  name: string;
  address: string;
  lat: number;
  lng: number;
  category?: string;
  description?: string;
}) {
  const normalizedName = cleanText(input.name);
  const normalizedAddress = cleanText(input.address);

  const { data: existingByName, error: existingError } = await supabase
    .from("app_places")
    .select("*")
    .ilike("name", normalizedName)
    .limit(1)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existingByName) return normalizePlace(existingByName as PlaceRecord);

  await createPlace({
    name: normalizedName,
    category: input.category || "coffee",
    address: normalizedAddress,
    lat: input.lat,
    lng: input.lng,
    imageUrl: null,
    description: input.description || "",
    hours: null,
    priceLabel: null,
  });
}

export async function createReview(input: {
  placeId: string;
  userId: string;
  rating: number;
  comment: string;
  photoUrls: string[];
  placeName: string;
  userName: string;
  avatarUrl: string | null;
}) {
  const { error } = await supabase.from("reviews").insert({
    place_id: input.placeId,
    user_id: input.userId,
    rating: input.rating,
    comment: cleanText(input.comment),
    photo_urls: input.photoUrls,
    place_name: cleanText(input.placeName),
    username: cleanText(input.userName),
    avatar_url: input.avatarUrl,
    upvote_count: 0,
  });

  if (error) throw error;
}

export async function isPlaceFavorited(userId: string, placeId: string) {
  const { data, error } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("place_id", placeId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function listFavoritePlaceIds(userId: string) {
  const { data, error } = await supabase
    .from("favorites")
    .select("place_id")
    .eq("user_id", userId);

  if (error) throw error;
  return (data || []).map((item) => String(item.place_id));
}

export async function setPlaceFavorite(userId: string, placeId: string, shouldFavorite: boolean) {
  if (shouldFavorite) {
    const { error } = await supabase.from("favorites").insert({ user_id: userId, place_id: placeId });
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("favorites").delete().eq("user_id", userId).eq("place_id", placeId);
  if (error) throw error;
}

// --- Admin API ---

export async function listAllPlaces() {
  const { data, error } = await supabase.from("places").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as PlaceRecord[];
}

export async function listAllReviews() {
  const { data, error } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as ReviewRecord[];
}

export async function updatePlace(
  id: string,
  fields: Partial<{
    name: string;
    category: string;
    address: string;
    lat: number;
    lng: number;
    hours: string;
    price_range: string;
    description: string;
    image_url: string;
  }>
) {
  const { data, error } = await supabase
    .from("places")
    .update(fields)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    throw new Error("Place tidak ditemukan atau update ditolak oleh policy database.");
  }

  if (fields.image_url && !data.image_url) {
    throw new Error("Image URL tidak tersimpan di tabel places. Periksa schema/policy Supabase untuk kolom image_url.");
  }

  return data as PlaceRecord;
}

export async function deletePlace(id: string) {
  const { error } = await supabase.from("places").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteReview(id: string) {
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw error;
}
