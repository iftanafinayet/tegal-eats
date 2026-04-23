import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { uploadImage } from "../../utils/uploadImage";
import { createReview, fetchPlaceNameById } from "../api/places";

export function AddReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [placeName, setPlaceName] = useState("Memuat...");

  useEffect(() => {
    if (!id) return;
    const fetchPlace = async () => {
      try {
        setPlaceName(await fetchPlaceNameById(id));
      } catch (e) {
        setPlaceName("Tempat Ini");
      }
    };
    fetchPlace();
  }, [id]);

  const handlePhotoUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && photos.length < 3) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotos((prev) => [...prev, { file, preview: reader.result as string }]);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!id || !user) return;
    setLoading(true);

    try {
      const uploadedUrls: string[] = [];
      for (const photo of photos) {
        try {
          const url = await uploadImage(photo.file, "reviews");
          uploadedUrls.push(url);
        } catch (uploadErr: any) {
          console.error("Photo upload failed:", uploadErr);
          alert("Gagal upload foto: " + uploadErr.message);
          setLoading(false);
          return;
        }
      }

      await createReview({
        placeId: id,
        userId: user.id,
        rating,
        comment: review,
        photoUrls: uploadedUrls,
        placeName,
        userName: user.user_metadata?.full_name || user.email?.split("@")[0] || "anon",
        avatarUrl: user.user_metadata?.avatar_url || null,
      });
    } catch (e) {
      console.error("Unexpected error while inserting review", e);
      alert("Terjadi kesalahan saat menyimpan review.");
      setLoading(false);
      return;
    }

    setLoading(false);
    navigate(`/detail/${id}`);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-body overflow-x-hidden">
      {/* Header Section */}
      <header className="pt-20 pb-12 px-8 lg:px-12 max-w-[1400px] mx-auto relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 rounded-full blur-[120px] -rotate-12 translate-x-1/2" />
        
        <div className="relative z-10">
          <button 
            onClick={() => navigate(-1)}
            className="bg-surface-bright/85 backdrop-blur-md p-3 rounded-full text-on-surface border border-outline-variant/10 mb-8"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          
          <span className="font-headline font-black text-primary italic tracking-widest uppercase text-xs mb-4 block underline decoration-primary/30 underline-offset-8">Contribution Flow</span>
          <h1 className="text-5xl md:text-7xl font-headline font-extrabold tracking-tighter leading-[0.88] mb-5 text-on-surface max-w-4xl">
            Reviewing {placeName},
            <br />
            <span className="text-primary italic">with your signal.</span>
          </h1>
          <p className="text-on-surface-variant text-lg max-w-2xl">Kasih sinyal yang jujur. Input kamu ngebantu orang lain mutusin apakah tempat ini beneran layak didatangi atau cuma hyped doang.</p>
        </div>
      </header>

      <main className="px-8 lg:px-12 max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 pb-32">
        <div className="lg:col-span-7 space-y-8">
          {/* Rating Section */}
          <section className="bg-surface-container-lowest rounded-[2rem] p-8 border border-outline-variant/10">
            <p className="text-[10px] font-headline font-black uppercase tracking-[0.25em] text-primary mb-3">Sinyal Rating</p>
            <h2 className="text-3xl font-headline font-black mb-8">Gimana skor akhirnya?</h2>
            
            <div className="flex flex-wrap justify-between items-center gap-6">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-all duration-300 transform active:scale-90"
                  >
                    <span 
                      className={`material-symbols-outlined text-5xl ${
                        star <= (hoverRating || rating) ? "text-secondary" : "text-outline-variant/20"
                      }`}
                      style={{ fontVariationSettings: star <= (hoverRating || rating) ? "'FILL' 1" : "" }}
                    >
                      star
                    </span>
                  </button>
                ))}
              </div>
              
              <div className="bg-primary/5 px-6 py-3 rounded-2xl border border-primary/10 min-w-[180px] text-center">
                <p className="font-headline font-black text-primary uppercase tracking-[0.1em] text-lg">
                  {rating === 0 ? "Pilih Rating" : 
                   rating === 5 ? "Sempurna" :
                   rating === 4 ? "Bagus Banget" :
                   rating === 3 ? "Lumayan" :
                   rating === 2 ? "Kurang" : "Mengecewakan"}
                </p>
              </div>
            </div>
          </section>

          {/* Review Text Section */}
          <section className="bg-surface-container-lowest rounded-[2rem] p-8 border border-outline-variant/10">
            <p className="text-[10px] font-headline font-black uppercase tracking-[0.25em] text-primary mb-3">Context Detail</p>
            <h2 className="text-3xl font-headline font-black mb-6">Ceritain lebih detail</h2>
            <div className="relative">
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Makanannya gimana? Pelayanannya? Worth it sama harganya nggak? Semakin detail, semakin ngebantu komunitas."
                className="w-full h-48 bg-surface-container-low border border-outline-variant/10 rounded-2xl p-6 text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:border-primary/30 transition-colors resize-none font-body text-lg leading-relaxed"
              />
              <div className="absolute bottom-4 right-6 text-[10px] font-headline font-black uppercase tracking-widest text-on-surface-variant opacity-40">
                {review.length} Characters
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-5 space-y-8">
          {/* Photo Upload Section */}
          <section className="bg-surface-container-lowest rounded-[2rem] p-8 border border-outline-variant/10">
            <p className="text-[10px] font-headline font-black uppercase tracking-[0.25em] text-primary mb-3">Evidence</p>
            <h2 className="text-3xl font-headline font-black mb-6">Tambah foto</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-2xl overflow-hidden group">
                  <img src={photo.preview} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-3 right-3 bg-error text-on-error p-2 rounded-full shadow-xl transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ))}

              {photos.length < 3 && (
                <button
                  onClick={handlePhotoUpload}
                  className="aspect-square rounded-2xl border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 group-hover:text-primary transition-colors">add_a_photo</span>
                  <span className="text-[10px] font-headline font-black uppercase tracking-[0.2em] text-on-surface-variant/40 group-hover:text-primary transition-colors">Upload (Max 3)</span>
                </button>
              )}
            </div>
          </section>

          {/* Action Section */}
          <section className="bg-surface-container-lowest rounded-[2rem] p-8 border border-outline-variant/10">
            <p className="text-[10px] font-headline font-black uppercase tracking-[0.25em] text-primary mb-3">Action</p>
            <div className="space-y-4">
              <button
                onClick={handleSubmit}
                disabled={rating === 0 || review.trim().length === 0 || loading}
                className={`w-full py-5 rounded-2xl font-headline font-black uppercase tracking-[0.2em] text-sm transition-all shadow-xl active:scale-95 ${
                  rating > 0 && review.trim().length > 0 && !loading
                    ? "bg-primary text-on-primary shadow-primary/20 hover:shadow-primary/40"
                    : "bg-surface-container-high text-on-surface-variant/30 cursor-not-allowed shadow-none"
                }`}
              >
                {loading ? "Transmitting..." : "Post Review Now"}
              </button>
              
              {(rating === 0 || review.trim().length === 0) && (
                <div className="flex items-center gap-3 px-4 py-3 bg-error/5 rounded-xl border border-error/10">
                  <span className="material-symbols-outlined text-error text-lg">info</span>
                  <p className="text-xs text-error font-medium">
                    {rating === 0 ? "Rating belum dipilih" : "Review masih kosong"}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
