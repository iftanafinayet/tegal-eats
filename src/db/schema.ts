import { boolean, index, integer, jsonb, pgTable, primaryKey, real, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(), name: text("name").notNull(), email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false), image: text("image"), role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").notNull().defaultNow(), updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const session = pgTable("session", {
  id: text("id").primaryKey(), expiresAt: timestamp("expires_at").notNull(), token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(), updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"), userAgent: text("user_agent"), userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
}, (table) => [index("session_user_id_idx").on(table.userId)]);
export const account = pgTable("account", {
  id: text("id").primaryKey(), accountId: text("account_id").notNull(), providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }), accessToken: text("access_token"),
  refreshToken: text("refresh_token"), idToken: text("id_token"), accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"), scope: text("scope"), password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(), updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [index("account_user_id_idx").on(table.userId)]);
export const verification = pgTable("verification", {
  id: text("id").primaryKey(), identifier: text("identifier").notNull(), value: text("value").notNull(), expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(), updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [index("verification_identifier_idx").on(table.identifier)]);

export const places = pgTable("places", {
  id: text("id").primaryKey(), name: text("name").notNull(), category: text("category").notNull().default("venue"),
  address: text("address").notNull().default(""), lat: real("lat"), lng: real("lng"), description: text("description").notNull().default(""),
  hours: text("hours"), priceRange: text("price_range"), imageUrl: text("image_url"), createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [uniqueIndex("places_name_unique").on(table.name)]);
export const reviews = pgTable("reviews", {
  id: text("id").primaryKey(), placeId: text("place_id").notNull().references(() => places.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }), rating: integer("rating").notNull(),
  comment: text("comment").notNull().default(""), photoUrls: jsonb("photo_urls").$type<string[]>().notNull().default([]),
  placeName: text("place_name").notNull(), username: text("username").notNull(), avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [index("reviews_place_id_idx").on(table.placeId), index("reviews_user_id_idx").on(table.userId)]);
export const favorites = pgTable("favorites", {
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }), placeId: text("place_id").notNull().references(() => places.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.userId, table.placeId] })]);
export const publicProfiles = pgTable("public_profiles", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }), handle: text("handle").notNull().unique(),
  displayName: text("display_name"), avatarUrl: text("avatar_url"), bio: text("bio"), updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const userFollows = pgTable("user_follows", {
  followerId: text("follower_id").notNull().references(() => user.id, { onDelete: "cascade" }), followingId: text("following_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.followerId, table.followingId] })]);
export const userPlaceStates = pgTable("user_place_states", {
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }), placeId: text("place_id").notNull().references(() => places.id, { onDelete: "cascade" }),
  placeName: text("place_name"), planStatus: text("plan_status"), updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.userId, table.placeId] })]);
export const reviewAppreciations = pgTable("review_appreciations", {
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }), reviewId: text("review_id").notNull().references(() => reviews.id, { onDelete: "cascade" }),
  placeId: text("place_id").notNull().references(() => places.id, { onDelete: "cascade" }), updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.userId, table.reviewId] })]);
