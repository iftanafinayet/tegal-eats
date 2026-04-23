import { useEffect, useMemo, useRef, useState } from "react";
import { Coffee, Sparkles, Users, UtensilsCrossed } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "../components/BottomNav";
import { DesktopLayout } from "../components/DesktopLayout";
import { GridSkeleton } from "../components/Skeleton";
import { AppPlace, inferBudgetTier, isPlaceOpenNow } from "../api/contracts";
import { loadVisitPlans } from "../api/engagement";
import { fetchPlaces } from "../api/places";
import {
  ensureCurrentUserSocialProfile,
  fetchCommunityFeed,
  fetchFollowingFeed,
  fetchSuggestedProfiles,
  followProfile,
  SocialActivityItem,
  SocialProfile,
} from "../api/social";
import { useAuth } from "../contexts/AuthContext";
import {
  DiscoveryBudget,
  DiscoveryMood,
  DiscoveryOccasion,
  DiscoveryPreferences,
  saveDiscoveryPreferences,
  getDiscoveryPreferences,
} from "../utils/personalization";

const moodOptions: { id: DiscoveryMood; label: string; hint: string }[] = [
  { id: "makan", label: "Makan", hint: "Tempat buat cari menu utama yang jelas enak." },
  { id: "coffee", label: "Coffee", hint: "Fokus ke kopi, kerja ringan, dan meeting santai." },
  { id: "nongkrong", label: "Nongkrong", hint: "Spot buat ngobrol lama atau hangout malam." },
];

const budgetOptions: { id: DiscoveryBudget; label: string; hint: string }[] = [
  { id: "hemat", label: "Hemat", hint: "Cari tempat yang aman buat sering balik." },
  { id: "sedang", label: "Sedang", hint: "Masih nyaman buat hangout rutin." },
  { id: "premium", label: "Premium", hint: "Siap bayar lebih untuk experience." },
];

const occasionOptions: { id: DiscoveryOccasion; label: string; hint: string }[] = [
  { id: "kerja", label: "Kerja", hint: "Perlu tempat yang enak buat buka laptop." },
  { id: "keluarga", label: "Keluarga", hint: "Prioritas tempat yang aman buat ramai-ramai." },
  { id: "malam", label: "Malam Ini", hint: "Butuh rekomendasi cepat buat tonight plan." },
];

function normalizeCategory(place: AppPlace) {
  return place.category.toLowerCase();
}

function matchesPreferences(place: AppPlace, preferences: DiscoveryPreferences | null) {
  if (!preferences) return true;

  const category = normalizeCategory(place);
  const budget = inferBudgetTier(place.priceLabel) as DiscoveryBudget;

  const moodMatch =
    preferences.moods.length === 0 ||
    preferences.moods.some((mood) => category.includes(mood));

  const budgetMatch =
    preferences.budgets.length === 0 ||
    preferences.budgets.includes(budget);

  const occasionMatch =
    preferences.occasions.length === 0 ||
    preferences.occasions.some((occasion) => {
      if (occasion === "kerja") {
        return category.includes("coffee") || isPlaceOpenNow(place.hours);
      }
      if (occasion === "keluarga") {
        return category.includes("makan") || Boolean(place.address);
      }
      return category.includes("nongkrong") || place.rating >= 4.3;
    });

  return moodMatch && budgetMatch && occasionMatch;
}

function getHeroCopy(preferences: DiscoveryPreferences | null) {
  if (!preferences || preferences.moods.length === 0) {
    return {
      eyebrow: "Curated Discovery",
      title: "Cari tempat yang layak dikunjungi lagi.",
      subtitle: "Bukan cuma list tempat. Ini discovery board buat mutusin mau makan, ngopi, atau nongkrong di Tegal dengan cepat.",
    };
  }

  const moodMap: Record<DiscoveryMood, string> = {
    makan: "kuliner serius",
    coffee: "coffee run",
    nongkrong: "tempat ngobrol lama",
  };

  return {
    eyebrow: "Personal Discovery",
    title: `Rekomendasi untuk ${preferences.moods.map((mood) => moodMap[mood]).join(", ")}.`,
    subtitle: "Preferensi kamu dipakai untuk ngasih shortlist yang lebih masuk akal, bukan sekadar ranking umum.",
  };
}

function getPlanLabel(totalPlans: number) {
  if (totalPlans === 0) return "Belum ada trip plan";
  if (totalPlans === 1) return "1 rencana tersimpan";
  return `${totalPlans} rencana tersimpan`;
}

type SearchSuggestion = {
  id: string;
  label: string;
  secondaryText?: string;
  source: "local";
  placeId?: string;
};

function normalizeSearchValue(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, " ");
}

