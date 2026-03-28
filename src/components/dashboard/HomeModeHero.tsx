import { memo } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { HelpCircle, Users, Map, ArrowRight, FileText, UserPlus, Eye, Plus, RotateCcw, Activity } from "lucide-react";
import type { HomeModeUIConfig } from "@/services/homeModeEngine/uiModeConfig";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Users, Map, ArrowRight, FileText, UserPlus, Eye, Plus, RotateCcw, Activity,
};

interface HomeModeHeroProps {
  config: HomeModeUIConfig;
  onShowGuide: () => void;
  isCreatorActive: boolean;
}

export const HomeModeHero = memo(({ config, onShowGuide, isCreatorActive }: HomeModeHeroProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');

  const PrimaryIcon = ICON_MAP[config.primaryCTA.icon];
  const SecondaryIcon = config.secondaryCTA ? ICON_MAP[config.secondaryCTA.icon] : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {t(config.heroTitle)}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t(config.heroSubtitle)}
          </p>
        </div>
        {isCreatorActive && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onShowGuide}
            className="text-muted-foreground hover:text-foreground"
          >
            <HelpCircle className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
            {t('help')}
          </Button>
        )}
      </div>

      {/* Show CTAs for non-creator modes */}
      {!isCreatorActive && (
        <div className="flex gap-3">
          <Button
            onClick={() => navigate(config.primaryCTA.route)}
            className="flex-1"
          >
            {PrimaryIcon && <PrimaryIcon className="w-4 h-4 ltr:mr-2 rtl:ml-2" />}
            {t(config.primaryCTA.label)}
          </Button>
          {config.secondaryCTA && SecondaryIcon && (
            <Button
              variant="outline"
              onClick={() => navigate(config.secondaryCTA!.route)}
              className="flex-1"
            >
              <SecondaryIcon className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
              {t(config.secondaryCTA.label)}
            </Button>
          )}
        </div>
      )}
    </div>
  );
});

HomeModeHero.displayName = 'HomeModeHero';
