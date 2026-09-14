import { useNavigate, useLocation } from "../navigation";
import { motion } from "motion/react";

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: "home", label: "Explore", path: "/home" },
    { icon: "map", label: "Map", path: "/map" },
    { icon: "bookmark", label: "Favorites", path: "/favorit" },
    { icon: "person", label: "Identity", path: "/profile" },
  ];

  return (
    <aside
      className="hidden lg:flex flex-col w-[264px] h-[calc(100vh-32px)] bg-surface-bright fixed left-4 top-4 z-50 py-8 px-6 rounded-[26px] border border-white/70 shadow-clay"
    >
      {/* Brand */}
      <div 
        className="mb-12 cursor-pointer group rounded-2xl px-3 py-2 focus-within:outline-none"
        onClick={() => navigate("/home")}
      >
        <h1 className="font-headline font-black text-3xl tracking-tighter text-on-surface">
          Tegal<span className="text-primary italic">Eats.</span>
        </h1>
        <p className="font-headline font-bold text-[10px] uppercase tracking-widest text-on-surface-variant mt-1 group-hover:text-primary transition-colors">
          Digital Concierge
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-3" aria-label="Navigasi utama">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <motion.button
              key={item.path}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(item.path)}
              aria-current={isActive ? "page" : undefined}
              className={`w-full flex items-center gap-4 p-3 rounded-2xl group outline-none transition-colors duration-200 ${isActive ? "text-primary" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                isActive 
                  ? "bg-primary text-on-primary shadow-[inset_2px_2px_5px_rgba(0,0,0,.35),inset_-2px_-2px_5px_rgba(255,255,255,.16)]"
                  : "bg-surface-bright text-on-surface-variant shadow-clay-sm group-hover:text-primary"
              }`}>
                <span 
                  className="material-symbols-outlined text-[21px] transition-colors duration-200"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
              </div>
              <span className={`font-headline uppercase tracking-[0.16em] text-[11px] transition-colors ${
                isActive ? "font-black text-on-surface" : "font-bold text-on-surface-variant group-hover:text-on-surface"
              }`}>
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-8">
        <div className="w-full h-px bg-outline-variant/20 shadow-[0_1px_0_rgba(255,255,255,.55)] mb-6"></div>
        <p className="font-headline font-bold text-[10px] uppercase tracking-widest text-on-surface-variant/40">
          © 2026 TegalEats <br/>
          Curated Discovery
        </p>
      </div>
    </aside>
  );
}
