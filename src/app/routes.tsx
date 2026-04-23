import {
  createBrowserRouter,
  createHashRouter,
  generatePath,
  Navigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { Splash } from "./screens/Splash";
import { Home } from "./screens/Home";
import { MapScreen } from "./screens/MapScreen";
import { Detail } from "./screens/Detail";
import { AddReview } from "./screens/AddReview";
import { Profile } from "./screens/Profile";
import { PublicProfile } from "./screens/PublicProfile";
import { Favorit } from "./screens/Favorit";
import { NotFound } from "./screens/NotFound";
import { Login } from "./screens/Login";
import { AddPlace } from "./screens/AddPlace";
import { useAuth } from "./contexts/AuthContext";
import { AdminDashboard } from "./screens/admin/AdminDashboard";
import { AdminRoute } from "./screens/admin/AdminRoute";

export const routes = {
  splash: "/",
  home: "/home",
  map: "/map",
  login: "/login",
  favorites: "/favorit",
  detail: (id = ":id") => `/detail/${id}`,
  review: (id = ":id") => `/review/${id}`,
  addPlace: "/add-place",
  profile: "/profile",
  publicProfile: (handle = ":handle") => `/u/${handle}`,
  admin: "/admin",
} as const;

function normalizeBasename(value?: string) {
  if (!value || value === "/") return "/";

  const url = value.replace(/https?:\/\/[^/]+/i, "");
  const trimmed = url.replace(/\/+$/, "");
  return trimmed || "/";
}

function shouldUseHashRouter() {
  if (process.env.REACT_APP_ROUTER_MODE === "hash") return true;

  if (typeof window === "undefined") return false;

  return window.location.hostname.endsWith(".github.io") || window.location.protocol === "file:";
}

function LoadingGate() {
  return (
    <div className="min-h-screen bg-background text-on-surface flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-[10px] font-headline font-black uppercase tracking-[0.25em] text-primary mb-3">
          Preparing Session
        </p>
        <p className="font-headline font-black text-2xl">Memuat akses akun...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, ready } = useAuth();
  const location = useLocation();

  if (!ready) return <LoadingGate />;
  if (!session) {
    return (
      <Navigate
        to={routes.login}
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  return <>{children}</>;
}

function AdminAwarePublicRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, ready } = useAuth();

  if (!ready) return <LoadingGate />;
  if (isAdmin) return <Navigate to={routes.admin} replace />;

  return <>{children}</>;
}

function AuthOnlyPublicRoute({ children }: { children: React.ReactNode }) {
  const { session, ready, defaultRoute } = useAuth();

  if (!ready) return <LoadingGate />;
  if (session) return <Navigate to={defaultRoute} replace />;

  return <>{children}</>;
}

function RedirectToDetail() {
  const { id = "" } = useParams();
  return <Navigate to={generatePath(routes.detail(), { id })} replace />;
}

function RedirectToReview() {
  const { id = "" } = useParams();
  return <Navigate to={generatePath(routes.review(), { id })} replace />;
}

function RedirectToPublicProfile() {
  const { handle = "" } = useParams();
  return <Navigate to={generatePath(routes.publicProfile(), { handle })} replace />;
}

const routeConfig = [
  {
    path: routes.splash,
    Component: Splash,
  },
  {
    path: routes.home,
    element: (
      <AdminAwarePublicRoute>
        <Home />
      </AdminAwarePublicRoute>
    ),
  },
  {
    path: routes.map,
    element: (
      <AdminAwarePublicRoute>
        <MapScreen />
      </AdminAwarePublicRoute>
    ),
  },
  {
    path: routes.login,
    element: (
      <AuthOnlyPublicRoute>
        <Login />
      </AuthOnlyPublicRoute>
    ),
  },
  {
    path: routes.favorites,
    element: (
      <AdminAwarePublicRoute>
        <Favorit />
      </AdminAwarePublicRoute>
    ),
  },
  {
    path: routes.detail(),
    element: (
      <AdminAwarePublicRoute>
        <Detail />
      </AdminAwarePublicRoute>
    ),
  },
  {
    path: routes.review(),
    element: (
      <ProtectedRoute>
        <AddReview />
      </ProtectedRoute>
    ),
  },
  {
    path: routes.addPlace,
    element: (
      <ProtectedRoute>
        <AddPlace />
      </ProtectedRoute>
    ),
  },
  {
    path: routes.profile,
    element: (
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    ),
  },
  {
    path: routes.publicProfile(),
    element: (
      <AdminAwarePublicRoute>
        <PublicProfile />
      </AdminAwarePublicRoute>
    ),
  },
  {
    path: routes.admin,
    element: (
      <AdminRoute>
        <AdminDashboard />
      </AdminRoute>
    ),
  },
  {
    path: "/favorites",
    element: <Navigate to={routes.favorites} replace />,
  },
  {
    path: "/saved",
    element: <Navigate to={routes.favorites} replace />,
  },
  {
    path: "/explore",
    element: <Navigate to={routes.home} replace />,
  },
  {
    path: "/places/:id",
    Component: RedirectToDetail,
  },
  {
    path: "/place/:id",
    Component: RedirectToDetail,
  },
  {
    path: "/details/:id",
    Component: RedirectToDetail,
  },
  {
    path: "/reviews/:id",
    Component: RedirectToReview,
  },
  {
    path: "/add-review/:id",
    Component: RedirectToReview,
  },
  {
    path: "/places/new",
    element: <Navigate to={routes.addPlace} replace />,
  },
  {
    path: "/user/:handle",
    Component: RedirectToPublicProfile,
  },
  {
    path: "/users/:handle",
    Component: RedirectToPublicProfile,
  },
  {
    path: "*",
    Component: NotFound,
  },
];

const createRouter = shouldUseHashRouter() ? createHashRouter : createBrowserRouter;

export const router = createRouter(routeConfig, {
  basename: normalizeBasename(process.env.PUBLIC_URL),
});
