import { Button } from "@/components/ui/button";
import { NavLink, useNavigate } from "react-router-dom";
import { NotificationBell } from "@/components/NotificationBell";
const appLogo = "/lovable-uploads/e7669fe3-f50f-4cdc-95ba-1e72e597c9c2.png";

interface AppHeaderProps {
  showNavigation?: boolean;
}

export const AppHeader = ({ showNavigation = true }: AppHeaderProps) => {
  const navigate = useNavigate();

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

          {/* Right: empty spacer to keep logo centered */}
          <div className="justify-self-end">
          </div>
        </div>
      </div>
    </header>
  );
};