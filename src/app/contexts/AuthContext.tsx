"use client";

import { createContext, useContext, ReactNode } from "react";
import { authClient, AuthUser } from "../../lib/auth-client";

export type UserRole = "admin" | "user" | null;

type AuthContextType = {
  user: AuthUser | null;
  session: { id: string; userId: string; expiresAt: Date } | null;
  loading: boolean;
  roleLoading: boolean;
  ready: boolean;
  role: UserRole;
  isAdmin: boolean;
  defaultRoute: string;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  roleLoading: true,
  ready: false,
  role: null,
  isAdmin: false,
  defaultRoute: "/home",
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isPending } = authClient.useSession();
  const rawUser = data?.user as (NonNullable<typeof data>["user"] & { role?: string }) | undefined;
  const user: AuthUser | null = rawUser ? {
    ...rawUser,
    user_metadata: { full_name: rawUser.name, avatar_url: rawUser.image || undefined },
  } : null;
  const session = data?.session ? { id: data.session.id, userId: data.session.userId, expiresAt: data.session.expiresAt } : null;
  const loading = isPending;
  const roleLoading = isPending;
  const role = (rawUser?.role === "admin" ? "admin" : rawUser ? "user" : null) as UserRole;
  const ready = !isPending;
  const isAdmin = role === "admin";
  const defaultRoute = isAdmin ? "/admin" : "/home";

  return (
    <AuthContext.Provider
      value={{ user, session, loading, roleLoading, ready, role, isAdmin, defaultRoute }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
