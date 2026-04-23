import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BottomNav } from "../components/BottomNav";
import { DesktopLayout } from "../components/DesktopLayout";
import { useNavigate } from "react-router-dom";
import { getDiscoveryPreferences, saveDiscoveryPreferences, DiscoveryMood, DiscoveryBudget, DiscoveryOccasion, DiscoveryPreferences } from "../utils/personalization";
import { getVisitPlanSummary, loadVisitPlans } from "../api/engagement";
import { AppReview, AppPlace } from "../api/contracts";
import { uploadImage } from "../../utils/uploadImage";
import { fetchFavoritePlaces, fetchUserReviews, listFavoritePlaceIds } from "../api/places";
import {
  ensureCurrentUserSocialProfile,
  fetchMySocialProfile,
  fetchProfileActivity,
  ProfileTimelineItem,
  SocialProfile,
  updateSocialProfile,
} from "../api/social";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../../supabaseClient";

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

export function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userReviews, setUserReviews] = useState<AppReview[]>([]);
  const [favoritePlaces, setFavoritePlaces] = useState<AppPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [visitPlans, setVisitPlans] = useState<{ placeId: string; placeName?: string; status: "wishlist" | "this_week" | "visited"; updatedAt: string }[]>([]);
  const [socialProfile, setSocialProfile] = useState<SocialProfile | null>(null);
  const [profileActivity, setProfileActivity] = useState<ProfileTimelineItem[]>([]);
  
  // Taste Profile (Onboarding Re-trigger)
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedMoods, setSelectedMoods] = useState<DiscoveryMood[]>([]);
  const [selectedBudgets, setSelectedBudgets] = useState<DiscoveryBudget[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<DiscoveryOccasion[]>([]);
  
  // Profile Editing
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const preferences = useMemo(() => getDiscoveryPreferences(), []);
  const visitPlanCounts = getVisitPlanSummary();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        await ensureCurrentUserSocialProfile(user);

        const [reviews, favoriteIds, plans, mySocialProfile, activity] = await Promise.all([
          fetchUserReviews(user.id),
          listFavoritePlaceIds(user.id),
          loadVisitPlans(user.id),
          fetchMySocialProfile(user),
          fetchProfileActivity(user.id, 6),
        ]);
        const places = await fetchFavoritePlaces(favoriteIds);

        if (cancelled) return;

        setUserReviews(reviews);
        setFavoritePlaces(places);
        setVisitPlans(plans.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)));
        setSocialProfile(mySocialProfile);
        setProfileActivity(activity);
        
        if (mySocialProfile) {
          setEditName(mySocialProfile.displayName);
          setEditBio(mySocialProfile.bio);
        }

        const prefs = getDiscoveryPreferences();
        if (prefs) {
          setSelectedMoods(prefs.moods);
          setSelectedBudgets(prefs.budgets);
          setSelectedOccasions(prefs.occasions);
        }
      } catch (profileError) {
        console.error("Failed to load profile data", profileError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const reviewPoints = userReviews.reduce((sum, review) => sum + review.rating * 10, 0);
  const profileTaste = [
    preferences?.moods.length ? preferences.moods.join(", ") : "Belum diatur",
    preferences?.budgets.length ? preferences.budgets.join(", ") : "Budget bebas",
    preferences?.occasions.length ? preferences.occasions.join(", ") : "Semua konteks",
  ];



  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setSavingProfile(true);
    try {
      await updateSocialProfile(user.id, {
        displayName: editName,
        bio: editBio
      });
      setSocialProfile(prev => prev ? { ...prev, displayName: editName, bio: editBio } : null);
      setShowEditProfile(false);
    } catch (e) {
      console.error("Failed to update profile", e);
      alert("Gagal memperbarui profil.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateAvatar = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !user?.id) return;

      setSavingProfile(true);
      try {
        const url = await uploadImage(file, "avatars");
        await updateSocialProfile(user.id, { avatarUrl: url });
        setSocialProfile(prev => prev ? { ...prev, avatarUrl: url } : null);
        alert("Foto profil berhasil diperbarui!");
      } catch (uploadErr: any) {
        console.error("Avatar upload failed:", uploadErr);
        alert("Gagal upload foto: " + uploadErr.message);
      } finally {
        setSavingProfile(false);
      }
    };
    input.click();
  };

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
    setShowOnboarding(false);
  };

  const openProfile = (handle: string) => {
    navigate(`/u/${handle.replace(/^@+/, "")}`);
  };

  return (
    <DesktopLayout>
      <div className="min-h-screen bg-background text-on-surface font-body pb-32">
        <header className="pt-20 pb-14 px-8 lg:px-12 max-w-[1400px] mx-auto relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 rounded-full blur-[120px] -rotate-12 translate-x-1/2" />
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }} className="relative z-10">
            <span className="font-headline font-black text-primary italic tracking-widest uppercase text-xs mb-4 block underline decoration-primary/30 underline-offset-8">Member Snapshot</span>
            <h1 className="text-5xl md:text-7xl font-headline font-extrabold tracking-tighter leading-[0.88] mb-5 text-on-surface">
              {socialProfile?.displayName?.split(" ")[0] || "Your"} profile,
              <br />
              <span className="text-primary italic">now with context.</span>
            </h1>
            <p className="text-on-surface-variant text-lg max-w-2xl">Halaman akun sekarang merangkum taste, kontribusi, dan planning kamu di Tegal Eats. Jadi ada alasan buat balik lihat progres, bukan cuma tombol logout.</p>
          </motion.div>
        </header>

        <main className="px-8 lg:px-12 max-w-[1400px] mx-auto space-y-10">
          <section className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-8">
            <div className="bg-surface-container-lowest p-8 rounded-[2rem] border border-outline-variant/10">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <img src={socialProfile?.avatarUrl || "https://i.pravatar.cc/180?img=48"} alt="Avatar" className="w-28 h-28 rounded-[1.5rem] object-cover grayscale-[0.2]" />
                <div>
                  <h2 className="text-3xl font-headline font-black">{socialProfile?.displayName || "Premium Member"}</h2>
                  <p className="text-sm text-on-surface-variant mt-2">{user?.email || "Guest mode"}</p>
                  <p className="text-sm text-primary font-semibold mt-3">{reviewPoints >= 120 ? "Top local contributor" : reviewPoints >= 50 ? "Active contributor" : "Masih pemanasan"}</p>
                  {socialProfile && (
                    <div className="flex gap-4 mt-3">
                      <button onClick={() => openProfile(socialProfile.handle)} className="text-sm text-on-surface-variant underline decoration-primary/30 underline-offset-4">
                        {socialProfile.handle}
                      </button>
                      <button onClick={() => setShowEditProfile(true)} className="text-sm text-primary font-bold uppercase tracking-widest">
                        Edit Profil
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="bg-surface-container-low rounded-2xl p-4"><p className="text-2xl font-headline font-black">{userReviews.length}</p><p className="text-xs text-on-surface-variant mt-1">Review</p></div>
                <div className="bg-surface-container-low rounded-2xl p-4"><p className="text-2xl font-headline font-black">{favoritePlaces.length}</p><p className="text-xs text-on-surface-variant mt-1">Favorit</p></div>
                <div className="bg-surface-container-low rounded-2xl p-4"><p className="text-2xl font-headline font-black">{visitPlanCounts.this_week}</p><p className="text-xs text-on-surface-variant mt-1">Plan minggu ini</p></div>
                <div className="bg-surface-container-low rounded-2xl p-4"><p className="text-2xl font-headline font-black">{reviewPoints}</p><p className="text-xs text-on-surface-variant mt-1">Points</p></div>
              </div>

              {socialProfile && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="bg-surface-container-low rounded-2xl p-4"><p className="text-2xl font-headline font-black">{socialProfile.followerCount}</p><p className="text-xs text-on-surface-variant mt-1">Follower</p></div>
                  <div className="bg-surface-container-low rounded-2xl p-4"><p className="text-2xl font-headline font-black">{socialProfile.followingCount}</p><p className="text-xs text-on-surface-variant mt-1">Following</p></div>
                  <div className="bg-surface-container-low rounded-2xl p-4"><p className="text-2xl font-headline font-black">{socialProfile.averageRating ? socialProfile.averageRating.toFixed(1) : "0.0"}</p><p className="text-xs text-on-surface-variant mt-1">Avg rating</p></div>
                </div>
              )}
            </div>

            <div className="bg-surface-container-lowest p-8 rounded-[2rem] border border-outline-variant/10">
              <p className="text-[10px] font-headline font-black uppercase tracking-[0.25em] text-primary mb-3">Taste Profile</p>
              <h2 className="text-3xl font-headline font-black mb-6">Selera yang tersimpan</h2>
              {socialProfile && <p className="text-on-surface-variant mb-6">{socialProfile.bio}</p>}
              <div className="grid gap-4">
                <div className="rounded-2xl bg-surface-container-low p-4 border border-outline-variant/10"><p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant font-headline font-black mb-2">Mood utama</p><p className="font-semibold">{profileTaste[0]}</p></div>
                <div className="rounded-2xl bg-surface-container-low p-4 border border-outline-variant/10"><p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant font-headline font-black mb-2">Budget</p><p className="font-semibold">{profileTaste[1]}</p></div>
                <div className="rounded-2xl bg-surface-container-low p-4 border border-outline-variant/10"><p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant font-headline font-black mb-2">Konteks favorit</p><p className="font-semibold">{profileTaste[2]}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button onClick={() => setShowOnboarding(true)} className="bg-primary text-on-primary py-4 rounded-2xl font-headline font-black uppercase tracking-widest text-xs">Atur Taste</button>
                <button onClick={() => navigate("/favorit")} className="bg-surface-container-high text-on-surface py-4 rounded-2xl font-headline font-black uppercase tracking-widest text-xs">Lihat planner</button>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8">
            <div className="bg-surface-container-lowest p-8 rounded-[2rem] border border-outline-variant/10">
              <div className="flex items-end justify-between gap-4 mb-6"><div><p className="text-[10px] font-headline font-black uppercase tracking-[0.25em] text-primary mb-3">Recent Reviews</p><h2 className="text-3xl font-headline font-black">Kontribusi terakhir kamu</h2></div></div>

              {loading ? (
                <div className="grid md:grid-cols-2 gap-6"><div className="h-48 bg-surface-container animate-pulse rounded-[2rem]" /><div className="h-48 bg-surface-container animate-pulse rounded-[2rem]" /></div>
              ) : userReviews.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-outline-variant/30 p-8 text-on-surface-variant">Belum ada review. Begitu kamu mulai review, progres kontribusi akan terasa jauh lebih hidup dari sini.</div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {userReviews.slice(0, 4).map((review) => (
                    <div key={review.id} className="rounded-[2rem] bg-surface-container-low border border-outline-variant/10 overflow-hidden">
                      <div className="h-44 bg-surface-container">
                        {review.imageUrls[0] ? (
                          <img src={review.imageUrls[0]} alt={review.placeName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-5xl text-on-surface-variant opacity-10">photo</span></div>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="font-headline font-black text-xl">{review.placeName}</h3>
                        <p className="text-sm text-on-surface-variant mt-2 line-clamp-3">{review.comment || "Belum ada komentar tambahan."}</p>
                        <p className="text-sm text-primary font-semibold mt-4">Rating {review.rating}/5</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-8">
              <div className="bg-surface-container-lowest p-8 rounded-[2rem] border border-outline-variant/10">
                <p className="text-[10px] font-headline font-black uppercase tracking-[0.25em] text-primary mb-3">Planner Snapshot</p>
                <h2 className="text-3xl font-headline font-black mb-5">Pergerakan planning</h2>
                <div className="space-y-3">
                  {visitPlans.slice(0, 4).map((plan) => (
                    <div key={plan.placeId} className="rounded-2xl bg-surface-container-low p-4 border border-outline-variant/10">
                      <p className="font-headline font-black">{plan.placeName || "Tempat tersimpan"}</p>
                      <p className="text-sm text-on-surface-variant mt-1">{plan.status === "wishlist" ? "Masih di wishlist" : plan.status === "this_week" ? "Masuk shortlist minggu ini" : "Sudah ditandai pernah dikunjungi"}</p>
                    </div>
                  ))}
                  {visitPlans.length === 0 && <div className="rounded-2xl border border-dashed border-outline-variant/30 p-4 text-on-surface-variant">Kamu belum membuat rencana kunjungan. Gunakan tombol planner di halaman detail.</div>}
                </div>
              </div>

              <div className="bg-surface-container-lowest p-8 rounded-[2rem] border border-outline-variant/10">
                <p className="text-[10px] font-headline font-black uppercase tracking-[0.25em] text-primary mb-3">Social Timeline</p>
                <h2 className="text-3xl font-headline font-black mb-5">Jejak kontribusi terbaru</h2>
                <div className="space-y-4">
                  {profileActivity.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-outline-variant/30 p-4 text-on-surface-variant">Aktivitas sosial akan muncul begitu kamu mulai review tempat.</div>
                  ) : (
                    profileActivity.map((item) => (
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

              <div className="bg-surface-container-lowest p-8 rounded-[2rem] border border-outline-variant/10">
                <p className="text-[10px] font-headline font-black uppercase tracking-[0.25em] text-primary mb-3">Account</p>
                <div className="grid gap-3">
                  <button onClick={handleLogout} className="w-full text-left rounded-2xl bg-surface-container-low p-4 border border-outline-variant/10"><p className="font-headline font-black text-error">Logout</p><p className="text-sm text-on-surface-variant mt-1">Keluar dari akun sekarang.</p></button>
                </div>
              </div>
            </div>
          </section>
        </main>

        <AnimatePresence>
          {showEditProfile && (
            <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-lg bg-surface rounded-[2rem] p-8 border border-outline-variant/10 shadow-2xl">
                <h2 className="text-3xl font-headline font-black mb-6">Ubah Profil</h2>
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-4">
                    <img src={socialProfile?.avatarUrl || "https://i.pravatar.cc/180?img=48"} alt="Preview" className="w-20 h-20 rounded-2xl object-cover" />
                    <button onClick={handleUpdateAvatar} className="bg-surface-container-high text-on-surface px-4 py-2 rounded-xl text-xs font-headline font-black uppercase tracking-widest border border-outline-variant/10">
                      Ganti Foto
                    </button>
                  </div>
                  <div>
                    <label className="text-[10px] font-headline font-black uppercase tracking-[0.2em] text-primary mb-2 block">Display Name</label>
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl p-4 text-on-surface font-body font-semibold outline-none focus:border-primary/30" />
                  </div>
                  <div>
                    <label className="text-[10px] font-headline font-black uppercase tracking-[0.2em] text-primary mb-2 block">Bio</label>
                    <textarea value={editBio} onChange={e => setEditBio(e.target.value)} className="w-full h-32 bg-surface-container-low border border-outline-variant/10 rounded-2xl p-4 text-on-surface font-body outline-none focus:border-primary/30 resize-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-8">
                  <button onClick={() => setShowEditProfile(false)} className="py-4 rounded-2xl font-headline font-black text-on-surface-variant uppercase tracking-widest text-xs">Batal</button>
                  <button onClick={handleSaveProfile} disabled={savingProfile} className="bg-primary text-on-primary py-4 rounded-2xl font-headline font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20">{savingProfile ? "Menyimpan..." : "Simpan"}</button>
                </div>
              </motion.div>
            </div>
          )}
          
          {showOnboarding && (
            <div className="fixed inset-0 z-[70] bg-black/35 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
              <div className="w-full max-w-3xl bg-surface rounded-[2rem] border border-outline-variant/10 p-6 md:p-8">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <p className="text-[10px] font-headline font-black uppercase tracking-[0.25em] text-primary mb-2">Taste Settings</p>
                    <h2 className="text-3xl font-headline font-black">Sesuaikan preferensi kamu</h2>
                    <p className="text-on-surface-variant mt-3 max-w-2xl">Preferensi ini dipakai untuk ngerapikan shortlist, planner, dan urutan rekomendasi di home.</p>
                  </div>
                  <button onClick={() => setShowOnboarding(false)} className="text-on-surface-variant"><span className="material-symbols-outlined">close</span></button>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="font-headline font-black text-lg mb-3">Cari apa?</p>
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
                    <p className="font-headline font-black text-lg mb-3">Budget?</p>
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
                    <p className="font-headline font-black text-lg mb-3">Konteks?</p>
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
                  <button onClick={handleSavePreferences} className="flex-1 bg-primary text-on-primary py-4 rounded-2xl font-headline font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20">Simpan preferensi</button>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

        <BottomNav />
      </div>
    </DesktopLayout>
  );
}
