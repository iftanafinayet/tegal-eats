import { and, desc, eq, ilike, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "../../../lib/auth";
import { db } from "../../../db";
import { favorites, places, publicProfiles, reviewAppreciations, reviews, userFollows, userPlaceStates } from "../../../db/schema";
import { normalizePlace, normalizeReview, PlaceRecord, ReviewRecord } from "../contracts";

type Session = Awaited<ReturnType<typeof auth.api.getSession>>;
const clean = (value: unknown) => String(value || "").trim().replace(/\s+/g, " ");
const iso = (value: Date | null | undefined) => value?.toISOString() || null;

function placeRecord(row: typeof places.$inferSelect, stats?: { count: number; average: number }): PlaceRecord {
  return { id: row.id, name: row.name, category: row.category, address: row.address, lat: row.lat, lng: row.lng,
    description: row.description, hours: row.hours, price_range: row.priceRange, image_url: row.imageUrl,
    avg_rating: stats?.average || 0, review_count: stats?.count || 0 };
}
function reviewRecord(row: typeof reviews.$inferSelect): ReviewRecord {
  return { id: row.id, place_id: row.placeId, user_id: row.userId, rating: row.rating, comment: row.comment,
    photo_urls: row.photoUrls, place_name: row.placeName, username: row.username, avatar_url: row.avatarUrl,
    created_at: iso(row.createdAt), upvote_count: 0 };
}
async function placeStats() {
  const rows = await db.select().from(reviews);
  const result = new Map<string, { count: number; average: number }>();
  for (const row of rows) {
    const current = result.get(row.placeId) || { count: 0, average: 0 };
    current.average = (current.average * current.count + row.rating) / (current.count + 1);
    current.count += 1;
    result.set(row.placeId, current);
  }
  return result;
}
async function appPlaces(ids?: string[]) {
  if (ids?.length === 0) return [];
  const rows = ids ? await db.select().from(places).where(inArray(places.id, ids)) : await db.select().from(places);
  const stats = await placeStats();
  return rows.map((row) => normalizePlace(placeRecord(row, stats.get(row.id)))).sort((a, b) => b.rating - a.rating);
}
async function appReviews(where?: { placeId?: string; userId?: string }, limit?: number) {
  const condition = where?.placeId ? eq(reviews.placeId, where.placeId) : where?.userId ? eq(reviews.userId, where.userId) : undefined;
  const base = db.select().from(reviews).where(condition).orderBy(desc(reviews.createdAt));
  const rows = limit ? await base.limit(limit) : await base;
  return rows.map((row) => normalizeReview(reviewRecord(row), where?.placeId));
}
function requireUser(session: Session) {
  if (!session?.user) throw Object.assign(new Error("Login diperlukan."), { status: 401 });
  return session.user;
}
function requireAdmin(session: Session) {
  const user = requireUser(session) as ReturnType<typeof requireUser> & { role?: string };
  if (user.role !== "admin") throw Object.assign(new Error("Akses admin diperlukan."), { status: 403 });
  return user;
}
const handleSeed = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 18) || "member";
async function ensureProfile(session: Session) {
  const current = requireUser(session);
  const existing = await db.select().from(publicProfiles).where(eq(publicProfiles.userId, current.id)).limit(1);
  if (existing[0]) return existing[0];
  const handle = `${handleSeed(current.name || current.email.split("@")[0])}_${current.id.slice(0, 4)}`;
  const [created] = await db.insert(publicProfiles).values({ userId: current.id, handle, displayName: current.name, avatarUrl: current.image,
    bio: "Mencatat shortlist, review, dan spot yang layak direkomendasikan lagi." }).returning();
  return created;
}
async function profileFor(userId: string, currentUserId?: string) {
  const [profile] = await db.select().from(publicProfiles).where(eq(publicProfiles.userId, userId)).limit(1);
  if (!profile) return null;
  const [ratings, followers, following, relation] = await Promise.all([
    db.select({ rating: reviews.rating }).from(reviews).where(eq(reviews.userId, userId)),
    db.select().from(userFollows).where(eq(userFollows.followingId, userId)),
    db.select().from(userFollows).where(eq(userFollows.followerId, userId)),
    currentUserId ? db.select().from(userFollows).where(and(eq(userFollows.followerId, currentUserId), eq(userFollows.followingId, userId))).limit(1) : Promise.resolve([]),
  ]);
  const averageRating = ratings.reduce((sum, item) => sum + item.rating, 0) / Math.max(1, ratings.length);
  return { userId, handle: `@${profile.handle}`, displayName: profile.displayName || "Member", avatarUrl: profile.avatarUrl || `https://i.pravatar.cc/160?u=${userId}`,
    bio: profile.bio || "Member komunitas Tegal Eats.", reviewCount: ratings.length, averageRating, followerCount: followers.length,
    followingCount: following.length, isFollowing: relation.length > 0 };
}
function relativeDate(value: string | null) {
  if (!value) return "Baru saja";
  const hours = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 3600000));
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days} hari lalu` : new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, any>;
    const action = String(body.action || "");
    const session = await auth.api.getSession({ headers: request.headers });
    let data: unknown;

    if (action === "places.list") data = await appPlaces();
    else if (action === "places.get") data = (await appPlaces([String(body.id)]))[0] || null;
    else if (action === "places.map") data = (await appPlaces()).filter((item) => item.lat != null && item.lng != null).slice(0, Number(body.limit) || 50);
    else if (action === "places.byIds") data = await appPlaces((body.placeIds || []).map(String));
    else if (action === "reviews.byPlace") data = await appReviews({ placeId: String(body.placeId) });
    else if (action === "reviews.byUser" || action === "social.reviews") data = await appReviews({ userId: String(body.userId) }, Number(body.limit) || 10);
    else if (action === "places.create" || action === "places.import") {
      requireUser(session); const input = body.input || {}; const name = clean(input.name);
      const existing = await db.select().from(places).where(ilike(places.name, name)).limit(1);
      if (existing[0]) data = normalizePlace(placeRecord(existing[0]));
      else {
        const [row] = await db.insert(places).values({ id: crypto.randomUUID(), name, category: clean(input.category || "coffee").toLowerCase(),
          address: clean(input.address), lat: Number(input.lat), lng: Number(input.lng), description: clean(input.description), hours: input.hours || null,
          priceRange: input.priceLabel || null, imageUrl: input.imageUrl || null }).returning();
        data = action === "places.import" ? normalizePlace(placeRecord(row)) : placeRecord(row);
      }
    } else if (action === "reviews.create") {
      const current = requireUser(session); const input = body.input || {};
      await db.insert(reviews).values({ id: crypto.randomUUID(), placeId: String(input.placeId), userId: current.id, rating: Number(input.rating),
        comment: clean(input.comment), photoUrls: input.photoUrls || [], placeName: clean(input.placeName), username: clean(input.userName), avatarUrl: input.avatarUrl || null });
      data = null;
    } else if (action === "favorites.has") {
      const current = requireUser(session); data = (await db.select().from(favorites).where(and(eq(favorites.userId, current.id), eq(favorites.placeId, String(body.placeId)))).limit(1)).length > 0;
    } else if (action === "favorites.list") {
      const current = requireUser(session); data = (await db.select().from(favorites).where(eq(favorites.userId, current.id))).map((item) => item.placeId);
    } else if (action === "favorites.set") {
      const current = requireUser(session); const condition = and(eq(favorites.userId, current.id), eq(favorites.placeId, String(body.placeId)));
      if (body.shouldFavorite) await db.insert(favorites).values({ userId: current.id, placeId: String(body.placeId) }).onConflictDoNothing(); else await db.delete(favorites).where(condition); data = null;
    } else if (action === "plans.list") {
      const current = requireUser(session); data = (await db.select().from(userPlaceStates).where(eq(userPlaceStates.userId, current.id))).filter((item) => item.planStatus).map((item) => ({ placeId: item.placeId, placeName: item.placeName || undefined, status: item.planStatus, updatedAt: item.updatedAt.toISOString() }));
    } else if (action === "plans.save") {
      const current = requireUser(session); const plan = body.plan;
      await db.insert(userPlaceStates).values({ userId: current.id, placeId: String(plan.placeId), placeName: plan.placeName || null, planStatus: plan.status, updatedAt: new Date(plan.updatedAt) }).onConflictDoUpdate({ target: [userPlaceStates.userId, userPlaceStates.placeId], set: { placeName: plan.placeName || null, planStatus: plan.status, updatedAt: new Date(plan.updatedAt) } }); data = null;
    } else if (action === "appreciations.list") {
      const current = requireUser(session); data = (await db.select().from(reviewAppreciations).where(and(eq(reviewAppreciations.userId, current.id), eq(reviewAppreciations.placeId, String(body.placeId))))).map((item) => item.reviewId);
    } else if (action === "appreciations.set") {
      const current = requireUser(session); const values = { userId: current.id, placeId: String(body.placeId), reviewId: String(body.reviewId), updatedAt: new Date() };
      if (body.active) await db.insert(reviewAppreciations).values(values).onConflictDoUpdate({ target: [reviewAppreciations.userId, reviewAppreciations.reviewId], set: { updatedAt: new Date() } });
      else await db.delete(reviewAppreciations).where(and(eq(reviewAppreciations.userId, current.id), eq(reviewAppreciations.reviewId, values.reviewId))); data = null;
    } else if (action === "social.ensureProfile") { await ensureProfile(session); data = null;
    } else if (action === "social.me") { const current = requireUser(session); await ensureProfile(session); data = await profileFor(current.id, current.id);
    } else if (action === "social.profile") {
      const handle = String(body.handle || "").replace(/^@+/, "").toLowerCase(); const [row] = await db.select().from(publicProfiles).where(eq(publicProfiles.handle, handle)).limit(1);
      data = row ? await profileFor(row.userId, session?.user.id) : null;
    } else if (action === "social.suggested") {
      const rows = await db.select().from(publicProfiles); const profiles = await Promise.all(rows.filter((row) => row.userId !== session?.user.id).map((row) => profileFor(row.userId, session?.user.id)));
      data = profiles.filter(Boolean).sort((a, b) => (b!.reviewCount + b!.followerCount) - (a!.reviewCount + a!.followerCount)).slice(0, Number(body.limit) || 4);
    } else if (action === "social.follow") {
      const current = requireUser(session); const target = String(body.targetUserId); if (target !== current.id) {
        const condition = and(eq(userFollows.followerId, current.id), eq(userFollows.followingId, target));
        if (body.shouldFollow) await db.insert(userFollows).values({ followerId: current.id, followingId: target }).onConflictDoNothing(); else await db.delete(userFollows).where(condition);
      } data = null;
    } else if (action === "social.update") {
      const current = requireUser(session); await ensureProfile(session); const input = body.input || {}; const changes: Partial<typeof publicProfiles.$inferInsert> = { updatedAt: new Date() };
      if (input.displayName) changes.displayName = clean(input.displayName); if (input.bio !== undefined) changes.bio = clean(input.bio); if (input.avatarUrl) changes.avatarUrl = String(input.avatarUrl);
      await db.update(publicProfiles).set(changes).where(eq(publicProfiles.userId, current.id)); data = null;
    } else if (action === "social.feed") {
      const currentId = session?.user.id; let items = await appReviews(undefined, Math.max((Number(body.limit) || 8) * 2, 16));
      const following = currentId ? (await db.select().from(userFollows).where(eq(userFollows.followerId, currentId))).map((row) => row.followingId) : [];
      if (body.followingOnly) items = items.filter((item) => item.userId && following.includes(item.userId));
      const feed = await Promise.all(items.slice(0, Number(body.limit) || 8).map(async (review) => {
        const actor = review.userId ? await profileFor(review.userId, currentId) : null; if (!actor) return null;
        return { id: `${review.id}:${review.createdAt || "recent"}`, kind: "review", actor, review, placeName: review.placeName,
          relativeLabel: relativeDate(review.createdAt), emphasis: review.imageUrls.length ? "Upload foto terbaru" : review.rating >= 4 ? "Rekomendasi kuat" : "Masukan jujur komunitas" };
      })); data = feed.filter(Boolean);
    } else if (action === "social.activity") {
      const items = await appReviews({ userId: String(body.userId) }, Number(body.limit) || 6);
      data = items.map((review) => ({ id: review.id, title: review.rating >= 4 ? `Kasih sinyal positif ke ${review.placeName}` : `Kasih review jujur ke ${review.placeName}`,
        detail: review.comment || "Menambahkan review tanpa komentar panjang.", relativeLabel: relativeDate(review.createdAt), placeName: review.placeName }));
    } else if (action === "admin.places") { requireAdmin(session); data = (await db.select().from(places).orderBy(desc(places.createdAt))).map((row) => placeRecord(row));
    } else if (action === "admin.reviews") { requireAdmin(session); data = (await db.select().from(reviews).orderBy(desc(reviews.createdAt))).map(reviewRecord);
    } else if (action === "admin.place.update") {
      requireAdmin(session); const fields = body.fields || {}; const changes: Partial<typeof places.$inferInsert> = { updatedAt: new Date() };
      if (fields.name !== undefined) changes.name = clean(fields.name); if (fields.category !== undefined) changes.category = clean(fields.category); if (fields.address !== undefined) changes.address = clean(fields.address);
      if (fields.lat !== undefined) changes.lat = Number(fields.lat); if (fields.lng !== undefined) changes.lng = Number(fields.lng); if (fields.hours !== undefined) changes.hours = fields.hours;
      if (fields.price_range !== undefined) changes.priceRange = fields.price_range; if (fields.description !== undefined) changes.description = clean(fields.description); if (fields.image_url !== undefined) changes.imageUrl = fields.image_url;
      const [row] = await db.update(places).set(changes).where(eq(places.id, String(body.id))).returning(); if (!row) throw Object.assign(new Error("Place tidak ditemukan."), { status: 404 }); data = placeRecord(row);
    } else if (action === "admin.place.delete") { requireAdmin(session); await db.delete(places).where(eq(places.id, String(body.id))); data = null;
    } else if (action === "admin.review.delete") { requireAdmin(session); await db.delete(reviews).where(eq(reviews.id, String(body.id))); data = null;
    } else throw Object.assign(new Error("Aksi data tidak dikenal."), { status: 400 });

    return NextResponse.json({ data });
  } catch (error) {
    console.error(error);
    const status = typeof error === "object" && error && "status" in error ? Number(error.status) : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Terjadi kesalahan server." }, { status });
  }
}
