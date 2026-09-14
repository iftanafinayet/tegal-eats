import { Sidebar } from "./Sidebar";

export function DesktopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="lg:flex min-h-screen bg-background selection:bg-primary/20 selection:text-primary">
      <Sidebar />
      <main id="main-content" className="flex-1 lg:ml-[280px] w-full overflow-x-hidden pb-28 md:pb-0">
        {children}
      </main>
    </div>
  );
}
