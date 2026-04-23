import { useNavigate, useLocation } from "react-router-dom";

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
    <nav className="fixed bottom-0 left-0 w-full h-24 bg-surface/70 backdrop-blur-2xl shadow-[0_-8px_40px_rgba(47,47,46,0.06)] flex justify-around items-center px-4 pb-safe z-50 rounded-t-[3rem] md:hidden">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center px-4 py-2 transition-all transition-transform hover:scale-105 ${
              isActive 
                ? "bg-primary-container/20 text-primary rounded-full px-6" 
                : "text-on-surface-variant opacity-60"
            }`}
          >
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "" }}>
              {item.label === 'Home' ? 'explore' : item.label === 'Peta' ? 'map' : item.label === 'Favorit' ? 'favorite' : 'person'}
            </span>
            <span className="font-headline text-[10px] font-bold uppercase tracking-widest mt-1">
              {item.label === 'Peta' ? 'Map' : item.label === 'Favorit' ? 'Saved' : item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
