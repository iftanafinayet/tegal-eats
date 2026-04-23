import { User, PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../supabaseClient";
import { AppReview, normalizeReview, ReviewRecord } from "./contracts";
import { fetchPlaceNameById } from "./places";
import { resolveStorageUrl, resolveStorageUrls } from "./storage";

async function resolveReviewMedia(review: AppReview) {
  return {
    ...review,
    avatarUrl: (await resolveStorageUrl(review.avatarUrl)) || review.avatarUrl,
    imageUrls: (await resolveStorageUrls(review.imageUrls)).filter(Boolean) as string[],
  };
}

export type SocialProfile = {
  userId: string;
  handle: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  reviewCount: number;
  averageRating: number;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
};

export type SocialActivityItem = {
  id: string;
  kind: "review";
  actor: SocialProfile;
  review: AppReview;
  placeName: string;
  relativeLabel: string;
  emphasis: string;
};

export type ProfileTimelineItem = {
  id: string;
  title: string;
  detail: string;
  relativeLabel: string;
  placeName: string;
};

type PublicProfileRow = {
  user_id: string;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
};

type FollowRow = {
  follower_id: string;
  following_id: string;
};

function shouldFallback(error: PostgrestError | Error | null) {
  if (!error) return false;
  const message = `${error.message || ""} ${"details" in error ? error.details || "" : ""}`.toLowerCase();
  return (
    message.includes("does not exist") ||
    message.includes("relation") ||
    message.includes("schema cache") ||
    message.includes("permission denied") ||
    message.includes("rls")
  );
}

function toHandleSeed(value: string) {
  const sanitized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 18);

  return sanitized || "member";
}

function buildHandle(user: User) {
  const seed =
    user.user_metadata?.username ||
    user.user_metadata?.user_name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    user.id.slice(0, 8);

  return `${toHandleSeed(String(seed))}_${user.id.slice(0, 4)}`;
}

function buildDisplayName(user: User) {
  return (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Tegal Eats Member"
  );
}

function buildAvatar(user: User) {
  return user.user_metadata?.avatar_url || `https://i.pravatar.cc/160?u=${user.id}`;
}

function buildBio(profile: Pick<SocialProfile, "reviewCount" | "averageRating" | "followingCount">) {
  if (profile.reviewCount >= 8) return "Sering jadi rujukan buat cari tempat yang sudah terbukti enak.";
  if (profile.followingCount >= 5) return "Aktif memantau rekomendasi komunitas lokal.";
  if (profile.averageRating >= 4.3) return "Cenderung pilih spot yang konsisten enak buat direkomendasikan.";
  return "Masih membangun jejak rasa di Tegal Eats.";
}

function fallbackProfileFromReview(review: AppReview, stats?: Partial<SocialProfile>): SocialProfile {
  return {
    userId: review.userId || `guest:${review.userName}`,
    handle: review.userName ? `@${review.userName}`.replace(/^@@/, "@") : "@member",
    displayName: review.userName || "Member",
    avatarUrl: review.avatarUrl,
    bio: buildBio({
      reviewCount: stats?.reviewCount ?? 1,
      averageRating: stats?.averageRating ?? review.rating,
      followingCount: stats?.followingCount ?? 0,
    }),
    reviewCount: stats?.reviewCount ?? 1,
    averageRating: stats?.averageRating ?? review.rating,
    followerCount: stats?.followerCount ?? 0,
    followingCount: stats?.followingCount ?? 0,
    isFollowing: stats?.isFollowing ?? false,
  };
}

