import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useNavigate, useParams } from "react-router-dom";
import { BottomNav } from "../components/BottomNav";
import { DesktopLayout } from "../components/DesktopLayout";
import { AppReview } from "../api/contracts";
import {
  fetchProfileActivity,
  fetchProfileReviews,
  fetchPublicSocialProfile,
  followProfile,
  ProfileTimelineItem,
  SocialProfile,
} from "../api/social";
import { useAuth } from "../contexts/AuthContext";

export function PublicProfile() {
  const navigate = useNavigate();
  const { handle } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [reviews, setReviews] = useState<AppReview[]>([]);
  const [activity, setActivity] = useState<ProfileTimelineItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      if (!handle) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const publicProfile = await fetchPublicSocialProfile(handle, user?.id);

        if (!publicProfile) {
          if (!cancelled) {
            setProfile(null);
            setReviews([]);
            setActivity([]);
            setLoading(false);
          }
          return;
        }

        const [nextReviews, nextActivity] = await Promise.all([
          fetchProfileReviews(publicProfile.userId, 6),
          fetchProfileActivity(publicProfile.userId, 6),
        ]);

        if (cancelled) return;

        setProfile(publicProfile);
        setReviews(nextReviews);
        setActivity(nextActivity);
      } catch (loadError) {
        console.error("Failed to load public profile", loadError);
        if (!cancelled) {
          setProfile(null);
          setReviews([]);
          setActivity([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [handle, user?.id]);

  const handleToggleFollow = async () => {
    if (!profile) return;
    if (!user?.id) {
      navigate("/login");
      return;
    }

    const nextFollowState = !profile.isFollowing;

    try {
      await followProfile(user.id, profile.userId, nextFollowState);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              isFollowing: nextFollowState,
              followerCount: Math.max(0, prev.followerCount + (nextFollowState ? 1 : -1)),
            }
          : prev
      );
    } catch (followError) {
      console.error("Failed to update follow status", followError);
    }
  };

  const isOwnProfile = Boolean(profile && user?.id === profile.userId);

  return (
    <DesktopLayout>
      <div className="min-h-screen bg-background text-on-surface font-body pb-32">
        <header className="pt-20 pb-14 px-8 lg:px-12 max-w-[1400px] mx-auto relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 rounded-full blur-[120px] -rotate-12 translate-x-1/2" />
          <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }} className="relative z-10">
            <button onClick={() => navigate(-1)} className="mb-6 text-sm font-semibold text-primary">
              Kembali
            </button>
            <span className="font-headline font-black text-primary italic tracking-widest uppercase text-xs mb-4 block underline decoration-primary/30 underline-offset-8">Public Profile</span>
            <h1 className="text-5xl md:text-7xl font-headline font-extrabold tracking-tighter leading-[0.9] max-w-4xl">
              {loading ? "Memuat profil..." : profile ? profile.displayName : "Profil tidak ditemukan"}
            </h1>
            <p className="text-on-surface-variant text-lg max-w-2xl mt-5">
              {profile ? profile.bio : "Handle ini belum punya profil publik atau migration sosial belum dijalankan."}
            </p>
          </motion.div>
        </header>

        <main className="px-8 lg:px-12 max-w-[1400px] mx-auto space-y-10">
          {profile ? (
            <>
              <section className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-8">
                <div className="bg-surface-container-lowest p-8 rounded-[2rem] border border-outline-variant/10">
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <img src={profile.avatarUrl} alt={profile.displayName} className="w-28 h-28 rounded-[1.5rem] object-cover" />
                    <div>
                      <h2 className="text-3xl font-headline font-black">{profile.displayName}</h2>
                      <p className="text-sm text-on-surface-variant mt-2">{profile.handle}</p>
                      <p className="text-sm text-primary font-semibold mt-3">
                        {profile.reviewCount >= 8 ? "Kurator lokal aktif" : profile.reviewCount >= 3 ? "Reviewer aktif" : "Mulai membangun jejak"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    <div className="bg-surface-container-low rounded-2xl p-4"><p className="text-2xl font-headline font-black">{profile.reviewCount}</p><p className="text-xs text-on-surface-variant mt-1">Review</p></div>
                    <div className="bg-surface-container-low rounded-2xl p-4"><p className="text-2xl font-headline font-black">{profile.averageRating ? profile.averageRating.toFixed(1) : "0.0"}</p><p className="text-xs text-on-surface-variant mt-1">Avg rating</p></div>
                    <div className="bg-surface-container-low rounded-2xl p-4"><p className="text-2xl font-headline font-black">{profile.followerCount}</p><p className="text-xs text-on-surface-variant mt-1">Follower</p></div>
                    <div className="bg-surface-container-low rounded-2xl p-4"><p className="text-2xl font-headline font-black">{profile.followingCount}</p><p className="text-xs text-on-surface-variant mt-1">Following</p></div>
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-8 rounded-[2rem] border border-outline-variant/10">
                  <p className="text-[10px] font-headline font-black uppercase tracking-[0.25em] text-primary mb-3">Context</p>
                  <h2 className="text-3xl font-headline font-black mb-6">Bagaimana pola rekomendasinya kebaca</h2>
                  <div className="grid gap-4">
                    <div className="rounded-2xl bg-surface-container-low p-4 border border-outline-variant/10"><p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant font-headline font-black mb-2">Kecenderungan</p><p className="font-semibold">{profile.averageRating >= 4.3 ? "Sering kasih sinyal positif ke tempat yang konsisten" : "Punya mix review positif dan kritis"}</p></div>
                    <div className="rounded-2xl bg-surface-container-low p-4 border border-outline-variant/10"><p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant font-headline font-black mb-2">Volume</p><p className="font-semibold">{profile.reviewCount >= 6 ? "Sudah cukup banyak untuk jadi bahan referensi" : "Masih tahap awal, tapi pola mulai terbentuk"}</p></div>
                    <div className="rounded-2xl bg-surface-container-low p-4 border border-outline-variant/10"><p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant font-headline font-black mb-2">Jaringan</p><p className="font-semibold">{profile.followerCount >= 3 ? "Sudah mulai punya audiens komunitas" : "Masih kecil, tapi bisa tumbuh seiring aktivitas"}</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    {!isOwnProfile ? (
                      <button onClick={handleToggleFollow} className={`py-4 rounded-2xl font-headline font-black ${profile.isFollowing ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface"}`}>
                        {profile.isFollowing ? "Following" : "Ikuti profil ini"}
                      </button>
                    ) : (
                      <button onClick={() => navigate("/profile")} className="py-4 rounded-2xl font-headline font-black bg-primary text-on-primary">
                        Buka profil saya
                      </button>
                    )}
                    <button onClick={() => navigate("/home")} className="py-4 rounded-2xl font-headline font-black bg-surface-container-high text-on-surface">
                      Balik ke discovery
                    </button>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8">
                <div className="bg-surface-container-lowest p-8 rounded-[2rem] border border-outline-variant/10">
                  <p className="text-[10px] font-headline font-black uppercase tracking-[0.25em] text-primary mb-3">Recent Reviews</p>
                  <h2 className="text-3xl font-headline font-black mb-6">Review terbaru dari profil ini</h2>
                  {reviews.length === 0 ? (
                    <div className="rounded-[2rem] border border-dashed border-outline-variant/30 p-8 text-on-surface-variant">
                      Belum ada review publik yang bisa ditampilkan.
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                      {reviews.map((review) => (
                        <button key={review.id} onClick={() => review.placeId && navigate(`/detail/${review.placeId}`)} className="rounded-[2rem] bg-surface-container-low border border-outline-variant/10 overflow-hidden text-left">
                          <div className="h-44 bg-surface-container">
                            {review.imageUrls[0] ? (
                              <img src={review.imageUrls[0]} alt={review.placeName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-5xl text-on-surface-variant opacity-10">photo</span></div>
                            )}
                          </div>
                          <div className="p-5">
                            <div className="flex items-center justify-between gap-3">
                              <h3 className="font-headline font-black text-xl">{review.placeName}</h3>
                              <span className="text-sm font-semibold text-primary">{review.rating}/5</span>
                            </div>
                            <p className="text-sm text-on-surface-variant mt-2 line-clamp-3">{review.comment || "Review tanpa komentar panjang."}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-surface-container-lowest p-8 rounded-[2rem] border border-outline-variant/10">
                  <p className="text-[10px] font-headline font-black uppercase tracking-[0.25em] text-primary mb-3">Activity</p>
                  <h2 className="text-3xl font-headline font-black mb-6">Timeline aktivitas</h2>
                  <div className="space-y-4">
                    {activity.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-outline-variant/30 p-4 text-on-surface-variant">
                        Timeline belum terbentuk.
                      </div>
                    ) : (
                      activity.map((item) => (
                        <div key={item.id} className="rounded-2xl bg-surface-container-low p-4 border border-outline-variant/10">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-headline font-black">{item.title}</p>
                              <p className="text-sm text-on-surface-variant mt-1">{item.detail}</p>
                            </div>
                            <span className="text-xs text-on-surface-variant shrink-0">{item.relativeLabel}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>
            </>
          ) : (
            <section className="bg-surface-container-lowest p-16 rounded-[2rem] border border-outline-variant/10 text-center">
              <h2 className="text-3xl font-headline font-black">Profil publik belum tersedia</h2>
              <p className="text-on-surface-variant max-w-2xl mx-auto mt-4">
                Handle ini belum ditemukan, atau tabel sosial belum aktif di database.
              </p>
              <button onClick={() => navigate("/home")} className="mt-8 px-8 py-4 rounded-2xl bg-primary text-on-primary font-headline font-black">
                Kembali ke home
              </button>
            </section>
          )}
        </main>

        <BottomNav />
      </div>
    </DesktopLayout>
  );
}
