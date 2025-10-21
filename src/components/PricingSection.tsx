import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Star, Users, User } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { useLifetimeOffer } from "@/hooks/useLifetimeOffer";
import { useEffect } from "react";
import { PlanBadge } from "@/components/ui/plan-badge";
import { usePlanBadge } from "@/hooks/usePlanBadge";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "مجاني",
    icon: User,
    priceMonthly: "0",
    priceYearly: "0",
    description: "مثالي للاستخدام الشخصي البسيط",
    features: [
      "حتى 3 مجموعات نشطة",
      "حد أقصى 5 أشخاص في المجموعة الواحدة",
      "إضافة وتتبع المصاريف (50 شهرياً)",
      "رفع الإيصالات (10 شهرياً)",
      "إنشاء روابط دعوة (حد أقصى 4 أشخاص)",
      "تقسيم بالتساوي",
      "تقارير شهرية (5 تقارير)",
      "حفظ البيانات (6 أشهر)",
      "دعم عبر البريد الإلكتروني"
    ],
    buttonText: "ابدأ مجاناً",
    popular: false
  },
  {
    name: "شخصي",
    icon: Star,
    priceMonthly: "19",
    priceYearly: "190",
    description: "للأفراد والعائلات النشطة",
    features: [
      "عدد غير محدود من المجموعات",
      "عدد غير محدود من الأعضاء في المجموعة",
      "تقسيم متقدم (نسب ومبالغ)",
      "مسح الإيصالات بالذكاء الاصطناعي",
      "تحليلات وتوصيات ذكية",
      "دردشة المجموعة",
      "تصدير التقارير",
      "دعم أولوية"
    ],
    buttonText: "اشترك الآن",
    popular: true
  },
  {
    name: "العائلية",
    icon: Users,
    priceMonthly: "75",
    priceYearly: "750",
    description: "للعائلات والمجموعات الصغيرة",
    features: [
      "جميع مزايا الباقة الشخصية",
      "حتى 5 أعضاء في المجموعة",
      "حدود مشتركة وسياسات إنفاق",
      "تقارير للعائلة/المجموعة",
      "موافقة على المصاريف",
      "دعم أولوية"
    ],
    buttonText: "اشترك الآن",
    popular: false
  },
  {
    name: "مدى الحياة",
    icon: Star,
    priceMonthly: "350",
    priceYearly: "350",
    description: "🔥 عرض خاص محدود - أول 100 شخص فقط",
    features: [
      "عدد غير محدود من المجموعات",
      "عدد غير محدود من الأعضاء",
      "تقسيم متقدم (نسب ومبالغ)",
      "مسح الإيصالات بالذكاء الاصطناعي",
      "تحليلات وتوصيات ذكية",
      "دردشة المجموعة",
      "تصدير التقارير",
      "دعم أولوية مدى الحياة"
    ],
    buttonText: "اشترك مدى الحياة",
    popular: false,
    isLifetime: true
  }
];

