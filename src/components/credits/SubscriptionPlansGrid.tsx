import { useState, useEffect } from 'react';
import { Check, Crown, Sparkles, Zap, Loader2, Coins } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface SubscriptionPlan {
  id: string;
  name: string;
  name_ar: string;
  billing_cycle: string;
  price_sar: number;
  credits_per_month: number;
  features: string[] | null;
  is_active: boolean | null;
}

export function SubscriptionPlansGrid() {
  const { t, i18n } = useTranslation(['credits', 'common']);
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('is_active', true)
          .order('price_sar', { ascending: true });

        if (error) throw error;

        const transformedPlans = (data || []).map(plan => ({
          ...plan,
          features: Array.isArray(plan.features) ? plan.features as string[] : null
        }));
        setPlans(transformedPlans);
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleSubscribe = (plan: SubscriptionPlan) => {
    navigate('/pricing', { state: { selectedPlan: plan.name.toLowerCase() } });
  };

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name === 'max') return <Crown className="h-5 w-5 text-amber-500" />;
    if (name === 'pro') return <Sparkles className="h-5 w-5 text-primary" />;
    return <Zap className="h-5 w-5 text-muted-foreground" />;
  };

  const getPlanStyles = (planName: string) => {
    const name = planName.toLowerCase();
    if (name === 'max') {
      return {
        border: 'border-green-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent ring-1 ring-green-500/20',
        icon: 'bg-amber-500/20'
      };
    }
    if (name === 'pro') {
      return {
        border: 'border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent ring-1 ring-primary/20',
        icon: 'bg-primary/20'
      };
    }
    return {
      border: 'border-border',
      icon: 'bg-muted'
    };
  };

  const getPlanBadge = (planName: string) => {
    const name = planName.toLowerCase();
    if (name === 'max') {
      return { 
        text: isRTL ? 'أفضل قيمة' : 'Best Value', 
        className: 'bg-green-500 text-white border-green-500' 
      };
    }
    if (name === 'pro') {
      return { 
        text: isRTL ? 'الأكثر شيوعاً' : 'Popular', 
        className: 'bg-primary text-primary-foreground border-primary' 
      };
    }
    return null;
  };

  // Get currency and period text based on language
  const getCurrencyText = () => isRTL ? 'ر.س' : 'SAR';
  const getPeriodText = () => {
    if (billingCycle === 'yearly') return isRTL ? '/سنة' : '/year';
    return isRTL ? '/شهر' : '/month';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="py-6 text-center text-muted-foreground">
          {t('subscriptions.load_error')}
        </CardContent>
      </Card>
    );
  }

  const filteredPlans = plans.filter(plan => plan.billing_cycle === billingCycle);

  return (
    <div className="space-y-4">
      {/* Billing Cycle Toggle - Segmented Control Style */}
      <div className="flex items-center justify-center gap-1 p-1 bg-muted/50 rounded-xl">
        <button
          onClick={() => setBillingCycle('monthly')}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            billingCycle === 'monthly'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {isRTL ? 'شهري' : 'Monthly'}
        </button>
        <button
          onClick={() => setBillingCycle('yearly')}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            billingCycle === 'yearly'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {isRTL ? 'سنوي' : 'Yearly'}
          <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0 border-0">
            {isRTL ? 'وفر 36%' : 'Save 36%'}
          </Badge>
        </button>
      </div>

      {/* Plans Grid */}
      <div className="space-y-3">
        {filteredPlans.map((plan) => {
          const name = isRTL ? plan.name_ar : plan.name;
          const badge = getPlanBadge(plan.name);
          const styles = getPlanStyles(plan.name);

          return (
            <Card
              key={plan.id}
              className={`relative overflow-hidden rounded-2xl transition-all ${styles.border}`}
            >
              {/* Badge */}
              {badge && (
                <Badge className={`absolute top-3 ltr:right-3 rtl:left-3 text-xs ${badge.className}`}>
                  {badge.text}
                </Badge>
              )}

              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icon - Circle style matching credit packages */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${styles.icon}`}>
                    {getPlanIcon(plan.name)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-base">{name}</h4>
                    
                    {/* Price */}
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-bold text-foreground">{plan.price_sar}</span>
                      <span className="text-sm text-muted-foreground">
                        {getCurrencyText()}{getPeriodText()}
                      </span>
                    </div>
                    
                    {/* Credits with Coins icon */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Coins className="h-4 w-4 text-primary" />
                      <span className="text-primary font-semibold">{plan.credits_per_month}</span>
                      <span className="text-sm text-muted-foreground">{t('plans.credits_per_month')}</span>
                    </div>

                    {/* Key Features - Max 3 */}
                    {plan.features && plan.features.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {plan.features.slice(0, 3).map((feature: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                            <span className="truncate">{feature}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Subscribe Button */}
                <Button 
                  className="w-full mt-4 h-11 rounded-xl"
                  variant={badge ? 'default' : 'outline'}
                  onClick={() => handleSubscribe(plan)}
                >
                  {t('subscriptions.subscribe_btn')}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Auto-renewal note */}
      <p className="text-xs text-center text-muted-foreground px-4">
        {t('plans.auto_renew_note')}
      </p>
    </div>
  );
}
