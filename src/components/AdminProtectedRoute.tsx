import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminProtectedRouteProps {
  children: ReactNode;
}

export const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { data: authData, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!authData?.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};