import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function DarkModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-11 h-11 rounded-2xl bg-surface-bright flex items-center justify-center text-on-surface shadow-clay-sm transition-colors hover:text-primary active:shadow-clay-pressed"
      aria-label="Toggle dark mode"
    >
      {theme === "dark" ? (
        <Sun size={20} className="text-on-surface" />
      ) : (
        <Moon size={20} className="text-slate-700" />
      )}
    </button>
  );
}
