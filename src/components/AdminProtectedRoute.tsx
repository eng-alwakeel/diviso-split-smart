import { ReactNode, Suspense, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Lock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminErrorBoundary } from "./admin/AdminErrorBoundary";

// Add noindex meta tag to prevent search engines from indexing admin pages
const useNoIndex = () => {
  useEffect(() => {
    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.name = 'robots';
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.content = 'noindex, nofollow';
    
    return () => {
      robotsMeta?.remove();
    };
  }, []);
};

interface AdminProtectedRouteProps {
  children: ReactNode;
}

export const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { data: authData, isLoading, refetch } = useAdminAuth();
  
  // Prevent search engines from indexing admin routes
  useNoIndex();

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
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            {authData?.error ? (
              <>
                <div className="flex justify-center">
                  {authData.user ? (
                    <Lock className="h-12 w-12 text-orange-500" />
                  ) : (
                    <AlertTriangle className="h-12 w-12 text-red-500" />
                  )}
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  {authData.user ? "غير مخول" : "يجب تسجيل الدخول"}
                </h2>
                <p className="text-muted-foreground">
                  {authData.error}
                </p>
                <div className="flex gap-2 justify-center">
                  <Button 
                    variant="outline" 
                    onClick={() => refetch()}
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    إعادة المحاولة
                  </Button>
                  {!authData.user && (
                    <Button 
                      onClick={() => window.location.href = "/auth"}
                      size="sm"
                    >
                      تسجيل الدخول
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-center">
                  <Lock className="h-12 w-12 text-orange-500" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  غير مخول
                </h2>
                <p className="text-muted-foreground">
                  ليس لديك صلاحيات للوصول إلى هذه الصفحة
                </p>
                <Button 
                  onClick={() => window.location.href = "/dashboard"}
                  size="sm"
                >
                  العودة للرئيسية
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AdminErrorBoundary>
      <Suspense 
        fallback={
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
        }
      >
        {children}
      </Suspense>
    </AdminErrorBoundary>
  );
};