function findMatchingPlace(value: string, places: AppPlace[]) {
  const query = normalizeSearchValue(value);
  if (!query) return null;

  return (
    places.find((place) => normalizeSearchValue(place.name) === query) ||
    places.find((place) => normalizeSearchValue(place.name).includes(query)) ||
    places.find((place) => normalizeSearchValue(place.address).includes(query)) ||
    null
  );
}

export function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const [places, setPlaces] = useState<AppPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [budgetFilter, setBudgetFilter] = useState<DiscoveryBudget | null>(null);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [maxDistanceKm, setMaxDistanceKm] = useState<number | null>(null);
  const [preferences, setPreferences] = useState<DiscoveryPreferences | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedMoods, setSelectedMoods] = useState<DiscoveryMood[]>([]);
  const [selectedBudgets, setSelectedBudgets] = useState<DiscoveryBudget[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<DiscoveryOccasion[]>([]);
  const [planCountLabel, setPlanCountLabel] = useState("Belum ada trip plan");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  const gridSectionRef = useRef<HTMLElement | null>(null);
  const [recentPlans, setRecentPlans] = useState<
    { placeId: string; placeName?: string; status: string; updatedAt: string }[]
  >([]);
  const [communityFeed, setCommunityFeed] = useState<SocialActivityItem[]>([]);
  const [followingFeed, setFollowingFeed] = useState<SocialActivityItem[]>([]);
  const [suggestedProfiles, setSuggestedProfiles] = useState<SocialProfile[]>([]);

  useEffect(() => {
    let cancelled = false;

    const hydratePersonalState = async () => {
      const storedPreferences = getDiscoveryPreferences();
      const [plans, community, following, suggestions] = await Promise.all([
        loadVisitPlans(user?.id),
        fetchCommunityFeed(user?.id, 6),
        fetchFollowingFeed(user?.id, 4),
        fetchSuggestedProfiles(user?.id, 4),
      ]);

      if (cancelled) return;

      setPreferences(storedPreferences);
      setPlanCountLabel(getPlanLabel(plans.length));
      setRecentPlans(plans.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).slice(0, 3));
      setCommunityFeed(community);
      setFollowingFeed(following);
      setSuggestedProfiles(suggestions);

      if (storedPreferences) {
        setSelectedMoods(storedPreferences.moods);
        setSelectedBudgets(storedPreferences.budgets);
        setSelectedOccasions(storedPreferences.occasions);
      } else {
        setShowOnboarding(true);
      }
    };

    hydratePersonalState();
    ensureCurrentUserSocialProfile(user).catch((profileError) => {
      console.error("Failed to sync social profile", profileError);
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    const loadPlaces = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchPlaces();
        if (!cancelled) {
          setPlaces(data);
        }
      } catch (fetchError: any) {
        if (!cancelled) {
          console.error("Failed to load places:", fetchError);
          setError(`Gagal memuat data tempat. ${fetchError.message || "Unknown error"}`);
          setPlaces([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPlaces();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!searchContainerRef.current?.contains(event.target as Node)) {
        setShowSearchSuggestions(false);
        setActiveSuggestionIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filteredPlaces = useMemo(() => {
    const filterText = search.toLowerCase();
    const categoryFilter = activeFilter?.toLowerCase();

    return places.filter((place) => {
      const matchesSearch =
        !filterText ||
        place.name.toLowerCase().includes(filterText) ||
        place.category.toLowerCase().includes(filterText) ||
        place.description.toLowerCase().includes(filterText) ||
        place.address.toLowerCase().includes(filterText);

      const matchesFilter =
        !categoryFilter ||
        normalizeCategory(place) === categoryFilter ||
        normalizeCategory(place).includes(categoryFilter);

      const matchesBudget = !budgetFilter || inferBudgetTier(place.priceLabel) === budgetFilter;
      const matchesOpenNow = !openNowOnly || isPlaceOpenNow(place.hours);
      const matchesDistance =
        maxDistanceKm == null || place.distanceKm == null || place.distanceKm <= maxDistanceKm;

      return matchesSearch && matchesFilter && matchesBudget && matchesOpenNow && matchesDistance;
    });
  }, [activeFilter, budgetFilter, maxDistanceKm, openNowOnly, places, search]);

  // Reset to first page when any filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeFilter, budgetFilter, openNowOnly, maxDistanceKm, preferences]);

  const allPersonalizedPicks = useMemo(() => {
    return filteredPlaces.filter((place) => matchesPreferences(place, preferences));
  }, [filteredPlaces, preferences]);

  const totalPages = Math.ceil(allPersonalizedPicks.length / ITEMS_PER_PAGE);

  const personalizedPicks = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return allPersonalizedPicks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [allPersonalizedPicks, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    gridSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const trendingPicks = useMemo(() => {
    return [...filteredPlaces].sort((a, b) => b.rating - a.rating).slice(0, 3);
  }, [filteredPlaces]);

  const nearbyPicks = useMemo(() => {
    return [...filteredPlaces]
      .filter((place) => place.distanceKm != null)
      .sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99))
      .slice(0, 3);
  }, [filteredPlaces]);

  const tonightPlanPicks = useMemo(() => {
    return [...filteredPlaces]
      .filter((place) => {
        const category = normalizeCategory(place);
        return category.includes("nongkrong") || category.includes("coffee");
      })
      .sort((a, b) => b.reviewCount + b.rating - (a.reviewCount + a.rating))
      .slice(0, 3);
  }, [filteredPlaces]);

  const hero = getHeroCopy(preferences);

  const localSuggestions = useMemo(() => {
    const query = normalizeSearchValue(search);
    if (!query) return [];

    return places
      .filter((place) => {
        const haystack = [place.name, place.category, place.address]
          .map((value) => normalizeSearchValue(value))
          .join(" ");

        return haystack.includes(query);
      })
      .slice(0, 5)
      .map<SearchSuggestion>((place) => ({
        id: `local-${place.id}`,
        label: place.name,
        secondaryText: place.address,
        source: "local",
        placeId: place.id,
      }));
  }, [places, search]);

  const searchSuggestions = useMemo(() => {
    return localSuggestions;
  }, [localSuggestions]);

  useEffect(() => {
    if (!showSearchSuggestions || searchSuggestions.length === 0) {
      setActiveSuggestionIndex(-1);
      return;
    }

    setActiveSuggestionIndex((currentIndex) => {
      if (currentIndex < 0) return 0;
      return Math.min(currentIndex, searchSuggestions.length - 1);
    });
  }, [searchSuggestions, showSearchSuggestions]);

  const filterChips = [
    { label: "Makan", icon: UtensilsCrossed },
    { label: "Coffee", icon: Coffee },
    { label: "Nongkrong", icon: Users },
  ];

  const handleToggle = <T,>(value: T, selected: T[], setter: (next: T[]) => void) => {
    setter(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  };

  const handleSavePreferences = () => {
    const nextPreferences: DiscoveryPreferences = {
      moods: selectedMoods,
      budgets: selectedBudgets,
      occasions: selectedOccasions,
      onboardedAt: new Date().toISOString(),
    };

    saveDiscoveryPreferences(nextPreferences);
    setPreferences(nextPreferences);
    setShowOnboarding(false);
  };

  const handleFollow = async (profile: SocialProfile) => {
    if (!user?.id) {
      navigate("/login");
      return;
    }

    const nextFollowState = !profile.isFollowing;

    try {
      await followProfile(user.id, profile.userId, nextFollowState);
      setSuggestedProfiles((prev) =>
        prev.map((item) =>
          item.userId === profile.userId
            ? {
                ...item,
                isFollowing: nextFollowState,
                followerCount: Math.max(0, item.followerCount + (nextFollowState ? 1 : -1)),
              }
            : item
        )
      );

      const [community, following] = await Promise.all([
        fetchCommunityFeed(user.id, 6),
        fetchFollowingFeed(user.id, 4),
      ]);
      setCommunityFeed(community);
      setFollowingFeed(following);
    } catch (socialError) {
      console.error("Failed to update follow status", socialError);
    }
  };

  const openProfile = (handle: string) => {
    navigate(`/u/${handle.replace(/^@+/, "")}`);
  };

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    setSearch(suggestion.label);
    setShowSearchSuggestions(false);
    setActiveSuggestionIndex(-1);

    if (suggestion.placeId) {
      navigate(`/detail/${suggestion.placeId}`);
      return;
    }

    const matchedPlace = findMatchingPlace(suggestion.label, places);
    if (matchedPlace) {
      navigate(`/detail/${matchedPlace.id}`);
    }
  };

  return (
    <DesktopLayout>
      <div className="min-h-screen bg-background text-on-surface font-body pb-32">
        <header className="pt-16 pb-10 px-8 lg:px-12 max-w-[1400px] mx-auto">
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }}>
            <span className="font-headline font-black text-primary italic tracking-widest uppercase text-xs mb-4 block underline decoration-primary/30 underline-offset-8">
              {hero.eyebrow}
            </span>
            <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
              <div>
                <h1 className="text-5xl md:text-7xl font-headline font-extrabold tracking-tighter leading-[0.9] mb-5 text-on-surface max-w-4xl">
                  {hero.title}
                </h1>
                <p className="max-w-2xl text-on-surface-variant text-base md:text-lg leading-relaxed">{hero.subtitle}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/10">
                  <p className="text-[10px] font-headline font-black uppercase tracking-[0.2em] text-primary mb-2">Discovery</p>
                  <p className="text-3xl font-headline font-black">{places.length}</p>
                  <p className="text-sm text-on-surface-variant mt-1">Tempat siap dijelajahi</p>
                </div>
                <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/10">
                  <p className="text-[10px] font-headline font-black uppercase tracking-[0.2em] text-primary mb-2">Planner</p>
                  <p className="text-lg font-headline font-black leading-tight">{planCountLabel}</p>
                  <button onClick={() => setShowOnboarding(true)} className="text-sm text-primary font-semibold mt-2">
                    Atur selera lagi
                  </button>
                </div>
              </div>
            </div>

            <div ref={searchContainerRef} className="relative max-w-2xl group mt-8">
              <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-2xl group-hover:bg-primary/10 transition-all duration-500" />
              <div className="relative flex items-center bg-surface-bright/70 backdrop-blur-2xl px-6 py-5 rounded-2xl border border-outline-variant/10">
                <span className="material-symbols-outlined text-primary mr-4 text-2xl">search</span>
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama, area, atau vibe tempat..."
                  value={search}
                  onFocus={() => {
                    setShowSearchSuggestions(true);
                    if (searchSuggestions.length > 0) {
                      setActiveSuggestionIndex(0);
                    }
                  }}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setShowSearchSuggestions(true);
                    setActiveSuggestionIndex(-1);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown" && searchSuggestions.length > 0) {
                      event.preventDefault();
                      setShowSearchSuggestions(true);
                      setActiveSuggestionIndex((currentIndex) =>
                        currentIndex >= searchSuggestions.length - 1 ? 0 : currentIndex + 1
                      );
                      return;
                    }

                    if (event.key === "ArrowUp" && searchSuggestions.length > 0) {
                      event.preventDefault();
                      setShowSearchSuggestions(true);
                      setActiveSuggestionIndex((currentIndex) =>
                        currentIndex <= 0 ? searchSuggestions.length - 1 : currentIndex - 1
                      );
                      return;
                    }

                    if (event.key === "Escape") {
                      setShowSearchSuggestions(false);
                      setActiveSuggestionIndex(-1);
                      return;
                    }

                    if (event.key === "Enter" && searchSuggestions.length > 0) {
                      event.preventDefault();
                      const nextSuggestion =
                        activeSuggestionIndex >= 0 ? searchSuggestions[activeSuggestionIndex] : searchSuggestions[0];
                      handleSelectSuggestion(nextSuggestion);
                    }
                  }}
                  className="bg-transparent border-none focus:ring-0 text-lg font-body font-semibold text-on-surface placeholder:text-on-surface-variant/40 w-full"
                />
              </div>

              {showSearchSuggestions && search.trim() ? (
                <div className="absolute left-0 right-0 top-full mt-3 bg-surface-container-lowest/95 backdrop-blur-2xl border border-outline-variant/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] overflow-hidden z-30">
                  {searchSuggestions.length > 0 ? (
                    <div className="py-2">
                      {searchSuggestions.map((suggestion, index) => {
                        const isActive = searchSuggestions[activeSuggestionIndex]?.id === suggestion.id;

                        return (
                          <div
                            key={suggestion.id}
                            onMouseEnter={() => setActiveSuggestionIndex(index)}
                            className={`px-3 py-2 transition-colors ${
                              isActive ? "bg-surface-container-low" : "hover:bg-surface-container-low"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <button
                                type="button"
                                onClick={() => handleSelectSuggestion(suggestion)}
                                className="min-w-0 flex-1 text-left px-2 py-2 rounded-xl group/item"
                              >
                                <div className="min-w-0">
                                  <p className="font-semibold text-on-surface line-clamp-1 group-hover/item:text-primary transition-colors">{suggestion.label}</p>
                                  <p className="text-sm text-on-surface-variant line-clamp-1 mt-1">
                                    {suggestion.secondaryText || "Tempat di database"}
                                  </p>
                                  <p className="text-[11px] text-primary font-semibold mt-2">
                                    Sudah ada di database
                                  </p>
                                </div>
                              </button>

                              <div className="flex items-center gap-3 shrink-0 px-2">
                                <span className="text-[10px] font-headline font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full bg-primary/10 text-primary">
                                  Tegal Eats
                                </span>
                                <button
                                  type="button"
                                  onClick={() => navigate(`/detail/${suggestion.placeId}`)}
                                  className="px-4 py-2.5 rounded-xl bg-primary text-on-primary text-[11px] font-headline font-black uppercase tracking-[0.18em] shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-0.5 active:translate-y-0"
                                >
                                  Detail
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-5 py-4">
                      <p className="font-semibold text-on-surface">Belum ada suggestion yang cocok.</p>
                      <p className="text-sm text-on-surface-variant mt-1">
                        Coba kata kunci yang lebih spesifik atau isi database coffeshop lewat seed/import.
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </motion.div>
        </header>

        <section className="px-8 lg:px-12 max-w-[1400px] mx-auto mb-12">
          <div className="flex gap-4 overflow-x-auto pb-2 mb-4">
            <button
              onClick={() => setActiveFilter(null)}
              className={`shrink-0 px-6 py-3 rounded-full font-headline font-black uppercase text-[10px] tracking-widest ${
                !activeFilter ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"
              }`}
            >
              Semua
            </button>
            {filterChips.map((chip) => (
              <button
                key={chip.label}
                onClick={() => setActiveFilter((prev) => (prev === chip.label ? null : chip.label))}
                className={`shrink-0 px-6 py-3 rounded-full font-headline font-black uppercase text-[10px] tracking-widest ${
                  activeFilter === chip.label ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            {(["hemat", "sedang", "premium"] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setBudgetFilter((prev) => (prev === tier ? null : tier))}
                className={`px-4 py-2 rounded-full text-xs font-headline font-black uppercase tracking-[0.15em] ${
                  budgetFilter === tier ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"
                }`}
              >
                {tier}
              </button>
            ))}
            <button
              onClick={() => setOpenNowOnly((prev) => !prev)}
              className={`px-4 py-2 rounded-full text-xs font-headline font-black uppercase tracking-[0.15em] ${
                openNowOnly ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"
              }`}
            >
              Open now
            </button>
            <button
              onClick={() => setMaxDistanceKm((prev) => (prev === 3 ? null : 3))}
              className={`px-4 py-2 rounded-full text-xs font-headline font-black uppercase tracking-[0.15em] ${
                maxDistanceKm === 3 ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"
              }`}
            >
              Radius 3 km
            </button>
          </div>
        </section>

        <main className="px-8 lg:px-12 max-w-[1400px] mx-auto space-y-16">
          {recentPlans.length > 0 && (
            <section className="bg-surface-container-lowest rounded-[2rem] border border-outline-variant/10 p-6 md:p-8">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-[10px] font-headline font-black uppercase tracking-[0.25em] text-primary mb-2">Continue Planning</p>
                  <h2 className="text-2xl md:text-3xl font-headline font-black">Rencana yang belum selesai</h2>
                </div>
                <button onClick={() => navigate("/favorit")} className="text-sm font-semibold text-primary">
                  Buka planner
                </button>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {recentPlans.map((plan) => (
                  <button key={plan.placeId} onClick={() => navigate(`/detail/${plan.placeId}`)} className="text-left bg-surface-container-low rounded-2xl p-5 border border-outline-variant/10">
                    <p className="text-[10px] font-headline font-black uppercase tracking-[0.2em] text-primary mb-2">
                      {plan.status === "wishlist" ? "Wishlist" : plan.status === "this_week" ? "Minggu Ini" : "Sudah Dicoba"}
                    </p>
                    <h3 className="font-headline font-black text-lg line-clamp-2">{plan.placeName || "Tempat tersimpan"}</h3>
                    <p className="text-sm text-on-surface-variant mt-2">Update terakhir {new Date(plan.updatedAt).toLocaleDateString("id-ID")}</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section ref={gridSectionRef}>
            <div className="flex items-center justify-between gap-4 mb-8">
              <div>
                <p className="text-[10px] font-headline font-black uppercase tracking-[0.25em] text-primary mb-3">Shortlist</p>
                <h2 className="text-3xl md:text-5xl font-headline font-extrabold tracking-tight">Kandidat terbaik minggu ini.</h2>
              </div>
              {allPersonalizedPicks.length > ITEMS_PER_PAGE && (
                <p className="text-sm text-on-surface-variant font-medium">Halaman {currentPage} dari {totalPages}</p>
              )}
            </div>

            {loading ? (
              <GridSkeleton />
            ) : personalizedPicks.length === 0 ? (
              <div className="py-20 text-center bg-surface-container-low rounded-[3rem] border border-dashed border-outline-variant/20">
                <span className="material-symbols-outlined text-6xl text-on-surface-variant opacity-20 mb-4">search_off</span>
                <h3 className="text-2xl font-headline font-bold text-on-surface">Tidak ada hasil</h3>
                <p className="text-on-surface-variant mt-2 max-w-sm mx-auto">Coba ganti filter atau kata kunci pencarian kamu.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-12">
                {personalizedPicks.map((place, index) => (
                  <motion.button key={place.id} initial={{ y: 30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.7, delay: index * 0.08 }} onClick={() => navigate(`/detail/${place.id}`)} className="group text-left">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-surface-container mb-5">
                      {place.imageUrl ? (
                        <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                          <span className="material-symbols-outlined text-6xl text-on-surface-variant opacity-10">restaurant</span>
                        </div>
                      )}
                      <div className="absolute left-4 top-4 bg-surface-bright/85 backdrop-blur-md px-3 py-2 rounded-full flex items-center gap-2 border border-white/20">
                        <Sparkles size={14} className="text-primary" />
                        <span className="text-[10px] font-headline font-black uppercase tracking-[0.2em] text-primary">Rekomendasi</span>
                      </div>
                      <div className="absolute right-4 top-4 bg-surface-bright/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                        <span className="text-sm font-black">{place.rating || "4.5"}</span>
                      </div>
                    </div>

                    <h3 className="text-2xl font-headline font-extrabold group-hover:text-primary transition-colors">{place.name}</h3>
                    <div className="flex items-center gap-3 mt-2 text-on-surface-variant text-sm">
                      <span>{place.category || "Venue"}</span>
                      <span className="w-1 h-1 rounded-full bg-outline-variant/40" />
                      <span>{place.distanceKm ? `${place.distanceKm.toFixed(1)} km` : inferBudgetTier(place.priceLabel)}</span>
                      <span className="w-1 h-1 rounded-full bg-outline-variant/40" />
                      <span className={isPlaceOpenNow(place.hours) ? "text-primary font-bold" : "text-on-surface-variant"}>
                        {isPlaceOpenNow(place.hours) ? "Buka" : "Tutup"}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant leading-relaxed mt-3 line-clamp-2">{place.description || place.address || "Belum ada ringkasan tempat. Buka detail untuk lihat info lengkap."}</p>
                  </motion.button>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface-container-lowest border border-outline-variant/10 text-on-surface hover:bg-surface-container-high disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-12 h-12 flex items-center justify-center rounded-2xl font-headline font-black transition-all ${
                        currentPage === page
                          ? "bg-primary text-on-primary shadow-lg shadow-primary/20 scale-110"
                          : "bg-surface-container-lowest border border-outline-variant/10 text-on-surface hover:bg-surface-container-high"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface-container-lowest border border-outline-variant/10 text-on-surface hover:bg-surface-container-high disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            )}
          </section>

          {!loading && error && (
            <section className="bg-error/10 border border-error/10 rounded-[2rem] p-6">
              <p className="font-headline font-black text-error mb-2">Data belum stabil</p>
              <p className="text-on-surface-variant">{error}</p>
            </section>
          )}

          <section className="grid xl:grid-cols-3 gap-6">
            <div className="bg-surface-container-lowest rounded-[2rem] border border-outline-variant/10 p-6">
              <p className="text-[10px] font-headline font-black uppercase tracking-[0.25em] text-primary mb-2">Trending</p>
              <h3 className="text-2xl font-headline font-black mb-5">Paling banyak layak dicoba</h3>
              <div className="space-y-4">
                {trendingPicks.map((place) => (
                  <button key={place.id} onClick={() => navigate(`/detail/${place.id}`)} className="w-full text-left p-4 rounded-2xl bg-surface-container-low">
                    <p className="font-headline font-black">{place.name}</p>
                    <p className="text-sm text-on-surface-variant mt-1">Rating {place.rating} • {place.reviewCount} review</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-[2rem] border border-outline-variant/10 p-6">
              <p className="text-[10px] font-headline font-black uppercase tracking-[0.25em] text-primary mb-2">Nearby</p>
              <h3 className="text-2xl font-headline font-black mb-5">Kalau butuh keputusan cepat</h3>
              <div className="space-y-4">
                {nearbyPicks.map((place) => (
                  <button key={place.id} onClick={() => navigate(`/detail/${place.id}`)} className="w-full text-left p-4 rounded-2xl bg-surface-container-low">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-headline font-black">{place.name}</p>
                      <span className="text-sm text-primary font-semibold">{place.distanceKm?.toFixed(1)} km</span>
                    </div>
                    <p className="text-sm text-on-surface-variant mt-1">{place.address || "Cek detail lokasi"}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-[2rem] border border-outline-variant/10 p-6">
              <p className="text-[10px] font-headline font-black uppercase tracking-[0.25em] text-primary mb-2">Tonight</p>
              <h3 className="text-2xl font-headline font-black mb-5">Spot buat malam ini</h3>
              <div className="space-y-4">
                {tonightPlanPicks.map((place) => (
                  <button key={place.id} onClick={() => navigate(`/detail/${place.id}`)} className="w-full text-left p-4 rounded-2xl bg-surface-container-low">
                    <p className="font-headline font-black">{place.name}</p>
                    <p className="text-sm text-on-surface-variant mt-1">{place.category || "Hangout"} • {place.hours || "Cek jam operasional"}</p>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="grid xl:grid-cols-[1.08fr_0.92fr] gap-6">
            <div className="bg-surface-container-lowest rounded-[2rem] border border-outline-variant/10 p-6 md:p-8">
              <div className="flex items-end justify-between gap-4 mb-6">
                <div>
                  <p className="text-[10px] font-headline font-black uppercase tracking-[0.25em] text-primary mb-2">Community Pulse</p>
                  <h3 className="text-2xl md:text-3xl font-headline font-black">Review yang lagi membentuk opini</h3>
                </div>
                <p className="text-sm text-on-surface-variant">{followingFeed.length > 0 ? "Mengutamakan orang yang kamu ikuti" : "Masih memakai sinyal komunitas umum"}</p>
              </div>

              <div className="space-y-4">
                {(followingFeed.length > 0 ? followingFeed : communityFeed).slice(0, 4).map((item) => (
                  <article key={item.id} className="rounded-[1.75rem] bg-surface-container-low p-5 border border-outline-variant/10">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <button onClick={() => openProfile(item.actor.handle)} className="shrink-0">
                          <img src={item.actor.avatarUrl} alt={item.actor.displayName} className="w-12 h-12 rounded-full object-cover" />
                        </button>
                        <button onClick={() => openProfile(item.actor.handle)} className="min-w-0 text-left">
                          <p className="font-headline font-black text-lg truncate">{item.actor.displayName}</p>
                          <p className="text-sm text-on-surface-variant truncate">{item.actor.handle} • {item.relativeLabel}</p>
                        </button>
                      </div>
                      <span className="px-3 py-2 rounded-full bg-primary/10 text-primary text-[10px] font-headline font-black uppercase tracking-[0.18em]">{item.emphasis}</span>
                    </div>
                    <p className="text-on-surface mt-4 leading-relaxed line-clamp-3">{item.review.comment || `Member ini kasih rating ${item.review.rating}/5 buat ${item.placeName}.`}</p>
                    <div className="flex items-center justify-between gap-3 mt-4">
                      <p className="text-sm text-on-surface-variant">{item.placeName} • rating {item.review.rating}/5</p>
                      {item.review.placeId && (
                        <button onClick={() => navigate(`/detail/${item.review.placeId}`)} className="text-sm font-semibold text-primary">
                          Lihat tempat
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-[2rem] border border-outline-variant/10 p-6 md:p-8">
              <p className="text-[10px] font-headline font-black uppercase tracking-[0.25em] text-primary mb-2">People To Follow</p>
              <h3 className="text-2xl md:text-3xl font-headline font-black mb-6">Kurator lokal yang mulai kebaca polanya</h3>
              <div className="space-y-4">
                {suggestedProfiles.length === 0 ? (
                  <div className="rounded-[1.75rem] border border-dashed border-outline-variant/30 p-6 text-on-surface-variant">
                    Belum ada profil yang cukup aktif untuk direkomendasikan.
                  </div>
                ) : (
                  suggestedProfiles.map((profile) => (
                    <div key={profile.userId} className="rounded-[1.75rem] bg-surface-container-low p-5 border border-outline-variant/10">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <button onClick={() => openProfile(profile.handle)} className="shrink-0">
                            <img src={profile.avatarUrl} alt={profile.displayName} className="w-14 h-14 rounded-[1.25rem] object-cover" />
                          </button>
                          <button onClick={() => openProfile(profile.handle)} className="min-w-0 text-left">
                            <p className="font-headline font-black text-lg truncate">{profile.displayName}</p>
                            <p className="text-sm text-on-surface-variant truncate">{profile.handle}</p>
                          </button>
                        </div>
                        <button
                          onClick={() => handleFollow(profile)}
                          className={`px-4 py-3 rounded-full text-xs font-headline font-black uppercase tracking-[0.15em] ${profile.isFollowing ? "bg-primary text-on-primary" : "bg-surface-bright text-on-surface"}`}
                        >
                          {profile.isFollowing ? "Following" : "Ikuti"}
                        </button>
                      </div>
                      <p className="text-sm text-on-surface-variant mt-4 leading-relaxed">{profile.bio}</p>
                      <div className="grid grid-cols-3 gap-3 mt-4">
                        <div className="rounded-2xl bg-surface-container-high p-3">
                          <p className="text-lg font-headline font-black">{profile.reviewCount}</p>
                          <p className="text-[10px] font-headline font-black uppercase tracking-[0.18em] text-on-surface-variant mt-1">Review</p>
                        </div>
                        <div className="rounded-2xl bg-surface-container-high p-3">
                          <p className="text-lg font-headline font-black">{profile.averageRating.toFixed(1)}</p>
                          <p className="text-[10px] font-headline font-black uppercase tracking-[0.18em] text-on-surface-variant mt-1">Avg</p>
                        </div>
                        <div className="rounded-2xl bg-surface-container-high p-3">
                          <p className="text-lg font-headline font-black">{profile.followerCount}</p>
                          <p className="text-[10px] font-headline font-black uppercase tracking-[0.18em] text-on-surface-variant mt-1">Follower</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </main>

        {showOnboarding && (
          <div className="fixed inset-0 z-[70] bg-black/35 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-surface rounded-[2rem] border border-outline-variant/10 p-6 md:p-8">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <p className="text-[10px] font-headline font-black uppercase tracking-[0.25em] text-primary mb-2">Quick Onboarding</p>
                  <h2 className="text-3xl font-headline font-black">Biar rekomendasinya lebih relevan</h2>
                  <p className="text-on-surface-variant mt-3 max-w-2xl">Pilih preferensi utama kamu. Ini dipakai untuk ngerapikan shortlist, planner, dan urutan rekomendasi di home.</p>
                </div>
                <button onClick={() => setShowOnboarding(false)} className="text-on-surface-variant">Tutup</button>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="font-headline font-black text-lg mb-3">Paling sering cari apa?</p>
                  <div className="grid md:grid-cols-3 gap-3">
                    {moodOptions.map((option) => (
                      <button key={option.id} onClick={() => handleToggle(option.id, selectedMoods, setSelectedMoods)} className={`text-left rounded-2xl border p-4 ${selectedMoods.includes(option.id) ? "border-primary bg-primary/5" : "border-outline-variant/10 bg-surface-container-low"}`}>
                        <p className="font-headline font-black">{option.label}</p>
                        <p className="text-sm text-on-surface-variant mt-2">{option.hint}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-headline font-black text-lg mb-3">Budget yang paling masuk?</p>
                  <div className="grid md:grid-cols-3 gap-3">
                    {budgetOptions.map((option) => (
                      <button key={option.id} onClick={() => handleToggle(option.id, selectedBudgets, setSelectedBudgets)} className={`text-left rounded-2xl border p-4 ${selectedBudgets.includes(option.id) ? "border-primary bg-primary/5" : "border-outline-variant/10 bg-surface-container-low"}`}>
                        <p className="font-headline font-black">{option.label}</p>
                        <p className="text-sm text-on-surface-variant mt-2">{option.hint}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-headline font-black text-lg mb-3">Biasanya konteksnya apa?</p>
                  <div className="grid md:grid-cols-3 gap-3">
                    {occasionOptions.map((option) => (
                      <button key={option.id} onClick={() => handleToggle(option.id, selectedOccasions, setSelectedOccasions)} className={`text-left rounded-2xl border p-4 ${selectedOccasions.includes(option.id) ? "border-primary bg-primary/5" : "border-outline-variant/10 bg-surface-container-low"}`}>
                        <p className="font-headline font-black">{option.label}</p>
                        <p className="text-sm text-on-surface-variant mt-2">{option.hint}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3 mt-8">
                <button onClick={handleSavePreferences} className="flex-1 bg-primary text-on-primary py-4 rounded-2xl font-headline font-black">Simpan preferensi</button>
                <button
                  onClick={() => {
                    const blankPreferences: DiscoveryPreferences = {
                      moods: [],
                      budgets: [],
                      occasions: [],
                      onboardedAt: new Date().toISOString(),
                    };
                    saveDiscoveryPreferences(blankPreferences);
                    setPreferences(blankPreferences);
                    setShowOnboarding(false);
                  }}
                  className="flex-1 bg-surface-container-high text-on-surface py-4 rounded-2xl font-headline font-black"
                >
                  Pakai default dulu
                </button>
              </div>
            </div>
          </div>
        )}

        <footer className="mt-32 mb-20 px-8 text-center">
          <div className="w-12 h-1 bg-primary/20 mx-auto mb-8" />
          <p className="font-headline font-bold text-on-surface-variant uppercase tracking-[0.4em] text-[10px]">Tegal Eats • Discovery That Helps You Decide</p>
        </footer>

        <BottomNav />
      </div>
    </DesktopLayout>
  );
}
