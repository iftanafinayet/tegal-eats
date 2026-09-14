import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "../navigation";
import { BottomNav } from "../components/BottomNav";
import { DesktopLayout } from "../components/DesktopLayout";
import { loadVisitPlans, saveVisitPlan, getVisitPlanSummary } from "../api/engagement";
import { AppPlace, isPlaceOpenNow } from "../api/contracts";
import { fetchFavoritePlaces, listFavoritePlaceIds, setPlaceFavorite } from "../api/places";
import { useAuth } from "../contexts/AuthContext";

function getStatusLabel(status: "wishlist" | "this_week" | "visited" | null) {
  if (status === "wishlist") return "Wishlist";
  if (status === "this_week") return "Minggu ini";
  if (status === "visited") return "Sudah dicoba";
  return "Belum direncanakan";
}

export function Favorit() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<AppPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<{ placeId: string; placeName?: string; status: "wishlist" | "this_week" | "visited"; updatedAt: string }[]>([]);
  const [planCounts, setPlanCounts] = useState(getVisitPlanSummary());

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const [favoriteIds, loadedPlans] = await Promise.all([listFavoritePlaceIds(user.id), loadVisitPlans(user.id)]);
        const places = await fetchFavoritePlaces(favoriteIds);

        if (cancelled) return;
        setFavorites(places);
        setPlans(loadedPlans);
        setPlanCounts(getVisitPlanSummary());
      } catch (loadError) {
        if (!cancelled) {
          console.error("Failed to load favorites", loadError);
          setFavorites([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const groupedFavorites = favorites.reduce(
    (acc, favorite) => {
      const status = plans.find((plan) => plan.placeId === favorite.id)?.status ?? "wishlist";
      acc[status].push(favorite);
      return acc;
    },
    {
      wishlist: [] as AppPlace[],
      this_week: [] as AppPlace[],
      visited: [] as AppPlace[],
    }
  );

  const updatePlan = async (place: AppPlace, status: "wishlist" | "this_week" | "visited") => {
    const nextPlan = {
      placeId: place.id,
      placeName: place.name,
      status,
      updatedAt: new Date().toISOString(),
    } as const;

    await saveVisitPlan(user?.id, nextPlan);
    const nextPlans = plans.filter((plan) => plan.placeId !== place.id).concat(nextPlan);
    setPlans(nextPlans);
    setPlanCounts(getVisitPlanSummary());
  };

  const removeFavorite = async (id: string) => {
    if (!user?.id) return;

    try {
      await setPlaceFavorite(user.id, id, false);
      setFavorites((prev) => prev.filter((favorite) => favorite.id !== id));
    } catch (removeError) {
      console.error("Failed to remove favorite", removeError);
      alert("Gagal menghapus favorit");
    }
  };

  return (
    <DesktopLayout>
      <div className="min-h-screen bg-background text-on-surface font-body pb-32">
        <header className="pt-8 md:pt-12 pb-10 px-4 md:px-6 lg:px-8 fb-container">
          <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }} className="clay-card rounded-[32px] bg-surface-bright p-6 md:p-10">
            <span className="font-headline font-black text-primary italic tracking-widest uppercase text-xs mb-4 block underline decoration-primary/30 underline-offset-8">Trip Planner</span>
            <h1 className="text-4xl md:text-5xl font-headline font-extrabold text-on-surface tracking-tight leading-[1.05] mb-4 max-w-3xl">
              Tempat yang kamu simpan, sekarang ada statusnya.
            </h1>
            <p className="text-on-surface-variant max-w-2xl text-base md:text-lg leading-relaxed">Bedakan wishlist, plan minggu ini, dan tempat yang sudah terbukti enak buat revisit.</p>
          </motion.div>
        </header>

        <main className="px-4 md:px-6 lg:px-8 fb-container relative z-20 space-y-10">
          <section className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border-2 border-[#c9e2f0] shadow-clay-sm">
              <span className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
              </span>
              <p className="text-4xl font-headline font-black text-on-surface">{planCounts.wishlist}</p>
              <p className="text-sm font-semibold text-on-surface mt-1">Wishlist</p>
              <p className="text-sm text-on-surface-variant">Tempat yang belum dijadwalkan.</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border-2 border-[#c9e2f0] shadow-clay-sm">
              <span className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>event_note</span>
              </span>
              <p className="text-4xl font-headline font-black text-on-surface">{planCounts.this_week}</p>
              <p className="text-sm font-semibold text-on-surface mt-1">This Week</p>
              <p className="text-sm text-on-surface-variant">Kandidat yang harus cepat diputuskan.</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border-2 border-[#c9e2f0] shadow-clay-sm">
              <span className="w-10 h-10 rounded-xl bg-tertiary-container flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-tertiary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </span>
              <p className="text-4xl font-headline font-black text-on-surface">{planCounts.visited}</p>
              <p className="text-sm font-semibold text-on-surface mt-1">Visited</p>
              <p className="text-sm text-on-surface-variant">Tempat yang sudah pernah dicoba.</p>
            </div>
          </section>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">{[1, 2, 3, 4].map((item) => <div key={item} className="bg-surface-container-low h-64 animate-pulse rounded-[2rem]" />)}</div>
          ) : favorites.length === 0 ? (
            <div className="bg-surface-container-lowest p-16 text-center rounded-[2rem] border border-outline-variant/5">
              <h3 className="text-2xl font-headline font-bold text-on-surface mb-3">{!user ? "Masuk dulu biar plan kamu kesimpen" : "Belum ada tempat yang kamu simpan"}</h3>
              <p className="max-w-xl mx-auto text-on-surface-variant mb-8 leading-relaxed">{!user ? "Masuk biar wishlist dan plan jalan kamu kesimpen." : "Mulai dari home, simpan spot yang menarik, lalu putuskan nanti."}</p>
              <button onClick={() => navigate(!user ? "/login" : "/home")} className="bg-primary text-on-primary px-8 py-4 rounded-2xl font-headline font-bold">{!user ? "Masuk untuk simpan plan" : "Cari tempat"}</button>
            </div>
          ) : (
            <div className="space-y-10">
              {([
                { key: "wishlist", title: "Wishlist", subtitle: "Baru disimpan, belum terjadwal." },
                { key: "this_week", title: "Minggu Ini", subtitle: "Harus diputuskan cepat." },
                { key: "visited", title: "Sudah Dicoba", subtitle: "Layak diingat buat balik lagi." },
              ] as const).map((section) => (
                <section key={section.key}>
                  <div className="flex items-end justify-between gap-4 mb-5">
                    <div>
                      <p className="text-[10px] font-headline font-black uppercase tracking-[0.25em] text-primary mb-2">{section.title}</p>
                      <h2 className="text-3xl font-headline font-black">{section.subtitle}</h2>
                    </div>
                    <p className="text-sm text-on-surface-variant">{groupedFavorites[section.key].length} tempat</p>
                  </div>

                  {groupedFavorites[section.key].length === 0 ? (
                    <div className="rounded-[2rem] border border-dashed border-outline-variant/30 p-6 text-on-surface-variant">Belum ada tempat di kategori ini.</div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {groupedFavorites[section.key].map((place, index) => (
                        <motion.div key={place.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: index * 0.05 }} className="clay-card bg-surface-container-lowest rounded-3xl overflow-hidden">
                          <button className="w-full text-left" onClick={() => navigate(`/detail/${place.id}`)}>
                            <div className="h-56 bg-surface-container overflow-hidden">
                              {place.imageUrl ? (
                                <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                                  <span className="material-symbols-outlined text-6xl text-on-surface-variant opacity-10">restaurant</span>
                                </div>
                              )}
                            </div>
                          </button>
                          <div className="p-6">
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                              <div>
                                <h3 className="text-2xl font-headline font-black">{place.name}</h3>
                                <p className="text-sm text-on-surface-variant mt-1">
                                  {place.category || "Venue"} • {place.distanceKm ? `${place.distanceKm.toFixed(1)} km` : "Jarak belum tersedia"} •
                                  <span className={isPlaceOpenNow(place.hours) ? "text-primary font-bold ml-1" : "text-on-surface-variant ml-1"}>
                                    {isPlaceOpenNow(place.hours) ? "Buka" : "Tutup"}
                                  </span>
                                </p>
                              </div>
                              <span className="px-3 py-2 rounded-full bg-primary/10 text-primary text-[10px] font-headline font-black uppercase tracking-[0.18em]">{getStatusLabel(plans.find((plan) => plan.placeId === place.id)?.status ?? null)}</span>
                            </div>
                            <p className="text-sm text-on-surface-variant leading-relaxed mb-5">{place.address || "Alamat belum tersedia. Buka detail untuk cek rute dan review."}</p>
                            <div className="grid grid-cols-3 gap-2 mb-4">
                              <button onClick={() => updatePlan(place, "wishlist")} className="py-3 rounded-xl bg-surface-container-low text-xs font-headline font-black uppercase tracking-[0.15em]">Wishlist</button>
                              <button onClick={() => updatePlan(place, "this_week")} className="py-3 rounded-xl bg-surface-container-low text-xs font-headline font-black uppercase tracking-[0.15em]">Minggu Ini</button>
                              <button onClick={() => updatePlan(place, "visited")} className="py-3 rounded-xl bg-surface-container-low text-xs font-headline font-black uppercase tracking-[0.15em]">Visited</button>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-primary">Rating {place.rating ?? "4.5"}</p>
                              <button onClick={() => removeFavorite(place.id)} className="text-sm font-semibold text-error">Hapus dari favorit</button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
        </main>

        <BottomNav />
      </div>
    </DesktopLayout>
  );
}
