import { Button } from "@/components/ui/button";
import { Users, Receipt, CheckCircle, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

export const HeroSection = () => {
  const { t, i18n } = useTranslation('landing');
  const isRTL = i18n.language === 'ar';

  const steps = [
    {
      number: 1,
      icon: Users,
      title: t('hero.steps.step1'),
    },
    {
      number: 2,
      icon: Receipt,
      title: t('hero.steps.step2'),
    },
    {
      number: 3,
      icon: CheckCircle,
      title: t('hero.steps.step3'),
    },
  ];

  return (
    <section className="relative min-h-[90vh] flex items-center bg-gradient-hero overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="container mx-auto px-4 relative py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-12">
          {/* Text Content */}
          <div className={`text-center ${isRTL ? 'lg:text-right lg:order-last' : 'lg:text-left lg:order-first'}`}>
            {/* Main Title */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              {t('hero.mainTitle')}
            </h1>
            
            {/* Use Cases Line */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 md:gap-4 mb-6">
              {['travel', 'housing', 'friends', 'activities', 'camping'].map((useCase, index) => (
                <span key={useCase} className="flex items-center">
                  <span className="text-base md:text-lg text-white/90 font-medium">
                    {t(`hero.useCases.${useCase}`)}
                  </span>
                  {index < 4 && (
                    <span className="text-white/50 mx-2 md:mx-3">•</span>
                  )}
                </span>
              ))}
            </div>

            {/* Value Description */}
            <p className="text-lg md:text-xl text-white/80 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
              {t('hero.valueDesc')}
            </p>

            {/* CTA Button */}
            <div className="mb-8">
              <Button 
                variant="secondary" 
                size="lg" 
                className="text-lg px-8 py-6 h-auto"
                onClick={() => window.location.href = '/dashboard'}
              >
                {t('hero.startFree')}
              </Button>
            </div>
          </div>

          {/* Visual Design - Glass Cards */}
          <div className={`relative ${isRTL ? 'lg:order-first' : 'lg:order-last'}`}>
            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            
            {/* Glass cards grid */}
            <div className="relative grid grid-cols-2 gap-4 p-4 max-w-md mx-auto">
              <div className="bg-white/5 backdrop-blur-sm border border-primary/20 rounded-2xl p-6 text-center hover:bg-white/10 transition-colors">
                <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-7 h-7 text-primary" />
                </div>
                <span className="text-white/90 text-sm font-medium">{t('hero.cards.createGroup', 'أنشئ قروب')}</span>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-primary/20 rounded-2xl p-6 text-center hover:bg-white/10 transition-colors">
                <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Receipt className="w-7 h-7 text-primary" />
                </div>
                <span className="text-white/90 text-sm font-medium">{t('hero.cards.addExpenses', 'أضف المصاريف')}</span>
              </div>
              <div className="col-span-2 bg-white/5 backdrop-blur-sm border border-primary/20 rounded-2xl p-6 text-center hover:bg-white/10 transition-colors">
                <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-7 h-7 text-primary" />
                </div>
                <span className="text-white/90 text-sm font-medium">{t('hero.cards.everyoneKnows', 'كل شخص يعرف عليه كم')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Steps - How it works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-10">
          {steps.map((step) => (
            <div 
              key={step.number}
              className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-white">{step.number}</span>
              </div>
              <div className={`flex items-center gap-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                <step.icon className="w-5 h-5 text-white/80 flex-shrink-0" />
                <span className="text-sm md:text-base text-white font-medium leading-tight">
                  {step.title}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Trust indicators */}
        <div className="flex items-center justify-center gap-6 text-white/70">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span className="text-sm">{t('hero.secure')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <span className="text-sm">{t('hero.users')}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
