import { Star, Check, Flame } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFoundingProgram } from "@/hooks/useFoundingProgram";
import { Link } from "react-router-dom";

export const FoundingProgramBanner = () => {
  const { t } = useTranslation('auth');
  const { remaining, limit, isClosed, isLoading } = useFoundingProgram();
  
  // Don't show if program is closed
  if (isClosed) {
    return null;
  }
  
  return (
    <div className="bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-orange-500/10 border border-amber-400/30 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
        <span className="font-semibold text-sm">{t('founding_program.title')}</span>
      </div>
      
      <ul className="space-y-2 text-sm text-muted-foreground mb-3">
        <li className="flex items-center gap-2">
          <Check className="h-4 w-4 text-amber-500 shrink-0" />
          <span>{t('founding_program.welcome_points')}</span>
        </li>
        <li className="flex items-center gap-2">
          <Check className="h-4 w-4 text-amber-500 shrink-0" />
          <span>{t('founding_program.monthly_points')}</span>
        </li>
        <li className="flex items-center gap-2">
          <Check className="h-4 w-4 text-amber-500 shrink-0" />
          <span>{t('founding_program.badge')}</span>
        </li>
        <li className="flex items-center gap-2">
          <Check className="h-4 w-4 text-amber-500 shrink-0" />
          <span>{t('founding_program.user_number')}</span>
        </li>
      </ul>
      
      {/* Remaining Counter */}
      <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
        <Flame className="h-4 w-4" />
        {isLoading ? (
          <span className="animate-pulse">...</span>
        ) : (
          <span>{t('founding_program.remaining', { remaining, limit })}</span>
        )}
      </div>
      
      {/* Terms Link */}
      <p className="text-[10px] text-muted-foreground mt-2">
        <Link to="/terms" className="underline hover:text-foreground">
          {t('founding_program.terms_apply')}
        </Link>
      </p>
    </div>
  );
};
