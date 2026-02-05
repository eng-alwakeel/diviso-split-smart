import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Zap, CreditCard, Gift, Users, Crown, Sparkles, PlayCircle, Clock } from 'lucide-react';
import { useRewardedAds } from '@/hooks/useRewardedAds';
import { useAdSettings } from '@/hooks/useAdSettings';
import { useAdEventLogger } from '@/hooks/useAdEventLogger';
import { AD_PLACEMENTS, AD_TYPES } from '@/lib/adPolicies';
import { usePaymentwallTokens } from '@/hooks/usePaymentwallTokens';
import { toast } from 'sonner';

interface ZeroCreditsPaywallProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance?: number;
  actionName?: string;
  requiredCredits?: number;
}

export function ZeroCreditsPaywall({
  open,
  onOpenChange,
  currentBalance = 0,
  actionName,
  requiredCredits = 1
}: ZeroCreditsPaywallProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('credits');
  const isRTL = i18n.language === 'ar';
  const [isYearly, setIsYearly] = useState(true);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  
  const { 
    eligibility, 
    loading: adLoading, 
    checkEligibility,
    createSession,
    claimRewardAsToken,
    formatCooldown,
    updateSessionStatus
  } = useRewardedAds();

  const { isAdTypeEnabled, isPlacementEnabled } = useAdSettings();
  const { logRewardedStart, logRewardedComplete, logRewardedClaim } = useAdEventLogger();
  
  // Paymentwall tokens status
  const { status: paywallStatus, loading: paywallLoading, refetch: refreshPaywallStatus } = usePaymentwallTokens();

  // Check if rewarded ads are enabled
  const rewardedEnabled = isAdTypeEnabled(AD_TYPES.REWARDED) && isPlacementEnabled(AD_PLACEMENTS.PAYWALL_REWARDED);

  // Check ad eligibility when dialog opens
  useEffect(() => {
    if (open && actionName && rewardedEnabled) {
      checkEligibility(actionName, requiredCredits);
    }
  }, [open, actionName, requiredCredits, checkEligibility, rewardedEnabled]);

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

  // Navigate to Paymentwall Offerwall
  const handleWatchAd = () => {
    // Log the start event
    logRewardedStart(AD_PLACEMENTS.PAYWALL_REWARDED);
    
    // Close dialog and navigate to offerwall
    onOpenChange(false);
    navigate('/offerwall');
  };
  
  // Check if user has available tokens from Paymentwall
  const hasPaywallTokens = paywallStatus.available > 0;
  const paywallDailyRemaining = paywallStatus.dailyLimit - paywallStatus.usedToday;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
            <Zap className="h-8 w-8 text-amber-600" />
          </div>
          <DialogTitle className="text-xl">
            {isRTL ? 'نفدت نقاطك لهذا الشهر' : 'Your monthly credits are depleted'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isRTL ? 'اختر طريقة المتابعة' : 'Choose how to continue'}
          </DialogDescription>
        </DialogHeader>

        {/* Current Balance Display */}
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <span className="text-sm text-muted-foreground">
            {t('paywall.current_balance')}: 
          </span>
          <span className="font-bold text-foreground mx-1">{currentBalance}</span>
          <span className="text-sm text-muted-foreground">{t('balance.credits')}</span>
          {actionName && (
            <span className="text-sm text-muted-foreground block mt-1">
              {isRTL ? 'مطلوب: ' : 'Required: '}{requiredCredits} UC
            </span>
          )}
        </div>

        {/* 4 Options Only */}
        <div className="space-y-3 mt-4">
          {/* Option 1: ترقية الخطة */}
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
                  <h4 className="font-semibold text-foreground">
                    {isRTL ? 'ترقية الخطة' : 'Upgrade Plan'}
                  </h4>
                  <Badge className="bg-primary/20 text-primary border-0 text-xs">
                    Max
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {isRTL 
                    ? 'زيادة فورية في نقاط هذا الشهر' 
                    : 'Instant increase in this month\'s credits'
                  }
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

          {/* Option 2: شراء نقاط */}
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
                  <h4 className="font-semibold text-foreground">
                    {isRTL ? 'شراء نقاط' : 'Buy Credits'}
                  </h4>
                  <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-0 text-xs">
                    {t('paywall.best_value')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isRTL 
                    ? 'تنتهي بنهاية دورتك الحالية' 
                    : 'Expires at end of your current cycle'
                  }
                </p>
              </div>
            </div>
          </Card>

          {/* Option 3: شاهد إعلان (عملية واحدة فقط) */}
          {rewardedEnabled && (
            <Card 
              className={`p-4 transition-all ${
                paywallDailyRemaining > 0
                  ? 'cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5'
                  : 'opacity-60 cursor-not-allowed'
              }`}
              onClick={paywallDailyRemaining > 0 ? handleWatchAd : undefined}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <PlayCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground">
                      {isRTL ? 'أكمل عرض واحصل على عملية مجانية' : 'Complete Offer & Get Free Action'}
                    </h4>
                    {hasPaywallTokens && (
                      <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-0 text-xs">
                        {isRTL ? `${paywallStatus.available} متاح` : `${paywallStatus.available} available`}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-1">
                    {isRTL 
                      ? 'أكمل عروضاً بسيطة واحصل على عمليات مجانية' 
                      : 'Complete simple offers to earn free actions'
                    }
                  </p>
                  
                  {/* Show daily limit info */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-blue-600">
                      {isRTL ? 'الحد اليومي: ' : 'Daily: '}
                      {paywallStatus.usedToday}/{paywallStatus.dailyLimit}
                    </span>
                    
                    {paywallStatus.cooldownSeconds > 0 && (
                      <span className="text-orange-600 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {paywallStatus.cooldownSeconds}s
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Option 4: إحالة صديق */}
          <Card 
            className="p-4 cursor-pointer hover:border-green-500/50 hover:bg-green-500/5 transition-all"
            onClick={handleFreeCredits}
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <Gift className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">
                  {isRTL ? 'احصل على نقاط مجانية عبر الإحالة' : 'Get Free Credits via Referral'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {isRTL 
                    ? 'ادعُ صديقك وخذ عملية مجانية (محدود 5/شهر)' 
                    : 'Invite friend & get free action (limited 5/month)'
                  }
                </p>
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
