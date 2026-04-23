import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../../supabaseClient";

const AUTH_BOOT_TIMEOUT_MS = 8000;

export type UserRole = "admin" | "user" | null;

type AuthContextType = {
  user: User | null;
  session: Session | null;
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

async function fetchUserRole(userId: string): Promise<UserRole> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch user role:", error);
    return "user";
  }

  return (data?.role as UserRole) ?? "user";
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((value) => resolve(value))
      .catch((error) => reject(error))
      .finally(() => window.clearTimeout(timeoutId));
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);
  const [role, setRole] = useState<UserRole>(null);

  useEffect(() => {
    let alive = true;

    const syncAuthState = async (nextSession: Session | null) => {
      if (!alive) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
      setRoleLoading(true);

      try {
        if (nextSession?.user) {
          const nextRole = await withTimeout(
            fetchUserRole(nextSession.user.id),
            AUTH_BOOT_TIMEOUT_MS,
            "Fetch user role"
          );

          if (alive) setRole(nextRole);
        } else if (alive) {
          setRole(null);
        }
      } catch (error) {
        console.error("Failed to sync auth role:", error);
        if (alive) setRole(nextSession?.user ? "user" : null);
      } finally {
        if (alive) setRoleLoading(false);
      }
    };

    const bootstrapAuth = async () => {
      try {
        const { data } = await withTimeout(
          supabase.auth.getSession(),
          AUTH_BOOT_TIMEOUT_MS,
          "Initial auth session"
        );

        await syncAuthState(data.session);
      } catch (error) {
        console.error("Failed to bootstrap auth session:", error);
        if (!alive) return;
        setSession(null);
        setUser(null);
        setRole(null);
        setLoading(false);
        setRoleLoading(false);
      }
    };

    bootstrapAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      await syncAuthState(nextSession);
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  const ready = !loading && !roleLoading;
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
