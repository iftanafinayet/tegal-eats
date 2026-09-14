"use client";

import { usePathname, useRouter, useParams as useNextParams, useSearchParams as useNextSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";

export function useNavigate() {
  const router = useRouter();
  return useCallback((to: string | number, options?: { replace?: boolean }) => {
    if (typeof to === "number") {
      if (to < 0) router.back();
      else router.forward();
      return;
    }
    if (options?.replace) router.replace(to);
    else router.push(to);
  }, [router]);
}

export function useLocation() {
  const pathname = usePathname();
  const searchParams = useNextSearchParams();
  const search = searchParams.toString();
  return { pathname, search: search ? `?${search}` : "", hash: "", state: null };
}

export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>() {
  const pathname = usePathname();
  const params = useNextParams<Record<string, string | string[]>>();
  const segments = pathname.split("/").filter(Boolean);
  const resource = segments[0];
  const derived = resource === "u" || resource === "user" || resource === "users"
    ? { handle: segments[1] }
    : resource === "detail" || resource === "place" || resource === "places" || resource === "details" || resource === "review" || resource === "reviews" || resource === "add-review"
      ? { id: segments[1] }
      : {};
  return { ...params, ...derived } as T;
}

export function useSearchParams() {
  return useNextSearchParams();
}

export function Navigate({ to, replace = false }: { to: string; replace?: boolean }) {
  const navigate = useNavigate();
  useEffect(() => navigate(to, { replace }), [navigate, replace, to]);
  return null;
}
