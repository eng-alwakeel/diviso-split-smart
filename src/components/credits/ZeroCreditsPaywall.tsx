import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Zap, CreditCard, Gift, Users, Crown, Sparkles } from 'lucide-react';

interface ZeroCreditsPaywallProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance?: number;
  actionName?: string;
}

export function ZeroCreditsPaywall({
  open,
  onOpenChange,
  currentBalance = 0,
  actionName
}: ZeroCreditsPaywallProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('credits');
  const isRTL = i18n.language === 'ar';
  const [isYearly, setIsYearly] = useState(true);

  const maxPlan = isYearly 
    ? { price: 299, period: t('paywall.yearly'), credits: 260 }
    : { price: 39, period: t('paywall.monthly'), credits: 260 };

  const handleUpgradeMax = () => {
    onOpenChange(false);
    navigate(`/pricing-protected?plan=max&billing=${isYearly ? 'yearly' : 'monthly'}`);
  };

  const handlePurchaseCredits = () => {
    onOpenChange(false);
    navigate('/credit-store?package=large');
  };

  const handleFreeCredits = () => {
    onOpenChange(false);
    navigate('/referral');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
            <Zap className="h-8 w-8 text-amber-600" />
          </div>
          <DialogTitle className="text-xl">{t('paywall.title')}</DialogTitle>
          <DialogDescription className="text-center">
            {t('paywall.subtitle')}
          </DialogDescription>
        </DialogHeader>

        {/* Current Balance Display */}
        {currentBalance !== undefined && (
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <span className="text-sm text-muted-foreground">
              {t('paywall.current_balance')}: 
            </span>
            <span className="font-bold text-foreground mx-1">{currentBalance}</span>
            <span className="text-sm text-muted-foreground">{t('balance.credits')}</span>
          </div>
        )}

        {/* Options */}
        <div className="space-y-3 mt-4">
          {/* Option 1: Subscribe to Max */}
          <Card 
            className="p-4 cursor-pointer border-primary bg-primary/5 hover:bg-primary/10 transition-all"
            onClick={handleUpgradeMax}
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-foreground">{t('paywall.upgrade')}</h4>
                  <Badge className="bg-primary/20 text-primary border-0 text-xs">
                    Max
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {maxPlan.credits} {t('paywall.credits_per_month')}
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary">{maxPlan.price}</span>
                  <span className="text-sm text-muted-foreground">{t('common:sar')} / {maxPlan.period}</span>
                </div>
                
                {/* Yearly/Monthly Toggle */}
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <span className={!isYearly ? 'text-primary font-medium' : 'text-muted-foreground'}>
                    {t('paywall.monthly')}
                  </span>
                  <Switch
                    checked={isYearly}
                    onCheckedChange={setIsYearly}
                    className="data-[state=checked]:bg-primary"
                  />
                  <span className={isYearly ? 'text-primary font-medium' : 'text-muted-foreground'}>
                    {t('paywall.yearly')}
                  </span>
                  {isYearly && (
                    <Badge variant="secondary" className="text-xs">
                      {t('paywall.save_36')}
                    </Badge>
                  )}
                </div>
              </div>
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
          </Card>

          {/* Option 2: Purchase Credits (L Package) */}
          <Card 
            className="p-4 cursor-pointer hover:border-amber-500/50 hover:bg-amber-500/5 transition-all"
            onClick={handlePurchaseCredits}
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <CreditCard className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-foreground">{t('paywall.purchase')}</h4>
                  <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-0 text-xs">
                    {t('paywall.best_value')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  450 {t('balance.credits')} {t('paywall.for')} 99 {t('common:sar')}
                </p>
              </div>
            </div>
          </Card>

          {/* Option 3: Free Credits via Referral */}
          <Card 
            className="p-4 cursor-pointer hover:border-green-500/50 hover:bg-green-500/5 transition-all"
            onClick={handleFreeCredits}
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <Gift className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{t('paywall.free')}</h4>
                <p className="text-sm text-muted-foreground">{t('paywall.free_desc')}</p>
              </div>
              <Users className="h-5 w-5 text-green-600" />
            </div>
          </Card>
        </div>

        <Button variant="ghost" className="w-full mt-2" onClick={() => onOpenChange(false)}>
          {t('common:cancel')}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
