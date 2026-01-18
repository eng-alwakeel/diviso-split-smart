import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";

const appLogo = "/lovable-uploads/e7669fe3-f50f-4cdc-95ba-1e72e597c9c2.png";

export const Header = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { t, i18n } = useTranslation('landing');
  const isRTL = i18n.language === 'ar';

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
            <LanguageSwitcher />
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
              <img 
                src={appLogo} 
                alt="شعار Diviso" 
                className="h-8 w-auto" 
                width={128} 
                height={32}
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
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
              <Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('header.blog')}
              </Link>
            </nav>
            {/* Mobile menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side={isRTL ? "left" : "right"} className="w-[280px] bg-background/95 backdrop-blur-lg">
                <div className="flex flex-col h-full py-6">
                  {/* Logo */}
                  <div className="flex items-center justify-between mb-8 px-2">
                    <img src={appLogo} alt="Diviso" className="h-8 w-auto" width={128} height={32} loading="lazy" />
                    <SheetClose asChild>
                      <Button variant="ghost" size="icon">
                        <X className="w-5 h-5" />
                      </Button>
                    </SheetClose>
                  </div>

                  {/* Navigation Links */}
                  <nav className="flex flex-col gap-2 flex-1">
                    <SheetClose asChild>
                      <Link 
                        to="/how-it-works" 
                        className="flex items-center px-4 py-3 rounded-lg text-foreground hover:bg-muted transition-colors"
                      >
                        {t('header.howItWorks')}
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <a 
                        href="#features" 
                        className="flex items-center px-4 py-3 rounded-lg text-foreground hover:bg-muted transition-colors"
                      >
                        {t('header.features')}
                      </a>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link 
                        to="/faq" 
                        className="flex items-center px-4 py-3 rounded-lg text-foreground hover:bg-muted transition-colors"
                      >
                        {t('header.faq')}
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <a 
                        href="#pricing" 
                        className="flex items-center px-4 py-3 rounded-lg text-foreground hover:bg-muted transition-colors"
                      >
                        {t('header.pricing')}
                      </a>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link 
                        to="/blog" 
                        className="flex items-center px-4 py-3 rounded-lg text-foreground hover:bg-muted transition-colors"
                      >
                        {t('header.blog')}
                      </Link>
                    </SheetClose>
                  </nav>

                  {/* Bottom Actions */}
                  <div className="border-t border-border pt-4 space-y-3">
                    <LanguageSwitcher />
                    <SheetClose asChild>
                      <Button 
                        variant="default" 
                        className="w-full"
                        onClick={handleLoginClick}
                      >
                        {isLoggedIn ? t('header.dashboard') : t('header.login')}
                      </Button>
                    </SheetClose>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};