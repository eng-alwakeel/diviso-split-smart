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
import { triggerOfferwall } from '@/lib/adsenseOfferwall';
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

  const handleWatchAd = async () => {
    if (!actionName || isWatchingAd) return;
    
    setIsWatchingAd(true);
    
    try {
      // Log ad start
      await logRewardedStart(AD_PLACEMENTS.PAYWALL_REWARDED);
      
      const session = await createSession(actionName, requiredCredits);
      if (!session) {
        toast.error(isRTL ? 'غير مؤهل لمشاهدة الإعلان' : 'Not eligible to watch ad');
        setIsWatchingAd(false);
        return;
      }

      toast.info(isRTL ? 'جاري فتح الإعلان...' : 'Opening ad...');
      
      // Trigger real AdSense Offerwall
      const completed = await triggerOfferwall();
      
      if (completed) {
        // Log ad completion
        await logRewardedComplete(AD_PLACEMENTS.PAYWALL_REWARDED, 1);
        
        // Claim reward as one-time token
        const result = await claimRewardAsToken(session.sessionId, actionName);
        
        if (result.success) {
          // Log claim
          await logRewardedClaim(AD_PLACEMENTS.PAYWALL_REWARDED, 1);
          
          toast.success(
            isRTL 
              ? `تم! يمكنك تنفيذ عملية واحدة خلال ${result.expiresInMinutes} دقيقة` 
              : `Done! You can perform one action within ${result.expiresInMinutes} minutes`
          );
          
          setTimeout(() => onOpenChange(false), 1000);
        } else {
          toast.error(isRTL ? 'فشل في الحصول على التفعيل' : 'Failed to unlock action');
        }
      } else {
        // Ad was not completed (user closed or timeout)
        toast.warning(isRTL ? 'لم يكتمل الإعلان' : 'Ad not completed');
        await updateSessionStatus(session.sessionId, 'failed');
      }
      
      setIsWatchingAd(false);
      await checkEligibility(actionName, requiredCredits);
    } catch (error) {
      console.error('Error watching ad:', error);
      toast.error(isRTL ? 'حدث خطأ' : 'An error occurred');
      setIsWatchingAd(false);
    }
  };

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
          {rewardedEnabled && eligibility?.adsEnabled && (
            <Card 
              className={`p-4 transition-all ${
                eligibility?.canWatch && !isWatchingAd
                  ? 'cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5' 
                  : 'opacity-60 cursor-not-allowed'
              }`}
              onClick={eligibility?.canWatch && !isWatchingAd ? handleWatchAd : undefined}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <PlayCircle className={`h-6 w-6 text-blue-600 ${isWatchingAd ? 'animate-pulse' : ''}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground">
                      {isRTL ? 'شاهد إعلان وافتح عملية واحدة' : 'Watch Ad & Unlock One Action'}
                    </h4>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-1">
                    {isRTL 
                      ? 'بدون نقاط — عملية واحدة فقط (30 دقيقة)' 
                      : 'No credits — One action only (30 min)'
                    }
                  </p>
                  
                  {/* Show remaining ads and cooldown */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-blue-600">
                      {isRTL ? 'المتبقي اليوم: ' : 'Today: '}
                      {eligibility?.remainingToday ?? 0}/{eligibility?.dailyCap ?? 2}
                    </span>
                    
                    {eligibility?.cooldownRemaining && eligibility.cooldownRemaining > 0 && (
                      <span className="text-orange-600 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatCooldown(eligibility.cooldownRemaining)}
                      </span>
                    )}
                  </div>
                  
                  {isWatchingAd && (
                    <p className="text-xs text-blue-600 mt-1 animate-pulse">
                      {isRTL ? 'جاري مشاهدة الإعلان...' : 'Watching ad...'}
                    </p>
                  )}
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
