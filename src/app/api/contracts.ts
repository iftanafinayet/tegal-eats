export type PlaceRecord = {
  id: string;
  name: string;
  image_url?: string | null;
  avg_rating?: number | null;
  category?: string | null;
  distance_km?: number | null;
  price_range?: string | null;
  review_count?: number | null;
  description?: string | null;
  hours?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export type ReviewRecord = {
  id?: string | number | null;
  place_id?: string | null;
  user_id?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  rating?: number | null;
  comment?: string | null;
  photo_urls?: string[] | null;
  upvote_count?: number | null;
  created_at?: string | null;
  place_name?: string | null;
};

export type AppPlace = {
  id: string;
  name: string;
  category: string;
  imageUrl: string | null;
  rating: number;
  reviewCount: number;
  distanceKm: number | null;
  priceLabel: string;
  description: string;
  hours: string;
  address: string;
  lat: number | null;
  lng: number | null;
};

export type AppReview = {
  id: string;
  placeId: string | null;
  userId: string | null;
  userName: string;
  avatarUrl: string;
  rating: number;
  comment: string;
  imageUrls: string[];
  likes: number;
  createdAt: string | null;
  placeName: string;
};

export function inferBudgetTier(priceLabel: string) {
  const value = String(priceLabel || "").toLowerCase();
  if (value.includes("$$$") || value.includes("premium") || value.includes("fine")) return "premium";
  if (value.includes("$$") || value.includes("sedang") || value.includes("mid")) return "sedang";
  if (value.includes("$") || value.includes("hemat") || value.includes("cheap")) return "hemat";
  return "sedang"; // Default fallback
}

export function formatBudgetLabel(priceLabel: string) {
  const tier = inferBudgetTier(priceLabel);
  if (tier === "premium") return "Premium ($$$)";
  if (tier === "sedang") return "Sedang ($$)";
  return "Hemat ($)";
}

export function normalizePlace(record: PlaceRecord): AppPlace {
  return {
    id: String(record.id),
    name: record.name || "Tempat",
    category: record.category || "venue",
    imageUrl: record.image_url || null,
    rating: record.avg_rating ?? 0,
    reviewCount: record.review_count ?? 0,
    distanceKm: record.distance_km ?? null,
    priceLabel: formatBudgetLabel(record.price_range || ""),
    description: record.description || "",
    hours: record.hours || "Cek jam operasional",
    address: record.address || "Alamat belum tersedia",
    lat: record.lat ?? null,
    lng: record.lng ?? null,
  };
}

export function normalizeReview(record: ReviewRecord, fallbackPlaceId?: string): AppReview {
  return {
    id: String(record.id ?? `${fallbackPlaceId || "review"}-${record.created_at || "item"}`),
    placeId: record.place_id || fallbackPlaceId || null,
    userId: record.user_id || null,
    userName: record.username || "anon",
    avatarUrl: record.avatar_url || "https://i.pravatar.cc/150?img=12",
    rating: record.rating ?? 0,
    comment: record.comment || "",
    imageUrls: record.photo_urls || [],
    likes: record.upvote_count ?? 0,
    createdAt: record.created_at || null,
    placeName: record.place_name || "Tempat",
  };
}

export function isPlaceOpenNow(hours: string) {
  const value = hours.toLowerCase();
  if (!value || value.includes("cek") || value.includes("belum")) return false;
  if (value.includes("24")) return true;
  if (value.includes("tutup") || value.includes("closed")) return false;

  try {
    // Expected format: "HH:mm - HH:mm" or "HH:mm-HH:mm"
    const parts = value.split(/[-–—]/).map((p) => p.trim());
    if (parts.length !== 2) return true; // Fallback if format is weird but not explicitly closed

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = parts[0].split(":").map(Number);
    const [endH, endM] = parts[1].split(":").map(Number);

    const startTime = startH * 60 + startM;
    let endTime = endH * 60 + endM;

    // Handle overnight hours (e.g., 15:00 - 03:00)
    if (endTime < startTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }

    return currentTime >= startTime && currentTime <= endTime;
  } catch (e) {
    return true; // Fallback
  }
}
