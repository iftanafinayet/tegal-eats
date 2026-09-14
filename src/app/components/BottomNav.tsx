import { useNavigate, useLocation } from "../navigation";

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: "explore", label: "Home", path: "/home" },
    { icon: "map", label: "Peta", path: "/map" },
    { icon: "favorite", label: "Favorit", path: "/favorit" },
    { icon: "person", label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-4 left-4 right-4 min-h-[76px] bg-surface-bright/95 backdrop-blur-xl shadow-clay-floating flex justify-around items-center px-2 pb-[env(safe-area-inset-bottom)] z-50 rounded-[26px] border border-white/70 md:hidden" aria-label="Navigasi utama">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            aria-current={isActive ? "page" : undefined}
            className={`min-w-[64px] min-h-[58px] flex flex-col items-center justify-center px-3 py-2 rounded-2xl transition-[color,box-shadow,background-color,transform] duration-200 ${
              isActive
                ? "bg-primary text-on-primary shadow-clay-button"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "" }}>
              {item.label === 'Home' ? 'explore' : item.label === 'Peta' ? 'map' : item.label === 'Favorit' ? 'favorite' : 'person'}
            </span>
            <span className="font-headline text-[9px] font-black uppercase tracking-[0.13em] mt-1">
              {item.label === 'Peta' ? 'Map' : item.label === 'Favorit' ? 'Saved' : item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
