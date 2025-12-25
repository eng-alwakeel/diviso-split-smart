import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

const appLogo = "/lovable-uploads/e7669fe3-f50f-4cdc-95ba-1e72e597c9c2.png";

export const Header = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { t } = useTranslation('landing');

  useEffect(() => {
    // Check auth state
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLoginClick = () => {
    if (isLoggedIn) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <header className="bg-gradient-dark backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="grid grid-cols-3 items-center">
          {/* Left: Actions */}
          <div className="justify-self-start flex items-center gap-2">
            <Button 
              variant="hero" 
              size="sm"
              onClick={handleLoginClick}
            >
              {isLoggedIn ? t('header.dashboard') : t('header.login')}
            </Button>
          </div>

          {/* Center: Logo */}
          <Link to="/" className="justify-self-center inline-flex flex-col items-center gap-1">
            <div className="flex items-center gap-3">
              <img src={appLogo} alt="شعار Diviso" className="h-8 w-auto" width={128} height={32} />
            </div>
            <span className="hidden md:block text-xs text-muted-foreground font-medium">
              {t('header.slogan')}
            </span>
          </Link>

          {/* Right: Navigation / Menu */}
          <div className="justify-self-end flex items-center gap-3">
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('header.howItWorks')}
              </Link>
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('header.features')}
              </a>
              <Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('header.faq')}
              </Link>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('header.pricing')}
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