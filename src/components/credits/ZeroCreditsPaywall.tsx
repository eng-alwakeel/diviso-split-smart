import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, CreditCard, Gift, Users, Crown, Sparkles, PlayCircle, Clock, ChevronDown } from 'lucide-react';
import { useRewardedAds } from '@/hooks/useRewardedAds';
import { useAdSettings } from '@/hooks/useAdSettings';
import { useAdEventLogger } from '@/hooks/useAdEventLogger';
import { AD_PLACEMENTS, AD_TYPES } from '@/lib/adPolicies';
import { usePaymentwallTokens } from '@/hooks/usePaymentwallTokens';
import { PaymentwallOfferwallDialog } from '@/components/ads/PaymentwallOfferwallDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ZeroCreditsPaywallProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance?: number;
  actionName?: string;
  requiredCredits?: number;
}

interface CreditPackage {
  id: string;
  name: string;
  name_ar: string;
  credits: number;
  bonus_credits: number | null;
  price_sar: number;
  validity_days: number;
}

const PLANS = [
  { key: 'starter', labelAr: 'Starter', credits: 80, priceMonthly: 15, priceYearly: 129 },
  { key: 'pro', labelAr: 'Pro', credits: 160, priceMonthly: 25, priceYearly: 199 },
  { key: 'max', labelAr: 'Max', credits: 260, priceMonthly: 39, priceYearly: 299 },
];

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
  
  // Selection state
  const [selectedOption, setSelectedOption] = useState<'upgrade' | 'topup' | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [isYearly, setIsYearly] = useState(true);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  
  const [showOfferwall, setShowOfferwall] = useState(false);
  
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
  
  const { status: paywallStatus, loading: paywallLoading, refetch: refreshPaywallStatus } = usePaymentwallTokens();

  const rewardedEnabled = isAdTypeEnabled(AD_TYPES.REWARDED) && isPlacementEnabled(AD_PLACEMENTS.PAYWALL_REWARDED);

  // Fetch credit packages
  useEffect(() => {
    if (open) {
      supabase
        .from('credit_packages')
        .select('id, name, name_ar, credits, bonus_credits, price_sar, validity_days')
        .eq('is_active', true)
        .order('sort_order')
        .then(({ data }) => {
          if (data) {
            setPackages(data);
            if (data.length > 0 && !selectedPackageId) {
              setSelectedPackageId(data[0].id);
            }
          }
        });
    }
  }, [open]);

  useEffect(() => {
    if (open && actionName && rewardedEnabled) {
      checkEligibility(actionName, requiredCredits);
    }
  }, [open, actionName, requiredCredits, checkEligibility, rewardedEnabled]);

  const selectedPlanData = PLANS.find(p => p.key === selectedPlan);
  const selectedPackage = packages.find(p => p.id === selectedPackageId);

  const handleMainAction = () => {
    if (selectedOption === 'upgrade') {
      onOpenChange(false);
      navigate(`/pricing-protected?plan=${selectedPlan}&billing=${isYearly ? 'yearly' : 'monthly'}`);
    } else if (selectedOption === 'topup' && selectedPackageId) {
      onOpenChange(false);
      navigate(`/credit-store?package=${selectedPackageId}`);
    }
  };

  const handleFreeCredits = () => {
    onOpenChange(false);
    navigate('/referral');
  };

  const handleWatchAd = () => {
    logRewardedStart(AD_PLACEMENTS.PAYWALL_REWARDED);
    setShowOfferwall(true);
  };
   
  const handleRewardEarned = () => {
    setShowOfferwall(false);
    onOpenChange(false);
    toast.success(isRTL ? 'تم الحصول على عملية مجانية!' : 'Free action earned!');
  };
  
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

        {/* Current Balance */}
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <span className="text-sm text-muted-foreground">{t('paywall.current_balance')}: </span>
          <span className="font-bold text-foreground mx-1">{currentBalance}</span>
          <span className="text-sm text-muted-foreground">{t('balance.credits')}</span>
          {actionName && (
            <span className="text-sm text-muted-foreground block mt-1">
              {isRTL ? 'مطلوب: ' : 'Required: '}{requiredCredits} UC
            </span>
          )}
        </div>

        <div className="space-y-3 mt-4">
          {/* Option 1: Upgrade Plan — Expandable */}
          <Card 
            className={`p-4 cursor-pointer transition-all ${
              selectedOption === 'upgrade' 
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                : 'hover:border-primary/50'
            }`}
            onClick={() => setSelectedOption(selectedOption === 'upgrade' ? null : 'upgrade')}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-foreground">
                    {isRTL ? 'ترقية الخطة' : 'Upgrade Plan'}
                  </h4>
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'زيادة فورية في نقاط هذا الشهر' : 'Instant increase in this month\'s credits'}
                </p>
              </div>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${selectedOption === 'upgrade' ? 'rotate-180' : ''}`} />
            </div>

            {/* Expanded content */}
            {selectedOption === 'upgrade' && (
              <div className="mt-4 space-y-3 border-t border-border pt-3" onClick={e => e.stopPropagation()}>
                {/* Billing toggle */}
                <div className="flex items-center justify-center gap-2 text-sm">
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
                    <Badge variant="secondary" className="text-xs">{t('paywall.save_36')}</Badge>
                  )}
                </div>

                {/* Plan selector */}
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLANS.map(plan => (
                      <SelectItem key={plan.key} value={plan.key}>
                        <div className="flex items-center justify-between w-full gap-3">
                          <span className="font-medium">{plan.labelAr}</span>
                          <span className="text-muted-foreground text-xs">
                            {plan.credits} UC • {isYearly ? plan.priceYearly : plan.priceMonthly} {t('common:sar')}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Selected plan summary */}
                {selectedPlanData && (
                  <div className="bg-primary/10 rounded-lg p-2.5 text-sm text-center">
                    <span className="font-bold text-primary">{selectedPlanData.credits}</span>
                    <span className="text-muted-foreground mx-1">UC /</span>
                    <span className="font-bold text-primary">
                      {isYearly ? selectedPlanData.priceYearly : selectedPlanData.priceMonthly}
                    </span>
                    <span className="text-muted-foreground mx-1">{t('common:sar')} / {isYearly ? t('paywall.yearly') : t('paywall.monthly')}</span>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Option 2: Buy Credits — Expandable */}
          <Card 
            className={`p-4 cursor-pointer transition-all ${
              selectedOption === 'topup' 
                ? 'border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20' 
                : 'hover:border-amber-500/50'
            }`}
            onClick={() => setSelectedOption(selectedOption === 'topup' ? null : 'topup')}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CreditCard className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-foreground">
                    {isRTL ? 'شراء نقاط' : 'Buy Credits'}
                  </h4>
                  <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-0 text-xs">
                    {t('paywall.best_value')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'تنتهي بنهاية دورتك الحالية' : 'Expires at end of your current cycle'}
                </p>
              </div>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${selectedOption === 'topup' ? 'rotate-180' : ''}`} />
            </div>

            {/* Expanded content */}
            {selectedOption === 'topup' && packages.length > 0 && (
              <div className="mt-4 space-y-3 border-t border-border pt-3" onClick={e => e.stopPropagation()}>
                <Select value={selectedPackageId || ''} onValueChange={setSelectedPackageId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={isRTL ? 'اختر باقة' : 'Select package'} />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map(pkg => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{isRTL ? pkg.name_ar : pkg.name}</span>
                          <span className="text-muted-foreground text-xs">
                            {pkg.credits} UC • {pkg.price_sar} {t('common:sar')}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Selected package summary */}
                {selectedPackage && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2.5 text-sm text-center">
                    <span className="font-bold text-amber-700 dark:text-amber-400">{selectedPackage.credits}</span>
                    <span className="text-muted-foreground mx-1">UC •</span>
                    <span className="font-bold text-amber-700 dark:text-amber-400">{selectedPackage.price_sar}</span>
                    <span className="text-muted-foreground mx-1">{t('common:sar')}</span>
                    <span className="text-muted-foreground text-xs block mt-1">
                      {isRTL ? `صالحة لـ ${selectedPackage.validity_days} يوم` : `Valid for ${selectedPackage.validity_days} days`}
                    </span>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Option 3: Watch Ad */}
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
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <PlayCircle className="h-5 w-5 text-blue-600" />
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
                    {isRTL ? 'أكمل عروضاً بسيطة واحصل على عمليات مجانية' : 'Complete simple offers to earn free actions'}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-blue-600">
                      {isRTL ? 'الحد اليومي: ' : 'Daily: '}{paywallStatus.usedToday}/{paywallStatus.dailyLimit}
                    </span>
                    {paywallStatus.cooldownSeconds > 0 && (
                      <span className="text-orange-600 flex items-center gap-1">
                        <Clock className="h-3 w-3" />{paywallStatus.cooldownSeconds}s
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Option 4: Referral */}
          <Card 
            className="p-4 cursor-pointer hover:border-green-500/50 hover:bg-green-500/5 transition-all"
            onClick={handleFreeCredits}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <Gift className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">
                  {isRTL ? 'احصل على نقاط مجانية عبر الإحالة' : 'Get Free Credits via Referral'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'ادعُ صديقك وخذ عملية مجانية (محدود 5/شهر)' : 'Invite friend & get free action (limited 5/month)'}
                </p>
              </div>
              <Users className="h-5 w-5 text-green-600" />
            </div>
          </Card>
        </div>

        {/* Unified action button */}
        <div className="flex gap-2 mt-4">
          <Button variant="ghost" className="flex-1" onClick={() => onOpenChange(false)}>
            {t('common:cancel')}
          </Button>
          {selectedOption && (
            <Button variant="hero" className="flex-1" onClick={handleMainAction}>
              {selectedOption === 'upgrade'
                ? (isRTL ? 'ترقية الخطة' : 'Upgrade Plan')
                : (isRTL ? 'شراء النقاط' : 'Buy Credits')
              }
            </Button>
          )}
        </div>
       
        <PaymentwallOfferwallDialog
          open={showOfferwall}
          onOpenChange={setShowOfferwall}
          onRewardEarned={handleRewardEarned}
          isRTL={isRTL}
        />
      </DialogContent>
    </Dialog>
  );
}
