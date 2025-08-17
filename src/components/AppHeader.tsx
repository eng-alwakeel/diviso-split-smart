import { Button } from "@/components/ui/button";
import { NavLink, useNavigate } from "react-router-dom";
import { NotificationBell } from "@/components/NotificationBell";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Shield } from "lucide-react";
const appLogo = "/lovable-uploads/e7669fe3-f50f-4cdc-95ba-1e72e597c9c2.png";

interface AppHeaderProps {
  showNavigation?: boolean;
}

export const AppHeader = ({ showNavigation = true }: AppHeaderProps) => {
  const navigate = useNavigate();
  const { data: adminData, isLoading: adminLoading } = useAdminAuth();

  return (
    <header className="bg-[hsl(var(--header-background))] border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="grid grid-cols-3 items-center">
          {/* Left: Notifications */}
          <div className="justify-self-start">
            <NotificationBell />
          </div>

          {/* Center: Logo */}
          <div
            className="justify-self-center flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            <img src={appLogo} alt="شعار Diviso" className="h-8 w-auto" width={128} height={32} />
          </div>

          {/* Right: Admin Dashboard Link */}
          <div className="justify-self-end">
            {adminData?.isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin-dashboard')}
                className="text-primary hover:text-primary/80 hover:bg-primary/10 rounded-xl"
                title="لوحة التحكم الإدارية"
              >
                <Shield className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};