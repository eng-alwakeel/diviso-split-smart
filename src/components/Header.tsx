import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
const appLogo = "/lovable-uploads/e7669fe3-f50f-4cdc-95ba-1e72e597c9c2.png";

export const Header = () => {
  return (
    <header className="bg-gradient-dark backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="grid grid-cols-3 items-center">
          {/* Left: Actions */}
          <div className="justify-self-start flex items-center gap-2">
            <Button 
              variant="hero" 
              size="sm"
              onClick={() => (window.location.href = '/dashboard')}
            >
              دخول
            </Button>
          </div>

          {/* Center: Logo */}
          <a href="/" className="justify-self-center inline-flex items-center gap-3">
            <img src={appLogo} alt="شعار Diviso" className="h-8 w-auto" width={128} height={32} />
            <span className="sr-only">Diviso</span>
          </a>

          {/* Right: Navigation / Menu */}
          <div className="justify-self-end flex items-center gap-3">
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                المزايا
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                الباقات
              </a>
            </nav>
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