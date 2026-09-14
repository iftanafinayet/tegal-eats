export const routes = {
  splash: "/", home: "/home", map: "/map", login: "/login", favorites: "/favorit",
  detail: (id = ":id") => `/detail/${id}`, review: (id = ":id") => `/review/${id}`,
  addPlace: "/add-place", profile: "/profile", publicProfile: (handle = ":handle") => `/u/${handle}`, admin: "/admin",
} as const;
