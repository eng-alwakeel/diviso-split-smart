import { Button } from "@/components/ui/button";
import { Users, Receipt, CheckCircle, Shield, TrendingUp, ChevronDown, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AnimatedCounter } from "./landing/AnimatedCounter";
import { useEffect, useState } from "react";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import { useFoundingProgram } from "@/hooks/useFoundingProgram";

export const HeroSection = () => {
  const { t, i18n } = useTranslation('landing');
  const { trackClickCTA } = useGoogleAnalytics();
  const { remaining, isClosed } = useFoundingProgram();
  const isRTL = i18n.language === 'ar';
  const [showScrollArrow, setShowScrollArrow] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollArrow(window.scrollY < 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
            <h1 className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight mb-6">
              <span className="text-primary">Diviso</span> {t('hero.mainTitle')}
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
            <p className="text-lg md:text-xl text-white/80 mb-6 leading-relaxed max-w-xl mx-auto lg:mx-0">
              {t('hero.valueDesc')}
            </p>

            {/* Founding Program Banner - before CTA */}
            {!isClosed && (
              <div className="mb-4 bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/20 border border-amber-400/30 rounded-xl px-4 py-3 backdrop-blur-sm max-w-sm mx-auto lg:mx-0">
                <p className="text-sm font-medium text-amber-300 flex items-center justify-center lg:justify-start gap-2">
                  <span>⭐</span>
                  <span>{isRTL ? 'برنامج المستخدمين المؤسسين' : 'Founding Users Program'}</span>
                </p>
                <p className="text-xs text-amber-200/80 mt-1 text-center lg:text-start">
                  {isRTL 
                    ? `متبقي ${remaining} من 1000 مقعد`
                    : `${remaining} of 1000 spots remaining`
                  }
                </p>
              </div>
            )}

            {/* CTA Button with Glow Effect */}
            <div className="mb-8">
              <Button 
                variant="secondary" 
                size="lg" 
                className="text-lg px-8 py-6 h-auto relative overflow-hidden shadow-[0_0_30px_rgba(var(--primary-rgb),0.4)] hover:shadow-[0_0_50px_rgba(var(--primary-rgb),0.6)] hover:scale-105 transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700"
                onClick={() => {
                  trackClickCTA('start_free', 'hero_section');
                  window.location.href = '/dashboard';
                }}
              >
                {t('hero.startFree')}
              </Button>
            </div>

            {/* Security Badge */}
            <div className="flex items-center justify-center lg:justify-start gap-2">
              <div className="flex items-center gap-1.5 bg-green-500/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-green-500/30">
                <ShieldCheck className="w-4 h-4 text-green-400" />
                <span className="text-xs font-medium text-green-300">
                  {isRTL ? 'آمن 100%' : '100% Secure'}
                </span>
              </div>
            </div>
          </div>

          {/* Abstract Brand Art - Optimized for performance */}
          <div className={`relative ${isRTL ? 'lg:order-first' : 'lg:order-last'}`}>
            <div className="relative w-full max-w-md lg:max-w-lg mx-auto h-80 lg:h-[420px] xl:h-[480px] overflow-hidden">
              {/* Static gradient orbs - removed animate-pulse for better performance */}
              <div 
                className="absolute top-1/4 right-1/4 w-40 h-40 bg-gradient-to-br from-primary/60 to-primary/20 rounded-full blur-2xl"
                style={{ willChange: 'opacity' }}
              />
              
              {/* Medium gradient orb */}
              <div 
                className="absolute bottom-1/4 right-1/3 w-28 h-28 bg-gradient-to-tr from-primary/40 to-transparent rounded-full blur-xl"
              />
              
              {/* Small accent orb */}
              <div 
                className="absolute top-1/3 right-1/2 w-16 h-16 bg-primary/50 rounded-full blur-lg"
              />

              {/* Geometric shapes */}
              <div className="absolute top-10 right-10 w-16 h-16 border-2 border-primary/30 rounded-2xl rotate-12" />
              <div className="absolute bottom-20 right-16 w-12 h-12 border border-primary/20 rounded-xl -rotate-12" />
              <div className="absolute top-1/2 right-1/3 w-8 h-8 bg-primary/30 rounded-lg rotate-45" />
              
              {/* Glowing dots */}
              <div className="absolute top-16 right-1/4 w-3 h-3 bg-primary rounded-full shadow-lg shadow-primary/50" />
              <div className="absolute bottom-16 right-1/3 w-2 h-2 bg-primary rounded-full shadow-lg shadow-primary/50" />
              <div className="absolute top-1/2 right-16 w-4 h-4 bg-primary/80 rounded-full shadow-lg shadow-primary/50" />
              
              {/* Curved lines - SVG - static for performance */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400" aria-hidden="true">
                <path 
                  d="M50,200 Q150,100 200,200 T350,200" 
                  fill="none" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth="2" 
                  strokeOpacity="0.3"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8 max-w-5xl mx-auto mb-10">
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

        {/* Trust indicators with animated counters - min-height to prevent CLS */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-white/90 min-h-[48px]">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full hover:bg-white/20 hover:scale-105 transition-all duration-300 cursor-default h-10">
            <Users className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="text-sm font-medium whitespace-nowrap">
              +<AnimatedCounter end={10247} duration={2000} /> {t('hero.usersLabel')}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full hover:bg-white/20 hover:scale-105 transition-all duration-300 cursor-default h-10">
            <Receipt className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="text-sm font-medium whitespace-nowrap">
              +<AnimatedCounter end={45000} duration={2500} /> {t('hero.expensesLabel')}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full hover:bg-white/20 hover:scale-105 transition-all duration-300 cursor-default h-10">
            <TrendingUp className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="text-sm font-medium whitespace-nowrap">
              +<AnimatedCounter end={8500} duration={2200} /> {t('hero.groupsLabel')}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full hover:bg-white/20 hover:scale-105 transition-all duration-300 cursor-default h-10">
            <Shield className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="text-sm font-medium whitespace-nowrap">{t('hero.secure')}</span>
          </div>
        </div>
      </div>

      {/* Scroll Down Arrow - using CSS animation with will-change for performance */}
      {showScrollArrow && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <ChevronDown 
            className="w-8 h-8 text-white/60 animate-[bounce_2s_ease-in-out_infinite]" 
            style={{ willChange: 'transform' }}
          />
        </div>
      )}
    </section>
  );
};
