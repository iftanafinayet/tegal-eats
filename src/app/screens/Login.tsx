import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Mail, Lock, LogIn, ArrowLeft, Sparkles, Waves } from "lucide-react";
import { supabase } from "../../supabaseClient";
import { routes } from "../routes";

type LocationState = {
  from?: string;
};

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const redirectTo = useMemo(() => {
    const state = location.state as LocationState | null;
    if (!state?.from || state.from === routes.login || state.from === routes.splash) {
      return routes.home;
    }
    return state.from;
  }, [location.state]);

  useEffect(() => {
    setError(null);
    setSuccess(null);
  }, [isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isLogin) {
        const { data: signInData, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // Check role and redirect accordingly
        const userId = signInData.user?.id;
        if (userId) {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .maybeSingle();
          if (roleData?.role === "admin") {
            navigate(routes.admin, { replace: true });
            return;
          }
        }
        navigate(redirectTo, { replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        if (data.session) {
          navigate(routes.home, { replace: true });
          return;
        }

        setSuccess("Akun berhasil dibuat. Cek email untuk verifikasi dulu, lalu login.");
        setIsLogin(true);
        setPassword("");
      }
    } catch (e: any) {
      setError(e.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-surface text-on-surface">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1600px] flex-col lg:grid lg:grid-cols-[0.95fr_1.05fr]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10%] top-[-8%] h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-[-12%] right-[-6%] h-96 w-96 rounded-full bg-secondary-container/35 blur-3xl" />
        </div>

        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-container to-secondary-container px-6 pb-12 pt-10 text-on-primary lg:flex lg:min-h-screen lg:flex-col lg:justify-between lg:px-12 lg:py-10">
          <div className="absolute inset-0">
            <div className="absolute right-[-12%] top-10 h-72 w-72 rounded-full bg-white/18 blur-3xl" />
            <div className="absolute bottom-0 left-[-8%] h-80 w-80 rounded-full bg-secondary/20 blur-3xl" />
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <button
              onClick={() => navigate("/home")}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-surface/18 backdrop-blur-xl transition-transform hover:scale-[1.03]"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="inline-flex items-center gap-2 rounded-full bg-surface/18 px-4 py-2 backdrop-blur-xl">
              <Sparkles size={14} />
              <span className="font-headline text-[10px] font-black uppercase tracking-[0.24em]">
                Editorial Auth
              </span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="relative z-10 mt-16 lg:mt-0"
          >
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-surface text-primary shadow-[0_22px_48px_rgba(47,47,46,0.08)] lg:h-28 lg:w-28">
              <Waves size={42} strokeWidth={2.5} />
            </div>
            <p className="font-headline text-[10px] font-black uppercase tracking-[0.28em] text-white/72">
              Digital Concierge for Food Discovery
            </p>
            <h1 className="mt-4 max-w-xl font-headline text-5xl font-black leading-[0.92] tracking-[-0.05em] lg:text-7xl">
              {isLogin ? "Masuk ke flow discovery yang lebih rapi." : "Bikin akun untuk simpan taste dan momentum."}
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-white/78 lg:text-base">
              TegalEats dirancang seperti magazine board: warm, curated, dan cepat dibaca. Login memberi akses ke favorit, planner, review, dan konteks sosial yang lebih personal.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="relative z-10 mt-10 grid gap-3 lg:max-w-lg"
          >
          </motion.div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.65 }}
          className="relative flex items-center px-6 py-8 lg:px-12 lg:py-12"
        >
          <div className="w-full rounded-[2.5rem] bg-surface-container-low p-5 shadow-[0_18px_60px_rgba(47,47,46,0.06)] lg:rounded-[3rem] lg:p-8">
            <div className="mx-auto max-w-lg rounded-[2rem] bg-surface-container-lowest p-6 shadow-[0_16px_40px_rgba(47,47,46,0.05)] lg:p-8">
              <div className="mb-8">
                <p className="font-headline text-[10px] font-black uppercase tracking-[0.25em] text-primary">
                  {isLogin ? "Member Access" : "Create Account"}
                </p>
                <h2 className="mt-3 font-headline text-3xl font-black leading-tight lg:text-[2.6rem]">
                  {isLogin ? "Selamat datang kembali." : "Mulai dengan akun baru."}
                </h2>
                <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                  {isLogin
                    ? "Masuk untuk lanjut ke home, simpan favorit, dan kelola review atau trip plan kamu."
                    : "Daftar untuk menyimpan preferensi, history review, dan profil sosial kamu di TegalEats."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {success && (
                  <div className="rounded-[1.5rem] bg-primary/8 px-4 py-3 text-sm font-medium text-primary">
                    {success}
                  </div>
                )}

                {error && (
                  <div className="rounded-[1.5rem] bg-[rgba(179,27,37,0.08)] px-4 py-3 text-sm font-medium text-error">
                    {error}
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-on-surface">
                    Email
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <Mail size={20} className="text-on-surface-variant" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="halo@tegaleats.com"
                      className="w-full rounded-3xl bg-surface-container-high px-11 py-4 pr-4 text-on-surface outline-none ring-1 ring-transparent transition-all placeholder:text-on-surface-variant focus:bg-surface-container-lowest focus:ring-primary/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-on-surface">
                    Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <Lock size={20} className="text-on-surface-variant" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full rounded-3xl bg-surface-container-high px-11 py-4 pr-4 text-on-surface outline-none ring-1 ring-transparent transition-all placeholder:text-on-surface-variant focus:bg-surface-container-lowest focus:ring-primary/40"
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  disabled={loading}
                  type="submit"
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-[1.75rem] bg-gradient-to-r from-primary to-primary-container py-4 font-headline font-black text-on-primary shadow-[0_18px_48px_rgba(166,51,0,0.24)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    "Memproses..."
                  ) : (
                    <>
                      <LogIn size={20} />
                      {isLogin ? "Masuk" : "Daftar"}
                    </>
                  )}
                </motion.button>

                <div className="mt-3 rounded-[1.75rem] bg-surface-container-low px-4 py-4 text-sm text-on-surface-variant">
                  {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setPassword("");
                    }}
                    className="font-bold text-primary"
                    type="button"
                  >
                    {isLogin ? "Daftar sekarang" : "Masuk di sini"}
                  </button>
                </div>

                <button
                  onClick={() => navigate("/home")}
                  className="text-left text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
                  type="button"
                >
                  Lewati dulu, lihat discovery board →
                </button>
              </form>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
