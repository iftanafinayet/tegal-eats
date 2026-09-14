import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "../navigation";
import { motion } from "motion/react";
import { Mail, Lock, LogIn, ArrowLeft, Sparkles, Waves } from "lucide-react";
import { authClient } from "../../lib/auth-client";
import { routes } from "../routes";

type LocationState = {
  from?: string;
};

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const redirectTo = useMemo(() => {
    const from = searchParams.get("from") || (location.state as LocationState | null)?.from;
    if (!from || from === routes.login || from === routes.splash || !from.startsWith("/")) {
      return routes.home;
    }
    return from;
  }, [location.state, searchParams]);

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
        const { data: signInData, error } = await authClient.signIn.email({
          email,
          password,
        });
        if (error) throw error;

        // Check role and redirect accordingly
        const userId = signInData.user?.id;
        if (userId) {
          if ((signInData.user as typeof signInData.user & { role?: string }).role === "admin") {
            navigate(routes.admin, { replace: true });
            return;
          }
        }
        navigate(redirectTo, { replace: true });
      } else {
        const { data, error } = await authClient.signUp.email({
          email,
          password,
          name: email.split("@")[0],
        });
        if (error) throw error;

        if (data.user) {
          navigate(routes.home, { replace: true });
          return;
        }

        setSuccess("Akun berhasil dibuat. Silakan login.");
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
    <div className="min-h-screen overflow-hidden bg-background text-on-surface">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1600px] flex-col lg:grid lg:grid-cols-[0.95fr_1.05fr]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10%] top-[-8%] h-72 w-72 rounded-full bg-primary/18 blur-3xl" />
          <div className="absolute bottom-[-12%] right-[-6%] h-96 w-96 rounded-full bg-primary-container/30 blur-3xl" />
        </div>

        <section className="promo-banner relative m-4 overflow-hidden rounded-[32px] border border-white/60 px-6 pb-12 pt-10 text-white shadow-clay lg:flex lg:min-h-[calc(100vh-32px)] lg:flex-col lg:justify-between lg:px-12 lg:py-10">
          <div className="absolute inset-0">
            <div className="absolute right-[-12%] top-10 h-72 w-72 rounded-full bg-white/25 blur-3xl" />
            <div className="absolute bottom-0 left-[-8%] h-80 w-80 rounded-full bg-white/15 blur-3xl" />
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <button
              onClick={() => navigate("/home")}
              aria-label="Kembali ke home"
              className="flex min-w-[48px] min-h-[48px] items-center justify-center rounded-2xl border border-white/60 bg-white/90 text-on-surface shadow-clay-sm transition-all duration-200 hover:-translate-y-0.5"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/20 px-4 py-2 backdrop-blur-md">
              <Sparkles size={14} />
              <span className="font-headline text-[10px] font-semibold uppercase tracking-[0.24em]">
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
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[24px] border border-white/60 bg-white/90 text-primary shadow-clay lg:h-24 lg:w-24">
              <Waves size={40} strokeWidth={2} />
            </div>
            <p className="font-headline text-xs font-semibold uppercase tracking-[0.28em] text-white/85">
              Digital Concierge for Food Discovery
            </p>
            <h1 className="mt-4 max-w-xl font-headline text-[38px] font-bold leading-[1.12] tracking-tight lg:text-[56px]">
              {isLogin ? "Balik ke shortlist yang sudah kamu susun." : "Simpan selera sekali, rekomendasi langsung rapi."}
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-7 text-white/85 lg:text-base">
              Tegal Eats ingat favorit, review, dan plan kamu di semua perangkat.
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
          className="relative flex items-center px-5 py-8 lg:px-12 lg:py-12"
        >
          <div className="clay-card w-full rounded-[32px] bg-surface p-5 lg:p-8">
            <div className="mx-auto max-w-lg rounded-3xl bg-surface-container-lowest p-6 shadow-clay lg:p-8">
              <div className="mb-8">
                <p className="font-headline text-[10px] font-black uppercase tracking-[0.25em] text-primary">
                  {isLogin ? "Masuk" : "Daftar"}
                </p>
                <h2 className="mt-3 font-headline text-3xl font-black leading-tight lg:text-[2.6rem]">
                  {isLogin ? "Selamat datang kembali." : "Bikin akun dalam semenit."}
                </h2>
                <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                  {isLogin
                    ? "Masuk buat lanjut ke home, simpan tempat, dan atur plan jalan."
                    : "Daftar buat simpan selera, history review, dan profil komunitas kamu."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {success && (
                  <div className="rounded-[1.5rem] border border-primary/10 bg-primary/8 px-4 py-3 text-sm font-medium text-primary">
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
                      className="w-full rounded-3xl border border-primary/10 bg-surface-container-high px-11 py-4 pr-4 text-on-surface outline-none ring-1 ring-transparent transition-all placeholder:text-on-surface-variant focus:border-primary/20 focus:bg-surface-container-lowest focus:ring-primary/40"
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
                      className="w-full rounded-3xl border border-primary/10 bg-surface-container-high px-11 py-4 pr-4 text-on-surface outline-none ring-1 ring-transparent transition-all placeholder:text-on-surface-variant focus:border-primary/20 focus:bg-surface-container-lowest focus:ring-primary/40"
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  disabled={loading}
                  type="submit"
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-[1.75rem] bg-primary py-4 font-headline font-black text-on-primary disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    "Memproses..."
                  ) : (
                    <>
                      <LogIn size={20} />
                      {isLogin ? "Masuk ke Tegal Eats" : "Buat akun saya"}
                    </>
                  )}
                </motion.button>

                <div className="mt-3 rounded-[1.75rem] border border-primary/10 bg-primary/5 px-4 py-4 text-sm text-on-surface-variant">
                  {isLogin ? "Belum punya akun. " : "Sudah punya akun. "}{" "}
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setPassword("");
                    }}
                    className="font-bold text-primary"
                    type="button"
                  >
                    {isLogin ? "Buat sekarang" : "Masuk di sini"}
                  </button>
                </div>

                <button
                  onClick={() => navigate("/home")}
                  className="text-left text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
                  type="button"
                >
                  Lewati dulu, lihat tempatnya →
                </button>
              </form>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
