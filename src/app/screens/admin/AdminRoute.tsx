import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { loading, roleLoading, isAdmin, user } = useAuth();

  // Wait for both auth AND role to be resolved before making a decision
  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-white/40 font-mono text-sm animate-pulse">Verifying access...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