function formatRelativeDate(value: string | null) {
  if (!value) return "Baru saja";
  const diff = Date.now() - new Date(value).getTime();
  const hours = Math.max(1, Math.floor(diff / (1000 * 60 * 60)));
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function sanitizeHandle(value: string) {
  return value.replace(/^@+/, "").trim().toLowerCase();
}

async function loadPublicProfiles(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, PublicProfileRow>();

  const { data, error } = await supabase
    .from("public_profiles")
    .select("user_id, handle, display_name, avatar_url, bio")
    .in("user_id", userIds);

  if (error) {
    if (shouldFallback(error)) return new Map<string, PublicProfileRow>();
    throw error;
  }

  return new Map((data || []).map((item) => [String(item.user_id), item as PublicProfileRow]));
}

async function loadFollowRows(currentUserId?: string | null, candidateIds: string[] = []) {
  if (!currentUserId) {
    return {
      followingIds: new Set<string>(),
      followerCountMap: new Map<string, number>(),
      followingCount: 0,
    };
  }

  const [followingResult, followersResult, currentFollowingResult] = await Promise.all([
    candidateIds.length
      ? supabase
          .from("user_follows")
          .select("following_id")
          .eq("follower_id", currentUserId)
          .in("following_id", candidateIds)
      : Promise.resolve({ data: [], error: null }),
    candidateIds.length
      ? supabase
          .from("user_follows")
          .select("following_id")
          .in("following_id", candidateIds)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("user_follows").select("following_id").eq("follower_id", currentUserId),
  ]);

  const anyError = followingResult.error || followersResult.error || currentFollowingResult.error;
  if (anyError) {
    if (shouldFallback(anyError)) {
      return {
        followingIds: new Set<string>(),
        followerCountMap: new Map<string, number>(),
        followingCount: 0,
      };
    }
    throw anyError;
  }

  const followerCountMap = new Map<string, number>();
  (followersResult.data as FollowRow[] | null || []).forEach((row) => {
    const key = String(row.following_id);
    followerCountMap.set(key, (followerCountMap.get(key) || 0) + 1);
  });

  return {
    followingIds: new Set((followingResult.data || []).map((row: any) => String(row.following_id))),
    followerCountMap,
    followingCount: (currentFollowingResult.data || []).length,
  };
}

async function buildProfilesFromReviews(reviews: AppReview[], currentUserId?: string | null) {
  const statsMap = new Map<
    string,
    { reviewCount: number; totalRating: number; avatarUrl: string; name: string }
  >();

  reviews.forEach((review) => {
    const userId = review.userId || `guest:${review.userName}`;
    const current = statsMap.get(userId) || {
      reviewCount: 0,
      totalRating: 0,
      avatarUrl: review.avatarUrl,
      name: review.userName,
    };
    current.reviewCount += 1;
    current.totalRating += review.rating;
    current.avatarUrl = review.avatarUrl || current.avatarUrl;
    current.name = review.userName || current.name;
    statsMap.set(userId, current);
  });

  const realUserIds = Array.from(statsMap.keys()).filter((id) => !id.startsWith("guest:"));
  const [publicProfiles, followInfo] = await Promise.all([
    loadPublicProfiles(realUserIds),
    loadFollowRows(currentUserId, realUserIds),
  ]);

  const entries = await Promise.all(
    Array.from(statsMap.entries()).map(async ([userId, stats]) => {
      const publicProfile = publicProfiles.get(userId);
      const averageRating = stats.totalRating / Math.max(1, stats.reviewCount);
      const followerCount = followInfo.followerCountMap.get(userId) || 0;
      const avatarUrl =
        (await resolveStorageUrl(publicProfile?.avatar_url || stats.avatarUrl || null)) ||
        `https://i.pravatar.cc/160?u=${userId}`;

      const profile: SocialProfile = {
        userId,
        handle: publicProfile?.handle ? `@${publicProfile.handle}` : `@${toHandleSeed(stats.name || "member")}`,
        displayName: publicProfile?.display_name || stats.name || "Member",
        avatarUrl,
        bio: publicProfile?.bio || buildBio({
          reviewCount: stats.reviewCount,
          averageRating,
          followingCount: followInfo.followingCount,
        }),
        reviewCount: stats.reviewCount,
        averageRating,
        followerCount,
        followingCount: 0,
        isFollowing: followInfo.followingIds.has(userId),
      };

      return [userId, profile] as const;
    })
  );

  return new Map(entries);
}

export async function ensureCurrentUserSocialProfile(user: User | null | undefined) {
  if (!user) return;

  const payload = {
    user_id: user.id,
    handle: buildHandle(user),
    display_name: buildDisplayName(user),
    avatar_url: buildAvatar(user),
    bio: "Mencatat shortlist, review, dan spot yang layak direkomendasikan lagi.",
  };

  const { error } = await supabase.from("public_profiles").upsert(payload, { onConflict: "user_id" });
  if (error && !shouldFallback(error)) {
    throw error;
  }
}

export async function fetchSuggestedProfiles(currentUserId?: string | null, limit = 4) {
  const { data, error } = await supabase
    .from("app_reviews")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) throw error;

  const reviews = await Promise.all(
    (data || []).map((review) => resolveReviewMedia(normalizeReview(review as ReviewRecord)))
  );
  const profileMap = await buildProfilesFromReviews(reviews, currentUserId);

  return Array.from(profileMap.values())
    .filter((profile) => profile.userId !== currentUserId)
    .sort((a, b) => {
      const aScore = a.reviewCount * 2 + a.followerCount + a.averageRating;
      const bScore = b.reviewCount * 2 + b.followerCount + b.averageRating;
      return bScore - aScore;
    })
    .slice(0, limit);
}

