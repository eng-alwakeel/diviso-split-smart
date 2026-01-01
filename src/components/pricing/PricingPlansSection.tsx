import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Check, Crown, Sparkles, Zap } from 'lucide-react';

interface Plan {
  id: string;
  tier: 'starter' | 'pro' | 'max';
  monthly: { price: number; credits: number };
  yearly: { price: number; credits: number; discount: number };
  featured?: boolean;
  decoy?: boolean;
}

const plans: Plan[] = [
  {
    id: 'starter',
    tier: 'starter',
    monthly: { price: 19, credits: 70 },
    yearly: { price: 189, credits: 90, discount: 17 }
  },
  {
    id: 'pro',
    tier: 'pro',
    monthly: { price: 29, credits: 90 },
    yearly: { price: 239, credits: 160, discount: 31 },
    decoy: true
  },
  {
    id: 'max',
    tier: 'max',
    monthly: { price: 39, credits: 260 },
    yearly: { price: 299, credits: 260, discount: 36 },
    featured: true
  }
];

interface PricingPlansSectionProps {
  showTitle?: boolean;
  defaultYearly?: boolean;
}

export function PricingPlansSection({ 
  showTitle = true,
  defaultYearly = true 
}: PricingPlansSectionProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('credits');
  const isRTL = i18n.language === 'ar';
  const [isYearly, setIsYearly] = useState(defaultYearly);

  const handleSubscribe = (planId: string) => {
    const billingCycle = isYearly ? 'yearly' : 'monthly';
    navigate(`/pricing-protected?plan=${planId}&billing=${billingCycle}`);
  };

  const getPlanIcon = (tier: string) => {
    switch (tier) {
      case 'starter': return <Zap className="h-6 w-6" />;
      case 'pro': return <Sparkles className="h-6 w-6" />;
      case 'max': return <Crown className="h-6 w-6" />;
      default: return <Zap className="h-6 w-6" />;
    }
  };

  const getPlanDetails = (plan: Plan) => {
    return isYearly ? plan.yearly : plan.monthly;
  };

  const features = [
    { key: 'unlimited_groups', starter: false, pro: true, max: true },
    { key: 'smart_ai', starter: false, pro: true, max: true },
    { key: 'no_ads', starter: false, pro: true, max: true },
    { key: 'priority_support', starter: false, pro: false, max: true },
    { key: 'advanced_reports', starter: false, pro: false, max: true }
  ];

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {showTitle && (
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            {t('subscriptions.title')}
          </h2>
          <p className="text-muted-foreground">
            {t('subscriptions.subtitle')}
          </p>
        </div>
      )}

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 p-3 bg-muted/30 rounded-xl">
        <span className={`text-sm sm:text-base font-medium transition-colors ${
          !isYearly ? 'text-primary' : 'text-muted-foreground'
        }`}>
          {t('plans.monthly')}
        </span>
        <Switch
          checked={isYearly}
          onCheckedChange={setIsYearly}
          className="data-[state=checked]:bg-primary scale-110"
        />
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className={`text-sm sm:text-base font-medium transition-colors ${
            isYearly ? 'text-primary' : 'text-muted-foreground'
          }`}>
            {t('plans.yearly')}
          </span>
          {isYearly && (
            <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {t('plans.save_up_to')} 36%
            </Badge>
          )}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {plans.map((plan) => {
          const details = getPlanDetails(plan);
          
          return (
            <Card 
              key={plan.id}
              className={`relative transition-all hover:shadow-lg ${
                plan.featured 
                  ? 'border-primary shadow-lg shadow-primary/10 md:scale-105 z-10' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {plan.featured && (
                <Badge 
                  className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground"
                >
                  {t('plans.recommended')}
                </Badge>
              )}
              
              <CardHeader className="text-center pb-3 sm:pb-4">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-full flex items-center justify-center mb-2 sm:mb-3 ${
                  plan.featured 
                    ? 'bg-primary/20 text-primary' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {getPlanIcon(plan.tier)}
                </div>
                <CardTitle className="text-lg sm:text-xl">
                  {t(`plans.${plan.tier}.name`)}
                </CardTitle>
                {isYearly && plan.yearly.discount > 0 && (
                  <Badge variant="outline" className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-green-600 border-green-300">
                    {t('plans.save')} {plan.yearly.discount}%
                  </Badge>
                )}
              </CardHeader>
              
              <CardContent className="text-center space-y-3 sm:space-y-4">
                {/* Price */}
                <div>
                  <span className="text-3xl sm:text-4xl font-bold text-foreground">{details.price}</span>
                  <span className="text-muted-foreground mr-1 text-sm"> {t('common:sar')}</span>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    / {isYearly ? t('plans.year') : t('plans.month')}
                  </span>
                </div>

                {/* Credits per month */}
                <div className="bg-primary/10 rounded-lg py-2.5 sm:py-3 px-3 sm:px-4">
                  <div className="text-xl sm:text-2xl font-bold text-primary">
                    {details.credits}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {t('plans.credits_per_month')}
                  </div>
                </div>

                {/* Renewal note */}
                <p className="text-[10px] sm:text-xs text-muted-foreground/70">
                  {t('plans.renews_monthly')}
                </p>

                {/* Yearly equivalent */}
                {isYearly && (
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    ≈ {Math.round(details.price / 12)} {t('common:sar')} / {t('plans.month')} • {t('plans.annual_note')}
                  </p>
                )}

                {/* Features */}
                <ul className="text-sm space-y-2 text-right">
                  {features.map((feature) => {
                    const hasFeature = feature[plan.tier as keyof typeof feature];
                    return (
                      <li 
                        key={feature.key} 
                        className={`flex items-center gap-2 ${
                          hasFeature ? 'text-foreground' : 'text-muted-foreground line-through'
                        }`}
                      >
                        <Check className={`h-4 w-4 flex-shrink-0 ${
                          hasFeature ? 'text-green-500' : 'text-muted-foreground/50'
                        }`} />
                        <span>{t(`plans.features.${feature.key}`)}</span>
                      </li>
                    );
                  })}
                </ul>

                {/* Subscribe Button */}
                <Button 
                  className="w-full"
                  variant={plan.featured ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {t('subscriptions.subscribe_btn')}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
