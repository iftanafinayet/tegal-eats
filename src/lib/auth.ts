import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schema";

const handleSeed = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 18) || "member";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true },
  user: { additionalFields: { role: { type: "string", defaultValue: "user", input: false } } },
  databaseHooks: {
    user: {
      create: {
        after: async (createdUser) => {
          await db.insert(schema.publicProfiles).values({
            userId: createdUser.id,
            handle: `${handleSeed(createdUser.name || createdUser.email.split("@")[0])}_${createdUser.id.slice(0, 4)}`,
            displayName: createdUser.name,
            avatarUrl: createdUser.image,
            bio: "Mencatat shortlist, review, dan spot yang layak direkomendasikan lagi.",
          }).onConflictDoNothing();
        },
      },
    },
  },
});