export async function fetchCommunityFeed(currentUserId?: string | null, limit = 8) {
  const { data, error } = await supabase
    .from("app_reviews")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(Math.max(limit * 2, 16));

  if (error) throw error;

  const reviews = await Promise.all(
    (data || []).map((review) => resolveReviewMedia(normalizeReview(review as ReviewRecord)))
  );
  const profileMap = await buildProfilesFromReviews(reviews, currentUserId);

  return reviews.slice(0, limit).map((review) => {
    const profile =
      profileMap.get(review.userId || `guest:${review.userName}`) || fallbackProfileFromReview(review);
    return {
      id: `${review.id}:${review.createdAt || "recent"}`,
      kind: "review" as const,
      actor: profile,
      review,
      placeName: review.placeName || "Tempat",
      relativeLabel: formatRelativeDate(review.createdAt),
      emphasis:
        review.imageUrls.length > 0
          ? "Upload foto terbaru"
          : review.rating >= 4
          ? "Rekomendasi kuat"
          : "Masukan jujur komunitas",
    };
  });
}

export async function fetchMySocialProfile(user: User) {
  const [reviewResult, followingResult, followersResult, publicProfiles] = await Promise.all([
    supabase.from("app_reviews").select("rating").eq("user_id", user.id),
    supabase.from("user_follows").select("following_id").eq("follower_id", user.id),
    supabase.from("user_follows").select("follower_id").eq("following_id", user.id),
    loadPublicProfiles([user.id]),
  ]);

  const anyError =
    reviewResult.error || followingResult.error || followersResult.error;
  if (anyError) {
    if (shouldFallback(anyError)) {
      return {
        userId: user.id,
        handle: `@${buildHandle(user)}`,
        displayName: buildDisplayName(user),
        avatarUrl: buildAvatar(user),
        bio: "Jejak rasa pribadi di Tegal Eats.",
        reviewCount: 0,
        averageRating: 0,
        followerCount: 0,
        followingCount: 0,
        isFollowing: false,
      } satisfies SocialProfile;
    }
    throw anyError;
  }

  const ratings = (reviewResult.data || []).map((item: any) => Number(item.rating || 0)).filter(Boolean);
  const publicProfile = publicProfiles.get(user.id);
  const avatarUrl =
    (await resolveStorageUrl(publicProfile?.avatar_url || user.user_metadata?.avatar_url || null)) ||
    buildAvatar(user);

  return {
    userId: user.id,
    handle: `@${publicProfile?.handle || buildHandle(user)}`,
    displayName: publicProfile?.display_name || buildDisplayName(user),
    avatarUrl,
    bio:
      publicProfile?.bio ||
      buildBio({
        reviewCount: ratings.length,
        averageRating: ratings.reduce((sum, rating) => sum + rating, 0) / Math.max(1, ratings.length),
        followingCount: (followingResult.data || []).length,
      }),
    reviewCount: ratings.length,
    averageRating: ratings.reduce((sum, rating) => sum + rating, 0) / Math.max(1, ratings.length || 1),
    followerCount: (followersResult.data || []).length,
    followingCount: (followingResult.data || []).length,
    isFollowing: false,
  } satisfies SocialProfile;
}

