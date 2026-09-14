"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Splash } from "../screens/Splash";
import { Home } from "../screens/Home";
import { Detail } from "../screens/Detail";
import { AddReview } from "../screens/AddReview";
import { Profile } from "../screens/Profile";
import { PublicProfile } from "../screens/PublicProfile";
import { Favorit } from "../screens/Favorit";
import { NotFound } from "../screens/NotFound";
import { Login } from "../screens/Login";
import { AdminDashboard } from "../screens/admin/AdminDashboard";

const MapScreen = dynamic(() => import("../screens/MapScreen").then((mod) => mod.MapScreen), { ssr: false });
const AddPlace = dynamic(() => import("../screens/AddPlace").then((mod) => mod.AddPlace), { ssr: false });

export default function AppPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, ready } = useAuth();
  const protectedPath = pathname === "/profile" || pathname === "/add-place" || pathname.startsWith("/review/");

  useEffect(() => {
    if (!ready) return;
    if (protectedPath && !user) router.replace(`/login?from=${encodeURIComponent(pathname)}`);
    if (pathname === "/admin" && !isAdmin) router.replace("/home");
    if (pathname === "/login" && user) router.replace(isAdmin ? "/admin" : "/home");
  }, [isAdmin, pathname, protectedPath, ready, router, user]);

  if (!ready || (protectedPath && !user) || (pathname === "/admin" && !isAdmin)) return null;
  if (pathname === "/") return <Splash />;
  if (pathname === "/home" || pathname === "/explore") return <Home />;
  if (pathname === "/map") return <MapScreen />;
  if (pathname === "/login") return <Login />;
  if (pathname === "/favorit" || pathname === "/favorites" || pathname === "/saved") return <Favorit />;
  if (pathname === "/profile") return <Profile />;
  if (pathname === "/add-place" || pathname === "/places/new") return <AddPlace />;
  if (pathname === "/admin") return <AdminDashboard />;
  if (/^\/(detail|places?|details)\/[^/]+$/.test(pathname)) return <Detail />;
  if (/^\/(review|reviews|add-review)\/[^/]+$/.test(pathname)) return <AddReview />;
  if (/^\/(u|user|users)\/[^/]+$/.test(pathname)) return <PublicProfile />;
  return <NotFound />;
}
