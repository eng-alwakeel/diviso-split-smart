import { Button } from "@/components/ui/button";
import { Menu, User, Bell } from "lucide-react";
import appIcon from "@/assets/app-icon.png";

export const Header = () => {
  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src={appIcon} alt="Diviso" className="w-8 h-8" />
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
            <Button variant="hero" size="sm">
              ابدأ مجاناً
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