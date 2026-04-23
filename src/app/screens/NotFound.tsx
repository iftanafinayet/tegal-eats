import { motion } from "motion/react";
import { Home, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-orange-400 via-orange-500 to-pink-500 flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-20 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-60 h-60 bg-pink-400/20 rounded-full blur-3xl" />

      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center relative z-10"
      >
        <div className="mb-6">
          <MapPin size={80} className="text-white/80 mx-auto mb-4" strokeWidth={1.5} />
          <h1 className="text-8xl font-bold text-white mb-4">404</h1>
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">Halaman Tidak Ditemukan</h2>
          <p className="text-white/90 mb-8 lg:text-lg">
            Oops! Sepertinya kamu tersesat. Tempat yang kamu cari tidak ada.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/home")}
          className="bg-white text-orange-600 px-8 py-4 rounded-xl font-bold shadow-2xl flex items-center gap-2 mx-auto"
        >
          <Home size={20} />
          Kembali ke Home
        </motion.button>
      </motion.div>
    </div>
  );
}
