import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";

export const SocialProofText = () => {
  const { t } = useTranslation('auth');
  
  return (
    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4 py-3 border-t border-border">
      <Users className="h-4 w-4" />
      <span>{t('social_proof.text')}</span>
    </div>
  );
};
