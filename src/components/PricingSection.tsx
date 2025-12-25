import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Star, Users, User } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { PlanBadge } from "@/components/ui/plan-badge";
import { usePlanBadge } from "@/hooks/usePlanBadge";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const PricingSection = () => {
  const [isYearly, setIsYearly] = useState(false);
  const { startTrial, canStartTrial } = useSubscription();
  const { toast } = useToast();
  const { getPlanBadgeConfig } = usePlanBadge();
  const navigate = useNavigate();
  const { t } = useTranslation('pricing');

  const plans = [
    {
      key: "free",
      icon: User,
      priceMonthly: "0",
      priceYearly: "0",
      features: [
        t('plans.free.features.groups'),
        t('plans.free.features.members'),
        t('plans.free.features.expenses'),
        t('plans.free.features.receipts'),
        t('plans.free.features.invites'),
        t('plans.free.features.split'),
        t('plans.free.features.reports'),
        t('plans.free.features.storage'),
        t('plans.free.features.support')
      ],
      popular: false
    },
    {
      key: "personal",
      icon: Star,
      priceMonthly: "19",
      priceYearly: "190",
      features: [
        t('plans.personal.features.groups'),
        t('plans.personal.features.members'),
        t('plans.personal.features.split'),
        t('plans.personal.features.ai'),
        t('plans.personal.features.analytics'),
        t('plans.personal.features.chat'),
        t('plans.personal.features.export'),
        t('plans.personal.features.support')
      ],
      popular: true
    },
    {
      key: "family",
      icon: Users,
      priceMonthly: "75",
      priceYearly: "750",
      features: [
        t('plans.family.features.allPersonal'),
        t('plans.family.features.familyMembers'),
        t('plans.family.features.limits'),
        t('plans.family.features.familyReports'),
        t('plans.family.features.approval'),
        t('plans.family.features.support')
      ],
      popular: false
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>
        <div className="flex items-center justify-center mb-10">
          <div className="bg-muted inline-flex p-1 rounded-lg">
            <Button
              variant={isYearly ? "ghost" : "default"}
              size="sm"
              onClick={() => setIsYearly(false)}
              className={!isYearly ? "shadow-elevated" : ""}
              aria-pressed={!isYearly}
            >
              {t('monthly')}
            </Button>
            <Button
              variant={isYearly ? "default" : "ghost"}
              size="sm"
              onClick={() => setIsYearly(true)}
              className={isYearly ? "shadow-elevated" : ""}
              aria-pressed={isYearly}
            >
              {t('yearly')} <span className="ml-2 text-xs text-primary">{t('save')}</span>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const planName = t(`plans.${plan.key}.name`);
            const planDescription = t(`plans.${plan.key}.description`);
            
            return (
              <Card 
                key={index} 
                className={`relative ${
                  plan.popular 
                    ? 'border-primary shadow-elevated scale-105' 
                    : 'shadow-card hover:shadow-elevated'
                } transition-all duration-300`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-primary text-white px-4 py-2 rounded-full text-sm font-medium">
                      {t('mostPopular')}
                    </div>
                  </div>
                )}

                <CardHeader className="text-center pb-6">
                  <div className="flex flex-col items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      plan.popular ? 'bg-gradient-primary' : 'bg-muted'
                    }`}>
                      <Icon className={`w-6 h-6 ${plan.popular ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                    <PlanBadge 
                      config={getPlanBadgeConfig(plan.key as "free" | "personal" | "family")} 
                      size="lg"
                      showLabel={true}
                    />
                  </div>
                  
                  <h3 className="text-2xl font-bold">{planName}</h3>
                  <p className="text-muted-foreground text-sm">{planDescription}</p>
                  
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{isYearly ? plan.priceYearly : plan.priceMonthly}</span>
                    <span className="text-muted-foreground mr-2">
                      {isYearly ? t('perYear') : t('perMonth')}
                    </span>
                    {isYearly && <div className="text-xs text-primary mt-1">{t('yearlySavings')}</div>}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-gradient-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-6">
                    {plan.key === "free" ? (
                      <Button 
                        variant={plan.popular ? "hero" : "outline"}
                        className="w-full"
                        size="lg"
                        onClick={() => navigate("/auth")}
                        aria-label={`${t('startFree')} - ${planName}`}
                      >
                        {t('startFree')}
                      </Button>
                    ) : (
                      <Button
                        variant={plan.popular ? "hero" : "outline"}
                        className="w-full"
                        size="lg"
                        onClick={async () => {
                          const { data: { session } } = await supabase.auth.getSession();
                          if (!session?.user) {
                            const params = new URLSearchParams({ startTrial: plan.key, redirectTo: "/dashboard" });
                            navigate(`/auth?${params.toString()}`);
                            return;
                          }
                          
                          if (!canStartTrial) {
                            toast({ 
                              title: t('toasts.trialExpired'), 
                              description: t('toasts.trialExpiredDesc'), 
                              variant: "default" 
                            });
                            return;
                          }
                          
                          const res = await startTrial(plan.key as any);
                          if ((res as any).error) {
                            const msg = (res as any).error === "trial_expired" 
                              ? t('toasts.trialExpiredFull')
                              : (res as any).error === "trial_exists" 
                              ? t('toasts.trialExists')
                              : (res as any).error;
                            toast({ 
                              title: t('toasts.cannotStartTrial'), 
                              description: msg, 
                              variant: "destructive" 
                            });
                          } else {
                            toast({ 
                              title: t('toasts.trialStarted'), 
                              description: t('toasts.trialDuration')
                            });
                            navigate("/dashboard");
                          }
                        }}
                        aria-label={`${canStartTrial ? t('startTrial') : t('subscribe')} - ${planName}`}
                      >
                        {canStartTrial ? t('startTrial') : t('subscribe')}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            {t('guarantee')}
          </p>
        </div>
      </div>
    </section>
  );
};