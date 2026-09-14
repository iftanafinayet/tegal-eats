import type { Metadata } from "next";
import "material-symbols/outlined.css";
import "../index.css";
import { ThemeProvider } from "./components/ThemeProvider";
import { AuthProvider } from "./contexts/AuthContext";

export const metadata: Metadata = { title: "Tegal Eats", description: "Discovery kuliner dan hangout di Tegal." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" suppressHydrationWarning><body><ThemeProvider><AuthProvider>{children}</AuthProvider></ThemeProvider></body></html>;
}
