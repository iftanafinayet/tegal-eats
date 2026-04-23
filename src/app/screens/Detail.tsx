import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useNavigate, useParams } from "react-router-dom";
import { AppPlace, AppReview, isPlaceOpenNow } from "../api/contracts";
import { ReviewSkeleton, Skeleton } from "../components/Skeleton";
import {
  getLocalVisitPlan,
  hasLocalReviewAppreciation,
  loadReviewAppreciations,
  saveVisitPlan,
  toggleReviewTrust,
} from "../api/engagement";
import {
  fetchPlaceById,
  fetchReviewsForPlace,
  isPlaceFavorited,
  setPlaceFavorite,
} from "../api/places";
import { useAuth } from "../contexts/AuthContext";

type ReviewCard = AppReview & {
  trustLabel: string;
};

const defaultPlace: AppPlace = {
  id: "",
  name: "Memuat...",
  category: "",
  imageUrl: null,
  rating: 0,
  reviewCount: 0,
  distanceKm: null,
  priceLabel: "Belum ada info harga",
  description: "Memuat detail tempat...",
  hours: "Cek jam operasional",
  address: "Alamat belum tersedia",
  lat: null,
  lng: null,
};

function getReviewTrustLabel(review: AppReview) {
  if (review.imageUrls.length > 0 && review.likes >= 2) return "Paling meyakinkan";
  if (review.comment.length > 120) return "Review detail";
  if (review.rating >= 4) return "Positif kuat";
  return "Masukan komunitas";
}

function getPlaceStatus(hours: string) {
  if (isPlaceOpenNow(hours)) {
    return "Buka Sekarang";
  }
  return "Tutup";
}

