import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export const LanguageSwitcher = () => {
  const { currentLanguage, changeLanguage, isChanging } = useLanguage();

  const toggleLanguage = () => {
    const newLang = currentLanguage === 'ar' ? 'en' : 'ar';
    changeLanguage(newLang);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      disabled={isChanging}
      className="h-9 w-9 text-muted-foreground hover:text-foreground sm:w-auto sm:px-3"
      title={currentLanguage === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
    >
      <Globe className="w-4 h-4" />
      <span className="hidden sm:inline text-sm font-medium ms-1.5">
        {currentLanguage === 'ar' ? 'EN' : 'عربي'}
      </span>
    </Button>
  );
};
