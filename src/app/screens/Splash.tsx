import { useEffect } from "react";
import { useNavigate } from "../navigation";
import { motion } from "motion/react";
import { Sparkles, Waves } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { routes } from "../routes";

export function Splash() {
  const navigate = useNavigate();
  const { ready, session, defaultRoute } = useAuth();
  
  useEffect(() => {
    if (!ready) return;

    const timer = setTimeout(() => {
      navigate(session ? defaultRoute : routes.login, { replace: true });
    }, 2500);
    return () => clearTimeout(timer);
  }, [defaultRoute, navigate, ready, session]);

  return (
    <div className="min-h-screen overflow-hidden bg-surface text-on-surface">
      <div className="relative flex min-h-screen flex-col justify-between px-6 py-8 lg:px-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="promo-banner absolute inset-x-0 top-0 h-[42vh]" />
          <motion.div
            className="absolute -right-16 top-16 h-64 w-64 rounded-full bg-white/20 blur-3xl lg:h-96 lg:w-96"
            animate={{ y: [0, -6, 0], opacity: [0.3, 0.4, 0.3] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute left-[-15%] top-[32vh] h-56 w-56 rounded-full bg-white/15 blur-3xl lg:h-72 lg:w-72"
            animate={{ y: [0, 6, 0], opacity: [0.2, 0.3, 0.2] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-16 right-[-12%] h-72 w-72 rounded-full bg-accent-mango/25 blur-3xl lg:h-[28rem] lg:w-[28rem]"
            animate={{ y: [0, -5, 0], opacity: [0.2, 0.3, 0.2] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-surface/70 px-4 py-2 backdrop-blur-xl shadow-[0_8px_40px_rgba(47,47,46,0.06)]">
            <Sparkles size={14} className="text-primary" />
            <span className="font-headline text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant">
              Panduan makan Tegal
            </span>
          </div>
        </motion.div>

        <div className="relative z-10 mt-10 grid flex-1 items-end gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <motion.section
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.8 }}
            className="max-w-2xl"
          >
            <p className="mb-5 font-headline text-[10px] font-black uppercase tracking-[0.28em] text-white/72 lg:text-primary">
              Panduan makan Tegal
            </p>
            <h1 className="font-headline text-5xl font-black leading-[0.9] tracking-[-0.05em] text-white lg:text-on-surface lg:text-7xl">
              Mau makan enak di Tegal tanpa nebak-nebak.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/80 lg:text-lg lg:text-on-surface-variant">
              Tegal Eats nyimpen shortlist tempat yang sudah dibuktikan komunitas, lengkap dengan jam buka, budget, dan review jujur.
            </p>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.75 }}
            className="clay-card relative rounded-3xl bg-surface-container-lowest/92 p-6 backdrop-blur-2xl lg:p-8"
          >
            <div className="mb-8 flex items-start justify-between gap-6">
              <div className="clay-lilac flex h-20 w-20 items-center justify-center rounded-3xl border-[3px] text-primary">
                <Waves size={34} strokeWidth={2.4} />
              </div>
              <div className="flex gap-2 pt-2">
                {[0, 1, 2].map((dot) => (
                  <motion.span
                    key={dot}
                    className="h-2.5 w-2.5 rounded-full bg-primary"
                    animate={{ opacity: [0.25, 1, 0.25], scale: [1, 1.18, 1] }}
                    transition={{ duration: 1.1, repeat: Infinity, delay: dot * 0.18 }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <p className="font-headline text-[10px] font-black uppercase tracking-[0.24em] text-primary">
                  Menyiapkan tempat buat kamu
                </p>
                <h2 className="mt-3 font-headline text-3xl font-black leading-tight">
                  Menyusun shortlist yang layak dibuka malam ini.
                </h2>
              </div>

              <div className="grid gap-3 text-sm text-on-surface-variant">
                <div className="rounded-[1.75rem] bg-surface-container-low px-4 py-4">
                  Favorit, review, dan sinyal komunitas disiapkan dulu.
                </div>
                <div className="rounded-[1.75rem] bg-surface-container-low px-4 py-4">
                  Begitu siap, kamu langsung masuk ke tempat rekomendasi.
                </div>
              </div>
            </div>
          </motion.section>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="relative z-10 mt-8 flex items-center justify-between gap-4"
        >
          <p className="font-body text-xs uppercase tracking-[0.18em] text-on-surface-variant">
            Spot favorit tegal
          </p>
          <p className="font-body text-xs text-on-surface-variant">
            Hidden gems, coffee runs, dan makan malam yang tepat.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