function buildMapsUrl(place: AppPlace) {
  if (place.lat != null && place.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${place.address}`)}`;
}

export function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"terbaru" | "terbantu" | "foto">("terbaru");
  const [isFavorite, setIsFavorite] = useState(false);
  const [place, setPlace] = useState<AppPlace>(defaultPlace);
  const [reviews, setReviews] = useState<ReviewCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedReviewIds, setLikedReviewIds] = useState<Set<string>>(new Set());
  const [visitPlanStatus, setVisitPlanStatus] = useState<"wishlist" | "this_week" | "visited" | null>(null);

  useEffect(() => {
    if (!id) return;
    setVisitPlanStatus(getLocalVisitPlan(id)?.status ?? null);
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      if (!id) return;
      setLoading(true);

      try {
        const [placeData, reviewData, backendLikedIds] = await Promise.all([
          fetchPlaceById(id),
          fetchReviewsForPlace(id),
          loadReviewAppreciations(user?.id, id),
        ]);

        if (cancelled) return;

        if (placeData) {
          setPlace(placeData);
        }

        const mappedReviews = reviewData.map((review) => ({
          ...review,
          trustLabel: getReviewTrustLabel(review),
        }));
        setReviews(mappedReviews);

        const combinedLiked = new Set<string>([
          ...mappedReviews.filter((review) => hasLocalReviewAppreciation(id, review.id)).map((review) => review.id),
          ...Array.from(backendLikedIds),
        ]);
        setLikedReviewIds(combinedLiked);

        if (user?.id) {
          try {
            setIsFavorite(await isPlaceFavorited(user.id, id));
          } catch (favoriteError) {
            console.error("Failed to check favorite status", favoriteError);
          }
        }
      } catch (loadError) {
        console.error("Failed to load detail", loadError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [id, user?.id]);

  const reviewStats = useMemo(
    () => ({
      withPhoto: reviews.filter((review) => review.imageUrls.length > 0).length,
      strongPositive: reviews.filter((review) => review.rating >= 4).length,
      communityTrusted: reviews.filter((review) => review.likes >= 2).length,
    }),
    [reviews]
  );

  const visibleReviews = useMemo(() => {
    const nextReviews = [...reviews];

    if (activeTab === "terbantu") {
      nextReviews.sort(
        (a, b) =>
          b.likes + (likedReviewIds.has(b.id) ? 1 : 0) - (a.likes + (likedReviewIds.has(a.id) ? 1 : 0))
      );
      return nextReviews;
    }

    if (activeTab === "foto") {
      return nextReviews.filter((review) => review.imageUrls.length > 0);
    }

    nextReviews.sort((a, b) => (a.createdAt && b.createdAt && a.createdAt < b.createdAt ? 1 : -1));
    return nextReviews;
  }, [activeTab, likedReviewIds, reviews]);

  const decisionCards = [
    { label: "Alamat", value: place.address },
    { label: "Jam", value: place.hours },
    { label: "Budget", value: place.priceLabel },
    { label: "Status", value: getPlaceStatus(place.hours) },
  ];

  const trustSignals = [
    `${reviewStats.withPhoto} review pakai foto`,
    `${reviewStats.communityTrusted} review disukai komunitas`,
    `${reviewStats.strongPositive} review kasih rating 4+`,
  ];

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: place.name,
          text: `Cek ${place.name} di Tegal Eats`,
          url: window.location.href,
        });
      } catch (shareError) {
        console.error("Error sharing:", shareError);
      }
      return;
    }

    await navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard!");
  };

  const handleAppreciate = async (reviewId: string) => {
    if (!id) return;

    try {
      const nextValue = await toggleReviewTrust(user?.id, id, reviewId);
      setLikedReviewIds((prev) => {
        const next = new Set(prev);
        if (nextValue) next.add(reviewId);
        else next.delete(reviewId);
        return next;
      });
    } catch (appreciationError) {
      console.error("Failed to update review appreciation", appreciationError);
    }
  };

  const handleSetVisitPlan = async (status: "wishlist" | "this_week" | "visited") => {
    if (!id) return;
    const plan = {
      placeId: id,
      placeName: place.name,
      status,
      updatedAt: new Date().toISOString(),
    } as const;

    try {
      await saveVisitPlan(user?.id, plan);
      setVisitPlanStatus(status);
    } catch (planError) {
      console.error("Failed to save visit plan", planError);
    }
  };

  const toggleFavorite = async () => {
    if (!user?.id || !id) {
      navigate("/login");
      return;
    }

    try {
      await setPlaceFavorite(user.id, id, !isFavorite);
      setIsFavorite((prev) => !prev);
    } catch (favoriteError) {
      console.error("Failed to toggle favorite", favoriteError);
      alert("Gagal memperbarui favorit");
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-body overflow-x-hidden">
      <div className="relative min-h-[60vh] w-full overflow-hidden">
        {place.imageUrl ? (
          <motion.img initial={{ scale: 1.05 }} animate={{ scale: 1 }} transition={{ duration: 1.1, ease: "easeOut" }} src={place.imageUrl} alt={place.name} className="w-full h-[60vh] md:h-[72vh] object-cover" />
        ) : (
          <div className="w-full h-[60vh] md:h-[72vh] bg-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined text-9xl text-on-surface-variant opacity-10">restaurant</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

        <div className="absolute top-10 left-0 right-0 px-6 flex justify-between items-center z-30">
          <button onClick={() => navigate(-1)} className="bg-surface-bright/85 backdrop-blur-md p-3 rounded-full text-on-surface border border-white/20">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>

          <div className="flex gap-3">
            <button onClick={handleShare} className="bg-surface-bright/85 backdrop-blur-md p-3 rounded-full text-on-surface border border-white/20">
              <span className="material-symbols-outlined">share</span>
            </button>
            <button onClick={toggleFavorite} className={`bg-surface-bright/85 backdrop-blur-md p-3 rounded-full border border-white/20 ${isFavorite ? "text-primary" : "text-on-surface"}`}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "" }}>favorite</span>
            </button>
          </div>
        </div>

        <div className="absolute bottom-12 left-0 right-0 px-8 z-20">
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <div className="space-y-4">
                <Skeleton variant="text" className="h-6 w-32" />
                <Skeleton variant="text" className="h-16 w-3/4 md:w-1/2" />
                <div className="flex gap-4">
                  <Skeleton variant="text" className="h-6 w-24" />
                  <Skeleton variant="text" className="h-6 w-24" />
                </div>
              </div>
            ) : (
              <>
                <span className="font-headline font-black text-primary italic tracking-widest uppercase text-xs mb-4 block">Decision Page</span>
                <h1 className="text-4xl md:text-7xl font-headline font-extrabold text-on-surface tracking-tighter leading-[0.92] mb-4 max-w-4xl">{place.name}</h1>
                <div className="flex flex-wrap items-center gap-4 md:gap-6">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="text-xl font-bold">{place.rating || "4.5"}</span>
                    <span className="text-on-surface-variant text-sm font-medium">({place.reviewCount} review)</span>
                  </div>
                  <span className="text-on-surface font-headline font-bold uppercase tracking-widest text-xs px-3 py-1 bg-primary/10 rounded-full">{place.category || "Venue"}</span>
                  <span className="text-on-surface-variant text-sm">{place.distanceKm ? `${place.distanceKm.toFixed(1)} km` : "-"}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-8 py-14 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-8">
          <section className="bg-surface-container-lowest rounded-[2rem] p-6 md:p-8 border border-outline-variant/10">
            <p className="text-[10px] font-headline font-black uppercase tracking-[0.25em] text-primary mb-3">Ringkasan</p>
            <h2 className="text-2xl font-headline font-black mb-4">Apa yang perlu kamu tahu dulu</h2>
            <p className="text-on-surface-variant leading-relaxed">{place.description}</p>
            <div className="grid grid-cols-2 gap-3 mt-6">
              {decisionCards.map((card) => (
                <div key={card.label} className="rounded-2xl bg-surface-container-low p-4 border border-outline-variant/10">
                  <p className="text-[10px] font-headline font-black uppercase tracking-[0.2em] text-on-surface-variant mb-2">{card.label}</p>
                  <p className="font-semibold leading-snug">{card.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-[2rem] p-6 md:p-8 border border-outline-variant/10">
            <p className="text-[10px] font-headline font-black uppercase tracking-[0.25em] text-primary mb-3">Plan This</p>
            <h2 className="text-2xl font-headline font-black mb-5">Bikin tempat ini punya next action</h2>
            <div className="grid gap-3">
              {([
                ["wishlist", "Masuk wishlist", "Simpan dulu untuk nanti."],
                ["this_week", "Masuk plan minggu ini", "Tandai sebagai kandidat terdekat."],
                ["visited", "Sudah pernah coba", "Biar gampang cari tempat yang layak revisit."],
              ] as const).map(([status, title, subtitle]) => (
                <button key={status} onClick={() => handleSetVisitPlan(status)} className={`text-left rounded-2xl p-4 border ${visitPlanStatus === status ? "border-primary bg-primary/5" : "border-outline-variant/10 bg-surface-container-low"}`}>
                  <p className="font-headline font-black">{title}</p>
                  <p className="text-sm text-on-surface-variant mt-1">{subtitle}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-[2rem] p-6 md:p-8 border border-outline-variant/10">
            <p className="text-[10px] font-headline font-black uppercase tracking-[0.25em] text-primary mb-3">Action</p>
            <div className="grid gap-3">
              <button onClick={() => window.open(buildMapsUrl(place), "_blank", "noopener,noreferrer")} className="w-full bg-primary text-on-primary py-4 rounded-2xl font-headline font-black">Buka rute di Google Maps</button>
              <button onClick={() => navigate(`/review/${id}`)} className="w-full bg-surface-container-high text-on-surface py-4 rounded-2xl font-headline font-black">Tulis review kamu</button>
            </div>
          </section>
        </div>

        <div className="lg:col-span-7 space-y-8">
          <section className="bg-surface-container-lowest rounded-[2rem] p-6 md:p-8 border border-outline-variant/10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
              <div>
                <p className="text-[10px] font-headline font-black uppercase tracking-[0.25em] text-primary mb-3">Trust Layer</p>
                <h2 className="text-2xl md:text-3xl font-headline font-black">Apakah review di sini cukup meyakinkan?</h2>
              </div>
              <div className="flex gap-2 flex-wrap">
                {(["terbaru", "terbantu", "foto"] as const).map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-full text-xs font-headline font-black uppercase tracking-[0.15em] ${activeTab === tab ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant"}`}>
                    {tab === "terbaru" ? "Terbaru" : tab === "terbantu" ? "Terbantu" : "Ada Foto"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3 mb-8">
              {trustSignals.map((signal) => (
                <div key={signal} className="rounded-2xl bg-surface-container-low p-4 border border-outline-variant/10">
                  <p className="font-semibold text-sm leading-relaxed">{signal}</p>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              {loading ? (
                <ReviewSkeleton />
              ) : visibleReviews.length === 0 ? (
                <div className="bg-surface-container-low p-10 text-center rounded-[2rem] border border-dashed border-outline-variant/30">
                  <p className="font-headline font-black text-xl mb-2">Belum ada review yang cocok dengan filter ini</p>
                  <p className="text-on-surface-variant">Coba ganti filter, atau jadi orang pertama yang kasih konteks buat tempat ini.</p>
                </div>
              ) : (
                visibleReviews.map((review) => (
                  <motion.article key={review.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-surface-container-low rounded-[2rem] p-5 md:p-6 border border-outline-variant/10">
                    <header className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <img src={review.avatarUrl} className="w-12 h-12 rounded-full object-cover" alt="avatar" />
                        <div className="min-w-0">
                          <p className="font-headline font-black text-lg truncate">@{review.userName}</p>
                          <div className="flex gap-0.5 mt-1">
                            {[...Array(5)].map((_, index) => (
                              <span key={index} className={`material-symbols-outlined text-[14px] ${index < review.rating ? "text-secondary" : "text-on-surface-variant/20"}`} style={{ fontVariationSettings: index < review.rating ? "'FILL' 1" : "" }}>star</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-headline font-black uppercase tracking-[0.18em] text-primary">{review.trustLabel}</p>
                        <p className="text-xs text-on-surface-variant mt-1">{review.createdAt ? new Date(review.createdAt).toLocaleDateString("id-ID") : ""}</p>
                      </div>
                    </header>

                    <p className="text-on-surface leading-relaxed mb-4">{review.comment || "User tidak menulis komentar tambahan."}</p>

                    {review.imageUrls[0] && (
                      <div className="mb-4 rounded-[1.5rem] overflow-hidden h-64">
                        <img src={review.imageUrls[0]} className="w-full h-full object-cover" alt="review context" />
                      </div>
                    )}

                    <footer className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-2 rounded-full bg-surface-bright text-xs font-headline font-black uppercase tracking-[0.15em] text-on-surface-variant">{review.imageUrls.length ? "Ada foto" : "Tanpa foto"}</span>
                        <span className="px-3 py-2 rounded-full bg-surface-bright text-xs font-headline font-black uppercase tracking-[0.15em] text-on-surface-variant">{review.rating >= 4 ? "Positif" : "Perlu dicermati"}</span>
                      </div>
                      <button onClick={() => handleAppreciate(review.id)} className={`px-4 py-2 rounded-full text-xs font-headline font-black uppercase tracking-[0.15em] ${likedReviewIds.has(review.id) ? "bg-primary text-on-primary" : "bg-surface-bright text-on-surface-variant"}`}>
                        {review.likes + (likedReviewIds.has(review.id) ? 1 : 0)} apresiasi
                      </button>
                    </footer>
                  </motion.article>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-6 z-50 md:hidden bg-gradient-to-t from-background to-transparent pb-10">
        <div className="bg-surface-bright/85 backdrop-blur-2xl p-4 rounded-[1.75rem] border border-white/20 flex gap-3">
          <button onClick={() => navigate(`/review/${id}`)} className="flex-1 bg-primary text-on-primary py-4 rounded-2xl font-headline font-black">Review</button>
          <button onClick={() => window.open(buildMapsUrl(place), "_blank", "noopener,noreferrer")} className="flex-1 bg-surface-container-high text-on-surface py-4 rounded-2xl font-headline font-black">Maps</button>
        </div>
      </div>

      <div className="h-32 md:hidden" />
    </div>
  );
}
