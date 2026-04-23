import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
          <div className="absolute inset-x-0 top-0 h-[42vh] bg-gradient-to-br from-primary via-primary-container to-secondary-container" />
          <motion.div
            className="absolute -right-16 top-16 h-64 w-64 rounded-full bg-white/20 blur-3xl lg:h-96 lg:w-96"
            animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.45, 0.3] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute left-[-15%] top-[32vh] h-56 w-56 rounded-full bg-primary/12 blur-3xl lg:h-72 lg:w-72"
            animate={{ scale: [1, 1.14, 1], opacity: [0.2, 0.34, 0.2] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-16 right-[-12%] h-72 w-72 rounded-full bg-secondary-container/35 blur-3xl lg:h-[28rem] lg:w-[28rem]"
            animate={{ scale: [1, 1.12, 1], opacity: [0.2, 0.32, 0.2] }}
            transition={{ duration: 5.6, repeat: Infinity, ease: "easeInOut" }}
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
              Digital Concierge
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
              Curated Discovery for Tegal
            </p>
            <h1 className="font-headline text-5xl font-black leading-[0.9] tracking-[-0.05em] text-white lg:text-on-surface lg:text-7xl">
              TegalEats,
              <br />
              <span className="italic text-white/88 lg:text-primary">edited like a magazine.</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/80 lg:text-lg lg:text-on-surface-variant">
              Bukan sekadar daftar tempat. Ini splash yang membuka pengalaman discovery dengan ritme editorial, rasa hangat, dan fokus ke tempat yang pantas dikunjungi.
            </p>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.75 }}
            className="relative rounded-[2.5rem] bg-surface-container-lowest/92 p-6 backdrop-blur-2xl shadow-[0_20px_60px_rgba(47,47,46,0.08)] lg:p-8"
          >
            <div className="mb-8 flex items-start justify-between gap-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-[0_18px_48px_rgba(166,51,0,0.22)]">
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
                  Loading Your Next Stop
                </p>
                <h2 className="mt-3 font-headline text-3xl font-black leading-tight">
                  Menyusun shortlist
                  <br />
                  kuliner yang layak.
                </h2>
              </div>

              <div className="grid gap-3 text-sm text-on-surface-variant">
                <div className="rounded-[1.75rem] bg-surface-container-low px-4 py-4">
                  Favorit, review, dan social pulse dipersiapkan dulu.
                </div>
                <div className="rounded-[1.75rem] bg-surface-container-low px-4 py-4">
                  Begitu sesi siap, kamu langsung masuk ke discovery board.
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
