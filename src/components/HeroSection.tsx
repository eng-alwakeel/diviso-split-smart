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

          {/* Abstract Brand Art */}
          <div className={`relative ${isRTL ? 'lg:order-first' : 'lg:order-last'}`}>
            <div className="relative w-full max-w-md mx-auto h-80 lg:h-96">
              {/* Large gradient orb - primary */}
              <div className="absolute top-1/4 right-1/4 w-48 h-48 bg-gradient-to-br from-primary/60 to-primary/20 rounded-full blur-2xl animate-pulse" />
              
              {/* Medium gradient orb */}
              <div className="absolute bottom-1/4 left-1/4 w-32 h-32 bg-gradient-to-tr from-primary/40 to-transparent rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
              
              {/* Small accent orb */}
              <div className="absolute top-1/3 left-1/3 w-20 h-20 bg-primary/50 rounded-full blur-lg animate-pulse" style={{ animationDelay: '2s' }} />

              {/* Geometric shapes */}
              <div className="absolute top-10 right-10 w-16 h-16 border-2 border-primary/30 rounded-2xl rotate-12" />
              <div className="absolute bottom-20 right-20 w-12 h-12 border border-primary/20 rounded-xl -rotate-12" />
              <div className="absolute top-1/2 left-10 w-8 h-8 bg-primary/30 rounded-lg rotate-45" />
              
              {/* Glowing dots */}
              <div className="absolute top-16 left-1/4 w-3 h-3 bg-primary rounded-full shadow-lg shadow-primary/50" />
              <div className="absolute bottom-16 right-1/3 w-2 h-2 bg-primary rounded-full shadow-lg shadow-primary/50" />
              <div className="absolute top-1/2 right-16 w-4 h-4 bg-primary/80 rounded-full shadow-lg shadow-primary/50" />
              
              {/* Curved lines - SVG */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
                <path 
                  d="M50,200 Q150,100 200,200 T350,200" 
                  fill="none" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth="2" 
                  strokeOpacity="0.3"
                  className="animate-pulse"
                />
                <path 
                  d="M100,300 Q200,200 250,300 T400,300" 
                  fill="none" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth="1.5" 
                  strokeOpacity="0.2"
                />
              </svg>

              {/* Center icon cluster */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary/40 to-primary/10 rounded-3xl backdrop-blur-sm border border-primary/20 flex items-center justify-center">
                    <Users className="w-10 h-10 text-primary" />
                  </div>
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-primary/20 backdrop-blur-sm rounded-xl border border-primary/30 flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-primary" />
                  </div>
                  <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-primary/20 backdrop-blur-sm rounded-xl border border-primary/30 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                </div>
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