export async function fetchPublicSocialProfile(handle: string, currentUserId?: string | null) {
  const sanitizedHandle = sanitizeHandle(handle);
  const { data, error } = await supabase
    .from("public_profiles")
    .select("user_id, handle, display_name, avatar_url, bio")
    .eq("handle", sanitizedHandle)
    .maybeSingle();

  if (error) {
    if (shouldFallback(error)) return null;
    throw error;
  }

  if (!data) return null;

  const userId = String(data.user_id);
  const [reviewResult, followingResult, followersResult, relationResult] = await Promise.all([
    supabase.from("app_reviews").select("rating").eq("user_id", userId),
    supabase.from("user_follows").select("following_id").eq("follower_id", userId),
    supabase.from("user_follows").select("follower_id").eq("following_id", userId),
    currentUserId
      ? supabase
          .from("user_follows")
          .select("following_id")
          .eq("follower_id", currentUserId)
          .eq("following_id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const anyError =
    reviewResult.error || followingResult.error || followersResult.error || relationResult.error;
  if (anyError) {
    if (shouldFallback(anyError)) {
      return {
        userId,
        handle: `@${data.handle}`,
        displayName: data.display_name || "Member",
        avatarUrl: data.avatar_url || `https://i.pravatar.cc/160?u=${userId}`,
        bio: data.bio || "Member komunitas Tegal Eats.",
        reviewCount: 0,
        averageRating: 0,
        followerCount: 0,
        followingCount: 0,
        isFollowing: false,
      } satisfies SocialProfile;
    }
    throw anyError;
  }

  const ratings = (reviewResult.data || []).map((item: any) => Number(item.rating || 0)).filter(Boolean);
  const avatarUrl =
    (await resolveStorageUrl(data.avatar_url)) ||
    `https://i.pravatar.cc/160?u=${userId}`;

  return {
    userId,
    handle: `@${data.handle}`,
    displayName: data.display_name || "Member",
    avatarUrl,
    bio:
      data.bio ||
      buildBio({
        reviewCount: ratings.length,
        averageRating: ratings.reduce((sum, rating) => sum + rating, 0) / Math.max(1, ratings.length),
        followingCount: (followingResult.data || []).length,
      }),
    reviewCount: ratings.length,
    averageRating: ratings.reduce((sum, rating) => sum + rating, 0) / Math.max(1, ratings.length || 1),
    followerCount: (followersResult.data || []).length,
    followingCount: (followingResult.data || []).length,
    isFollowing: Boolean(relationResult.data),
  } satisfies SocialProfile;
}

export async function followProfile(currentUserId: string, targetUserId: string, shouldFollow: boolean) {
  if (currentUserId === targetUserId) return;

  if (shouldFollow) {
    const { error } = await supabase
      .from("user_follows")
      .upsert({ follower_id: currentUserId, following_id: targetUserId }, { onConflict: "follower_id,following_id" });

    if (error && !shouldFallback(error)) {
      throw error;
    }
    return;
  }

  const { error } = await supabase
    .from("user_follows")
    .delete()
    .eq("follower_id", currentUserId)
    .eq("following_id", targetUserId);

  if (error && !shouldFallback(error)) {
    throw error;
  }
}

export async function updateSocialProfile(userId: string, input: { displayName?: string; bio?: string; avatarUrl?: string }) {
  const payload: any = {};
  if (input.displayName) payload.display_name = input.displayName;
  if (input.bio !== undefined) payload.bio = input.bio;
  if (input.avatarUrl) payload.avatar_url = input.avatarUrl;

  const { error } = await supabase
    .from("public_profiles")
    .update(payload)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function fetchFollowingFeed(currentUserId?: string | null, limit = 6) {
  const feed = await fetchCommunityFeed(currentUserId, limit * 2);
  const filtered = feed.filter((item) => item.actor.isFollowing);
  return filtered.slice(0, limit);
}

export async function fetchProfileActivity(userId: string, limit = 6) {
  const { data, error } = await supabase
    .from("app_reviews")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (shouldFallback(error)) return [];
    throw error;
  }

  const reviews = await Promise.all(
    (data || []).map((review) => resolveReviewMedia(normalizeReview(review as ReviewRecord)))
  );
  return Promise.all(
    reviews.map(async (review) => ({
      id: review.id,
      title:
        review.rating >= 4 ? `Kasih sinyal positif ke ${review.placeName}` : `Kasih review jujur ke ${review.placeName}`,
      detail: review.comment || "Menambahkan review tanpa komentar panjang.",
      relativeLabel: formatRelativeDate(review.createdAt),
      placeName: review.placeName || (review.placeId ? await fetchPlaceNameById(review.placeId) : "Tempat"),
    }))
  );
}

export async function fetchProfileReviews(userId: string, limit = 6) {
  const { data, error } = await supabase
    .from("app_reviews")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (shouldFallback(error)) return [];
    throw error;
  }

  return Promise.all(
    (data || []).map((review) => resolveReviewMedia(normalizeReview(review as ReviewRecord)))
  );
}
