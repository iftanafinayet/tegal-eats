import { motion } from "motion/react";
import { Home, MapPin } from "lucide-react";
import { useNavigate } from "../navigation";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-background text-on-surface flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-20 right-10 w-40 h-40 bg-white/60 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-60 h-60 bg-outline-variant/20 rounded-full blur-3xl" />

      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.6 }}
        className="clay-card text-center relative z-10 rounded-[32px] bg-surface-bright px-8 py-10 md:px-14"
      >
        <div className="mb-6">
          <MapPin size={80} className="text-on-surface-variant mx-auto mb-4" strokeWidth={1.5} />
          <h1 className="text-8xl font-bold text-on-surface mb-4">404</h1>
          <h2 className="text-2xl lg:text-3xl font-bold text-on-surface mb-2">Halaman ini tidak ketemu.</h2>
          <p className="text-on-surface-variant mb-8 lg:text-lg">
            Mungkin link-nya salah atau tempatnya sudah dihapus. Balik ke tempat yang jelas enak saja.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/home")}
          className="bg-primary text-on-primary px-8 py-4 rounded-2xl font-bold flex items-center gap-2 mx-auto"
        >
          <Home size={20} />
          Kembali ke home
        </motion.button>
      </motion.div>
    </div>
  );
}
