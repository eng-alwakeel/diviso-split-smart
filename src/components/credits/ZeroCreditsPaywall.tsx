import { useState, useEffect } from 'react';
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
import { Progress } from '@/components/ui/progress';
import { Zap, CreditCard, Gift, Users, Crown, Sparkles, PlayCircle, Ticket } from 'lucide-react';
import { useRewardedAds } from '@/hooks/useRewardedAds';
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
  const [watchedAds, setWatchedAds] = useState(0);
  const [showRedeemCode, setShowRedeemCode] = useState(false);
  
  const { 
    eligibility, 
    loading: adLoading, 
    checkEligibility,
    createSession,
    claimReward,
    formatCooldown
  } = useRewardedAds();

  // Check ad eligibility when dialog opens
  useEffect(() => {
    if (open && actionName) {
      checkEligibility(actionName, requiredCredits);
    }
  }, [open, actionName, requiredCredits, checkEligibility]);

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
    if (!actionName) return;
    
    const session = await createSession(actionName, requiredCredits);
    if (!session) {
      toast.error(isRTL ? 'غير مؤهل لمشاهدة الإعلان' : 'Not eligible to watch ad');
      return;
    }

    // Simulate ad watching (in production, integrate with AdMob)
    toast.info(isRTL ? 'جاري عرض الإعلان...' : 'Loading ad...');
    
    // Simulate ad completion after 3 seconds
    setTimeout(async () => {
      const result = await claimReward(session.sessionId);
      if (result.success) {
        setWatchedAds(prev => prev + 1);
        toast.success(
          isRTL 
            ? `تم! حصلت على ${result.rewardUC} نقطة` 
            : `Done! You earned ${result.rewardUC} credit`
        );
        
        // Refresh eligibility
        await checkEligibility(actionName, requiredCredits);
        
        // If we now have enough credits, close the dialog
        if (eligibility && currentBalance + watchedAds + 1 >= requiredCredits) {
          toast.success(isRTL ? 'يمكنك المتابعة الآن!' : 'You can proceed now!');
          setTimeout(() => onOpenChange(false), 1000);
        }
      } else {
        toast.error(isRTL ? 'فشل في الحصول على المكافأة' : 'Failed to claim reward');
      }
    }, 3000);
  };

  const neededUC = eligibility?.neededUC ?? Math.max(0, requiredCredits - currentBalance);
  const adsNeeded = eligibility?.adsNeeded ?? neededUC;
  const progress = adsNeeded > 0 ? (watchedAds / adsNeeded) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
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

        {/* Options */}
        <div className="space-y-3 mt-4">
          {/* Option 1: Subscribe to Max (Default) */}
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

          {/* Option 2: Purchase Credits (L Package - Best Value) */}
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

          {/* Option 4: Watch Rewarded Ad */}
          {eligibility?.adsEnabled && (
            <Card 
              className={`p-4 transition-all ${
                eligibility?.canWatch 
                  ? 'cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5' 
                  : 'opacity-60 cursor-not-allowed'
              }`}
              onClick={eligibility?.canWatch ? handleWatchAd : undefined}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <PlayCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground">
                      {isRTL ? 'شاهد إعلان واحصل على 1 نقطة' : 'Watch Ad & Get 1 Credit'}
                    </h4>
                  </div>
                  
                  {/* Remaining ads today */}
                  <p className="text-sm text-muted-foreground mb-2">
                    {isRTL ? 'المتبقي اليوم: ' : 'Remaining today: '}
                    <span className="font-medium text-blue-600">
                      {eligibility?.remainingToday ?? 5}/{eligibility?.dailyCap ?? 5}
                    </span>
                  </p>
                  
                  {/* Progress for multiple ads needed */}
                  {adsNeeded > 1 && (
                    <div className="space-y-1">
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {isRTL 
                          ? `تحتاج ${adsNeeded - watchedAds} إعلانات لإكمال العملية`
                          : `Need ${adsNeeded - watchedAds} more ads to complete`
                        }
                      </p>
                    </div>
                  )}
                  
                  {/* Cooldown message */}
                  {eligibility?.cooldownRemaining && eligibility.cooldownRemaining > 0 && (
                    <p className="text-xs text-orange-600 mt-1">
                      {isRTL ? 'انتظر ' : 'Wait '}{formatCooldown(eligibility.cooldownRemaining)}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Option 5: Redeem Code (Optional) */}
          <Card 
            className="p-3 cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all"
            onClick={() => setShowRedeemCode(!showRedeemCode)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                <Ticket className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground text-sm">
                  {isRTL ? 'استبدال كود' : 'Redeem Code'}
                </h4>
              </div>
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