export const PricingSection = () => {
  const [isYearly, setIsYearly] = useState(false);
  const { startTrial, canStartTrial, subscription } = useSubscription();
  const { toast } = useToast();
  const { available: lifetimeAvailable, remaining: lifetimeRemaining, loading: lifetimeLoading } = useLifetimeOffer();
  const { getPlanBadgeConfig } = usePlanBadge();
  const navigate = useNavigate();

  // تمت إزالة معالجة joinToken من هنا - يتم التعامل معها في InviteRoute الآن

  return (
    <section id="pricing" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            اختر الباقة 
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            باقات مرنة تناسب احتياجاتك، من الاستخدام الشخصي إلى إدارة الشركات
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
              شهري
            </Button>
            <Button
              variant={isYearly ? "default" : "ghost"}
              size="sm"
              onClick={() => setIsYearly(true)}
              className={isYearly ? "shadow-elevated" : ""}
              aria-pressed={isYearly}
            >
              سنوي <span className="ml-2 text-xs text-primary">وفر 20%</span>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {plans.filter(plan => !plan.isLifetime || lifetimeAvailable).map((plan, index) => {
            const Icon = plan.icon;
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
                      الأكثر شعبية
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
                      config={getPlanBadgeConfig(
                        plan.name === "مجاني" ? "free" : 
                        plan.name === "شخصي" ? "personal" : 
                        plan.name === "العائلية" ? "family" : "lifetime"
                      )} 
                      size="lg"
                      showLabel={true}
                    />
                  </div>
                  
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm">{plan.description}</p>
                  
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{plan.isLifetime ? plan.priceMonthly : (isYearly ? plan.priceYearly : plan.priceMonthly)}</span>
                      <span className="text-muted-foreground mr-2">
                        {plan.isLifetime ? "ريال مرة واحدة" : (isYearly ? "ريال/سنوياً" : "ريال/شهرياً")}
                      </span>
                      {isYearly && !plan.isLifetime && <div className="text-xs text-primary mt-1">توفير 20% سنوياً</div>}
                      {plan.isLifetime && (
                        <div className="space-y-1">
                          <div className="text-xs text-orange-500 font-medium">🔥 عرض محدود الوقت</div>
                          {!lifetimeLoading && (
                            <div className="text-xs text-destructive font-medium">
                              متبقي {lifetimeRemaining} من 100 فقط!
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-gradient-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm">{feature || "الاشتراك"}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-6">
                    {plan.name === "مجاني" ? (
                      <Button 
                        variant={plan.popular ? "hero" : "outline"}
                        className="w-full"
                        size="lg"
                        onClick={() => navigate("/auth")}
                        aria-label={`البدء في خطة ${plan.name}`}
                      >
                        ابدأ مجاناً
                      </Button>
                    ) : plan.isLifetime ? (
                      <Button
                        variant={plan.popular ? "hero" : "outline"}
                        className="w-full"
                        size="lg"
                        onClick={async () => {
                          const { data: { session } } = await supabase.auth.getSession();
                          if (!session?.user) {
                            const params = new URLSearchParams({ startTrial: "lifetime", redirectTo: "/dashboard" });
                            navigate(`/auth?${params.toString()}`);
                            return;
                          }
                          
                          // Check if lifetime offer is still available
                          if (!lifetimeAvailable || lifetimeRemaining <= 0) {
                            toast({ 
                              title: "العرض منتهي", 
                              description: "نأسف، لقد انتهى العرض المحدود لـ 100 شخص فقط", 
                              variant: "destructive" 
                            });
                            return;
                          }
                          // Handle lifetime plan - redirect to payment
                          toast({ title: "إعادة توجيه", description: "جاري إعداد صفحة الدفع..." });
                          // This will be implemented later with payment integration
                        }}
                        aria-label={`${plan.buttonText} لخطة ${plan.name}`}
                      >
                        {plan.buttonText}
                      </Button>
                    ) : (
                      <Button
                        variant={plan.popular ? "hero" : "outline"}
                        className="w-full"
                        size="lg"
                        onClick={async () => {
                          let planKey = "personal";
                          if (plan.name === "العائلية") planKey = "family";
                          
                          const { data: { session } } = await supabase.auth.getSession();
                          if (!session?.user) {
                            const params = new URLSearchParams({ startTrial: planKey, redirectTo: "/dashboard" });
                            navigate(`/auth?${params.toString()}`);
                            return;
                          }
                          
                          // إذا انتهت التجربة، أظهر رسالة واضحة
                          if (!canStartTrial) {
                            toast({ 
                              title: "انتهت فترة التجربة المجانية", 
                              description: "يرجى الاشتراك في الباقة للاستمرار في استخدام المزايا المتقدمة", 
                              variant: "default" 
                            });
                            // TODO: إضافة رابط صفحة الدفع لاحقاً
                            return;
                          }
                          
                          // بدء التجربة المجانية
                          const res = await startTrial(planKey as any);
                          if ((res as any).error) {
                            const msg = (res as any).error === "trial_expired" 
                              ? "لقد استنفدت أيام التجربة المجانية. يرجى الاشتراك للاستمرار." 
                              : (res as any).error === "trial_exists" 
                              ? "لديك تجربة سابقة أو نشطة." 
                              : (res as any).error;
                            toast({ 
                              title: "لا يمكن بدء التجربة", 
                              description: msg, 
                              variant: "destructive" 
                            });
                          } else {
                            toast({ 
                              title: "بدأت التجربة المجانية", 
                              description: "صالحة لمدة ٧ أيام" 
                            });
                            navigate("/dashboard");
                          }
                        }}
                        aria-label={`${canStartTrial ? 'ابدأ تجربة ٧ أيام' : 'اشترك الآن'} لخطة ${plan.name}`}
                      >
                        {canStartTrial ? "ابدأ تجربة ٧ أيام" : "اشترك الآن"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Money back guarantee */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            ضمان استرداد المال خلال 30 يوماً • بدون رسوم إعداد • إلغاء في أي وقت
          </p>
        </div>
      </div>
    </section>
  );
};
