import { useState, useEffect } from 'react';
import { Check, Crown, Sparkles, Zap, Loader2, Coins } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
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
  const { t, i18n } = useTranslation('credits');
  const { toast } = useToast();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_sar', { ascending: true });

      if (error) {
        console.error('Error fetching plans:', error);
        toast({
          title: t('common:error'),
          description: t('subscriptions.load_error'),
          variant: 'destructive',
        });
      } else {
        const transformedPlans = (data || []).map(plan => ({
          ...plan,
          features: Array.isArray(plan.features) ? plan.features as string[] : null
        }));
        setPlans(transformedPlans);
      }
      setLoading(false);
    };

    fetchPlans();
  }, [t, toast]);

  const handleSubscribe = (plan: SubscriptionPlan) => {
    navigate('/pricing', { state: { selectedPlan: plan.name.toLowerCase() } });
  };

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    switch (name) {
      case 'starter': return <Zap className="h-5 w-5" />;
      case 'pro': return <Sparkles className="h-5 w-5" />;
      case 'max': return <Crown className="h-5 w-5" />;
      default: return <Zap className="h-5 w-5" />;
    }
  };

  const getPlanStyles = (planName: string) => {
    const name = planName.toLowerCase();
    switch (name) {
      case 'starter':
        return { 
          icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
          border: 'border-border'
        };
      case 'pro':
        return { 
          icon: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
          border: 'border-primary ring-2 ring-primary/20'
        };
      case 'max':
        return { 
          icon: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
          border: 'border-green-500 ring-2 ring-green-500/20'
        };
      default:
        return { icon: 'bg-muted text-muted-foreground', border: 'border-border' };
    }
  };

  const getPlanBadge = (planName: string) => {
    const name = planName.toLowerCase();
    if (name === 'max') {
      return { 
        text: isRTL ? 'أفضل قيمة' : 'Best Value', 
        className: 'bg-green-500 text-white' 
      };
    }
    if (name === 'pro') {
      return { 
        text: isRTL ? 'الأكثر شيوعاً' : 'Popular', 
        className: 'bg-primary text-primary-foreground' 
      };
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (plans.length === 0) return null;

  const filteredPlans = plans.filter(plan => plan.billing_cycle === billingCycle);

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold">{t('subscriptions.title')}</h3>
        <p className="text-sm text-muted-foreground">{t('subscriptions.subtitle')}</p>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center gap-3 p-2 bg-muted/50 rounded-lg">
        <span className={`text-sm font-medium transition-colors ${billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
          {t('plans.monthly')}
        </span>
        <Switch 
          checked={billingCycle === 'yearly'}
          onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
        />
        <span className={`text-sm font-medium transition-colors ${billingCycle === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}`}>
          {t('plans.yearly')}
        </span>
        {billingCycle === 'yearly' && (
          <Badge className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-0 text-xs">
            -{t('plans.save_up_to', { percent: 36 })}
          </Badge>
        )}
      </div>

      {/* Plans - Vertical Stack for Mobile */}
      <div className="space-y-3">
        {filteredPlans.map((plan) => {
          const name = isRTL ? plan.name_ar : plan.name;
          const badge = getPlanBadge(plan.name);
          const styles = getPlanStyles(plan.name);

          return (
            <Card 
              key={plan.id}
              className={`relative overflow-hidden transition-all ${styles.border}`}
            >
              {/* Badge */}
              {badge && (
                <Badge className={`absolute top-3 ltr:right-3 rtl:left-3 text-xs ${badge.className}`}>
                  {badge.text}
                </Badge>
              )}

              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icon - دائرة مثل باقات النقاط */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${styles.icon}`}>
                    {getPlanIcon(plan.name)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-base">{name}</h4>
                    
                    {/* Price and Credits Row */}
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-bold text-foreground">{plan.price_sar}</span>
                      <span className="text-sm text-muted-foreground">
                        {t('common:sar')}/{billingCycle === 'yearly' ? t('plans.year') : t('plans.month')}
                      </span>
                    </div>
                    
                    {/* Credits مع أيقونة Coins */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <Coins className="h-4 w-4 text-primary" />
                      <span className="text-primary font-semibold">{plan.credits_per_month}</span>
                      <span className="text-sm text-muted-foreground">{t('plans.credits_per_month')}</span>
                    </div>

                    {/* Features - Compact */}
                    {plan.features && plan.features.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {plan.features.slice(0, 3).map((feature, index) => (
                          <div key={index} className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                            <span className="truncate">{feature}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Subscribe Button */}
                <Button 
                  className="w-full mt-4 h-11"
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
    </div>
  );
}
