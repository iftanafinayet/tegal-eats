import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PlaceRecord, ReviewRecord } from "../../api/contracts";
import {
  listAllPlaces,
  listAllReviews,
  updatePlace,
  deletePlace,
  deleteReview,
} from "../../api/places";
import { uploadImage } from "../../../utils/uploadImage";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

type AdminTab = "overview" | "places" | "reviews";

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <span className="material-symbols-outlined text-3xl text-white/40 mb-3 block">{icon}</span>
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="text-xs text-white/40 font-mono uppercase tracking-widest mt-1">{label}</p>
    </div>
  );
}

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#111] border border-white/10 rounded-2xl p-8 max-w-sm w-full"
      >
        <span className="material-symbols-outlined text-5xl text-red-400 mb-4 block">warning</span>
        <h3 className="text-xl font-black text-white mb-2">Konfirmasi Hapus</h3>
        <p className="text-white/50 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-bold"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-bold"
          >
            Hapus
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function EditModal({
  place,
  onClose,
  onSave,
}: {
  place: PlaceRecord;
  onClose: () => void;
  onSave: (updated: PlaceRecord) => void;
}) {
  const [form, setForm] = useState({ ...place });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(form.image_url ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    try {
      const url = await uploadImage(file, "places");
      const saved = await updatePlace(form.id, {
        image_url: url,
      });
      setForm((prev) => ({ ...prev, image_url: saved.image_url || url }));
      onSave({
        ...form,
        image_url: saved.image_url || url,
      });
    } catch (error: any) {
      console.error("Failed to upload and persist image", error);
      alert("Gagal menyimpan gambar tempat.");
      setPreviewUrl(form.image_url ?? null);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await updatePlace(form.id, {
        name: form.name,
        category: form.category || undefined,
        address: form.address || undefined,
        lat: form.lat ?? undefined,
        lng: form.lng ?? undefined,
        hours: form.hours || undefined,
        price_range: form.price_range || undefined,
        description: form.description || undefined,
        image_url: form.image_url || undefined,
      });
      onSave(saved);
      onClose();
    } catch (e) {
      alert("Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  const fields: { key: keyof PlaceRecord; label: string; type?: string }[] = [
    { key: "name", label: "Nama" },
    { key: "category", label: "Kategori" },
    { key: "address", label: "Alamat" },
    { key: "hours", label: "Jam Operasional" },
    { key: "price_range", label: "Budget ($, $$, $$$)" },
    { key: "description", label: "Deskripsi" },
    { key: "lat", label: "Latitude", type: "number" },
    { key: "lng", label: "Longitude", type: "number" },
  ];

  return (
    <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#111] border border-white/10 rounded-2xl p-8 w-full max-w-xl my-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-white">Edit Place</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Image Upload */}
        <div className="mb-6">
          <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2 block">
            Foto Utama
          </label>
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            className="relative w-full h-44 rounded-xl overflow-hidden border-2 border-dashed border-white/10 hover:border-white/30 transition-colors cursor-pointer group"
          >
            {previewUrl ? (
              <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined text-4xl text-white/20">add_photo_alternate</span>
                <p className="text-xs text-white/30">Klik untuk upload foto</p>
              </div>
            )}

            {/* Upload overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <p className="text-xs text-white/60">Mengupload ke Supabase Storage...</p>
              </div>
            )}

            {/* Hover change overlay */}
            {!uploading && previewUrl && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-white text-2xl">photo_camera</span>
                <span className="text-white text-sm font-bold">Ganti Foto</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          {form.image_url && (
            <p className="text-[10px] text-white/20 mt-1 truncate">URL: {form.image_url}</p>
          )}
        </div>

        {/* Text Fields */}
        <div className="space-y-4">
          {fields.map(({ key, label, type }) => (
            <div key={key}>
              <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1 block">
                {label}
              </label>
              {key === "description" ? (
                <textarea
                  value={String(form[key] || "")}
                  onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm resize-none h-24 outline-none focus:border-white/30"
                />
              ) : (
                <input
                  type={type || "text"}
                  value={String(form[key] ?? "")}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      [key]: type === "number" ? parseFloat(e.target.value) : e.target.value,
                    }))
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-white/30"
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-bold"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="flex-1 py-3 rounded-xl bg-white text-black text-sm font-black disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}


function AdminOverview({ places, reviews }: { places: PlaceRecord[]; reviews: ReviewRecord[] }) {
  const withPhoto = reviews.filter((r) => (r.photo_urls?.length ?? 0) > 0).length;
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-mono text-white/30 uppercase tracking-widest mb-4">Overview</p>
        <h2 className="text-4xl font-black text-white mb-8">Dashboard Stats</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Places" value={places.length} icon="store" />
          <StatCard label="Total Reviews" value={reviews.length} icon="star" />
          <StatCard label="With Photos" value={withPhoto} icon="photo_camera" />
          <StatCard label="Avg Rating" value={avgRating} icon="insights" />
        </div>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <p className="text-xs font-mono text-white/30 uppercase tracking-widest mb-4">Terbaru</p>
        <div className="space-y-3">
          {reviews.slice(0, 8).map((r) => (
            <div key={String(r.id)} className="flex items-center justify-between gap-4 border-b border-white/5 pb-3">
              <div className="min-w-0">
                <p className="text-white font-bold truncate">{r.place_name || "—"}</p>
                <p className="text-white/40 text-xs truncate">{r.username || "anon"}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="material-symbols-outlined text-yellow-400 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="text-white text-sm font-bold">{r.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminPlaces({
  places,
  onUpdate,
}: {
  places: PlaceRecord[];
  onUpdate: (updated: PlaceRecord) => void;
  onDelete: (id: string) => void;
}) {
  const [editTarget, setEditTarget] = useState<PlaceRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PlaceRecord | null>(null);
  const [search, setSearch] = useState("");

  const filtered = places.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePlace(deleteTarget.id);
      onUpdate({ ...deleteTarget, name: "___DELETED___" });
    } catch (e) {
      alert("Gagal menghapus tempat.");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-mono text-white/30 uppercase tracking-widest mb-1">Manage</p>
          <h2 className="text-4xl font-black text-white">Places</h2>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama tempat..."
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none w-64 focus:border-white/30"
        />
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-4 text-white/40 font-mono text-xs uppercase tracking-widest">Foto</th>
              <th className="text-left p-4 text-white/40 font-mono text-xs uppercase tracking-widest">Nama</th>
              <th className="text-left p-4 text-white/40 font-mono text-xs uppercase tracking-widest">Kategori</th>
              <th className="text-left p-4 text-white/40 font-mono text-xs uppercase tracking-widest hidden md:table-cell">Budget</th>
              <th className="text-left p-4 text-white/40 font-mono text-xs uppercase tracking-widest hidden lg:table-cell">Rating</th>
              <th className="text-right p-4 text-white/40 font-mono text-xs uppercase tracking-widest">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((place) => (
              <tr key={place.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
                    {place.image_url ? (
                      <img src={place.image_url} alt={place.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-white/20">image</span>
                    )}
                  </div>
                </td>
                <td className="p-4 text-white font-semibold">{place.name}</td>
                <td className="p-4 text-white/50 capitalize">{place.category || "—"}</td>
                <td className="p-4 text-white/50 hidden md:table-cell">{place.price_range || "—"}</td>
                <td className="p-4 text-white/50 hidden lg:table-cell">{place.avg_rating?.toFixed(1) || "—"}</td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditTarget(place)}
                      className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(place)}
                      className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-colors"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-white/30">Tidak ada hasil ditemukan.</div>
        )}
      </div>
      <AnimatePresence>
        {editTarget && (
          <EditModal
            place={editTarget}
            onClose={() => setEditTarget(null)}
            onSave={(updated) => {
              onUpdate(updated);
              setEditTarget(null);
            }}
          />
        )}
        {deleteTarget && (
          <ConfirmDialog
            message={`Kamu akan menghapus "${deleteTarget.name}" secara permanen.`}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AdminReviews({
  reviews,
  onDelete,
}: {
  reviews: ReviewRecord[];
  onDelete: (id: string) => void;
}) {
  const [deleteTarget, setDeleteTarget] = useState<ReviewRecord | null>(null);
  const [search, setSearch] = useState("");

  const filtered = reviews.filter(
    (r) =>
      (r.place_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.username || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteReview(String(deleteTarget.id));
      onDelete(String(deleteTarget.id));
    } catch (e) {
      alert("Gagal menghapus review.");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-mono text-white/30 uppercase tracking-widest mb-1">Manage</p>
          <h2 className="text-4xl font-black text-white">Reviews</h2>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari tempat atau user..."
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none w-64 focus:border-white/30"
        />
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-4 text-white/40 font-mono text-xs uppercase tracking-widest">Tempat</th>
              <th className="text-left p-4 text-white/40 font-mono text-xs uppercase tracking-widest">User</th>
              <th className="text-left p-4 text-white/40 font-mono text-xs uppercase tracking-widest hidden md:table-cell">Rating</th>
              <th className="text-left p-4 text-white/40 font-mono text-xs uppercase tracking-widest hidden lg:table-cell">Komentar</th>
              <th className="text-right p-4 text-white/40 font-mono text-xs uppercase tracking-widest">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((review) => (
              <tr key={String(review.id)} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 text-white font-semibold">{review.place_name || "—"}</td>
                <td className="p-4 text-white/50">@{review.username || "anon"}</td>
                <td className="p-4 text-white/50 hidden md:table-cell">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-yellow-400 text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    {review.rating}
                  </span>
                </td>
                <td className="p-4 text-white/40 hidden lg:table-cell max-w-xs">
                  <span className="line-clamp-1">{review.comment || "—"}</span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => setDeleteTarget(review)}
                    className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-colors"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-white/30">Tidak ada hasil ditemukan.</div>
        )}
      </div>
      <AnimatePresence>
        {deleteTarget && (
          <ConfirmDialog
            message={`Hapus review dari @${deleteTarget.username || "anon"} untuk "${deleteTarget.place_name}"?`}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [places, setPlaces] = useState<PlaceRecord[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, r] = await Promise.all([listAllPlaces(), listAllReviews()]);
        setPlaces(p);
        setReviews(r);
      } catch (e) {
        console.error("Admin load error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const navItems: { id: AdminTab; icon: string; label: string }[] = [
    { id: "overview", icon: "dashboard", label: "Overview" },
    { id: "places", icon: "store", label: "Places" },
    { id: "reviews", icon: "star", label: "Reviews" },
  ];

  return (
    <div className="min-h-screen bg-[#080808] text-white flex">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-white/10 flex flex-col p-6 sticky top-0 h-screen">
        <div className="mb-10">
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">Tegal Eats</p>
          <h1 className="text-xl font-black">Admin Panel</h1>
        </div>
        <nav className="space-y-1 flex-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${tab === item.id
                ? "bg-white text-black"
                : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
            >
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: tab === item.id ? "'FILL' 1" : "" }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-white/10 pt-6 space-y-2">
          <button
            onClick={() => navigate("/home")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Kembali ke App
          </button>
          <button
            onClick={() => supabase.auth.signOut().then(() => navigate("/login"))}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-10 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-white/30 font-mono animate-pulse">Memuat data...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {tab === "overview" && <AdminOverview places={places} reviews={reviews} />}
              {tab === "places" && (
                <AdminPlaces
                  places={places.filter((p) => p.name !== "___DELETED___")}
                  onUpdate={(updated) => {
                    if (updated.name === "___DELETED___") {
                      setPlaces((prev) => prev.filter((p) => p.id !== updated.id));
                    } else {
                      setPlaces((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
                    }
                  }}
                  onDelete={(id) => setPlaces((prev) => prev.filter((p) => p.id !== id))}
                />
              )}
              {tab === "reviews" && (
                <AdminReviews
                  reviews={reviews}
                  onDelete={(id) => setReviews((prev) => prev.filter((r) => String(r.id) !== id))}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
