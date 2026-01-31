import { Gift, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

export const SignupValueBanner = () => {
  const { t } = useTranslation('auth');
  
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Gift className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm">{t('signup_value.title')}</span>
      </div>
      <ul className="space-y-2 text-sm text-muted-foreground">
        <li className="flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
          <span>{t('signup_value.points')}</span>
        </li>
        <li className="flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
          <span>{t('signup_value.no_card')}</span>
        </li>
        <li className="flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
          <span>{t('signup_value.no_commitment')}</span>
        </li>
      </ul>
    </div>
  );
};
