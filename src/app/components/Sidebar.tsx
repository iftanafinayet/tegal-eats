import { useNavigate, useLocation } from "react-router-dom";
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
    <motion.aside
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="hidden lg:flex flex-col w-72 min-h-screen bg-background fixed left-0 top-0 z-50 py-10 px-8"
    >
      {/* Brand */}
      <div 
        className="mb-16 cursor-pointer group"
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
      <nav className="flex-1 space-y-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <motion.button
              key={item.path}
              whileHover={{ x: 8 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-5 py-3 group outline-none"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                isActive 
                  ? "bg-primary text-on-primary shadow-lg shadow-primary/20 scale-110" 
                  : "bg-surface-container-low text-on-surface hover:bg-surface-container-high"
              }`}>
                <span 
                  className={`material-symbols-outlined text-[20px] transition-all duration-300 ${isActive ? 'rotate-12' : 'group-hover:rotate-12'}`}
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
              </div>
              <span className={`font-headline uppercase tracking-widest text-xs transition-all ${
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
        <div className="w-12 h-1 bg-outline-variant/20 rounded-full mb-6"></div>
        <p className="font-headline font-bold text-[10px] uppercase tracking-widest text-on-surface-variant/40">
          © 2026 TegalEats <br/>
          Curated Discovery
        </p>
      </div>
    </motion.aside>
  );
}
