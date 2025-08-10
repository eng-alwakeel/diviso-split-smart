import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
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
            <Button variant="ghost" size="sm" aria-label="التنبيهات">
              <Bell className="w-4 h-4" />
            </Button>
          </div>

          {/* Center: Logo */}
          <div
            className="justify-self-center flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            <img src={appLogo} alt="شعار Diviso" className="h-8 w-auto" width={128} height={32} />
          </div>

          {/* Right: empty spacer to keep logo centered */}
          <div className="justify-self-end hidden lg:flex items-center gap-6">
            <nav className="flex items-center gap-6">
              <NavLink to="/dashboard" end className={({ isActive }) => isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground transition-colors"}>
                الرئيسية
              </NavLink>
              <NavLink to="/add-expense" className={({ isActive }) => isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground transition-colors"}>
                مصروف
              </NavLink>
              <NavLink to="/financial-plan" className={({ isActive }) => isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground transition-colors"}>
                الخطة
              </NavLink>
              <NavLink to="/referral-center" className={({ isActive }) => isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground transition-colors"}>
                الإحالة
              </NavLink>
              <NavLink to="/settings" className={({ isActive }) => isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground transition-colors"}>
                الإعدادات
              </NavLink>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};