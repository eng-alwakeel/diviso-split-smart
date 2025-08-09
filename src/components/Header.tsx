import { Button } from "@/components/ui/button";
import { Menu, User, Bell } from "lucide-react";
const appLogo = "/lovable-uploads/e7669fe3-f50f-4cdc-95ba-1e72e597c9c2.png";

export const Header = () => {
  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src={appLogo} alt="شعار Diviso" className="h-8 w-auto" width={128} height={32} />
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Diviso
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              المزايا
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              الباقات
            </a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
              حول التطبيق
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="hidden md:flex">
              تسجيل الدخول
            </Button>
            <Button 
              variant="hero" 
              size="sm"
              onClick={() => window.location.href = '/dashboard'}
            >
              الدخول للتطبيق
            </Button>
            
            {/* Mobile menu button */}
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};