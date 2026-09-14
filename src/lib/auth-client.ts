import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({ baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL });

export type AuthUser = {
  id: string; email: string; name: string; image?: string | null; role?: string | null;
  user_metadata: { full_name?: string; avatar_url?: string };
};
