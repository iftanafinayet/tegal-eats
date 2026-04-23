import { Sidebar } from "./Sidebar";

export function DesktopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="lg:flex min-h-screen bg-background selection:bg-primary/20 selection:text-primary">
      <Sidebar />
      <main className="flex-1 lg:ml-72 w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
