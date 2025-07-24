import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import appIcon from "@/assets/app-icon.png";

interface AppHeaderProps {
  showNavigation?: boolean;
}

export const AppHeader = ({ showNavigation = true }: AppHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <img src={appIcon} alt="Diviso" className="w-8 h-8" />
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Diviso
            </h1>
          </div>

          {/* Navigation */}
          {showNavigation && (
            <nav className="hidden md:flex items-center gap-6">
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                لوحة التحكم
              </Button>
              <Button variant="ghost" onClick={() => navigate('/financial-plan')}>
                الخطة المالية
              </Button>
              <Button variant="ghost" onClick={() => navigate('/referral')}>
                مركز الإحالة
              </Button>
            </nav>
          )}

          {/* User Actions */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
              <Settings className="w-4 h-4" />
            </Button>
            <Avatar className="w-8 h-8 cursor-pointer" onClick={() => navigate('/settings')}>
              <AvatarFallback className="bg-gradient-primary text-white text-sm font-semibold">
                أ
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
};