import { useState, useEffect } from "react";
import { Users, Receipt, CheckCircle, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Step {
  id: number;
  icon: React.ElementType;
  titleKey: string;
  descriptionKey: string;
}

const steps: Step[] = [
  {
    id: 1,
    icon: Users,
    titleKey: "animatedHowItWorks.step1.title",
    descriptionKey: "animatedHowItWorks.step1.description",
  },
  {
    id: 2,
    icon: Receipt,
    titleKey: "animatedHowItWorks.step2.title",
    descriptionKey: "animatedHowItWorks.step2.description",
  },
  {
    id: 3,
    icon: CheckCircle,
    titleKey: "animatedHowItWorks.step3.title",
    descriptionKey: "animatedHowItWorks.step3.description",
  },
];

export const AnimatedHowItWorks = () => {
  const { t, i18n } = useTranslation('landing');
  const isRTL = i18n.language === 'ar';
  const [activeStep, setActiveStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setActiveStep((prev) => (prev + 1) % steps.length);
        setIsAnimating(false);
      }, 300);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const currentStep = steps[activeStep];
  const Icon = currentStep.icon;

  return (
    <section className="py-16 lg:py-20 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10 lg:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
            {t('animatedHowItWorks.title')}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t('animatedHowItWorks.subtitle')}
          </p>
        </div>

        {/* Main Content - Side by side on desktop */}
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Phone Mockup */}
            <div className={`${isRTL ? 'lg:order-last' : 'lg:order-first'}`}>
              <div className="max-w-sm mx-auto lg:max-w-md">
                <div className="relative bg-gradient-to-br from-muted to-muted/50 rounded-[2.5rem] p-3 shadow-2xl">
                  {/* Phone Frame */}
                  <div className="bg-card rounded-[2rem] overflow-hidden border border-border">
                    {/* Status Bar */}
                    <div className="bg-muted/50 px-6 py-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">9:41</span>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-2 bg-muted-foreground/50 rounded-sm" />
                        <div className="w-4 h-2 bg-muted-foreground/50 rounded-sm" />
                        <div className="w-6 h-3 bg-primary/50 rounded-sm" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 min-h-[300px] lg:min-h-[350px] flex flex-col items-center justify-center">
                      <div
                        className={`transition-all duration-300 flex flex-col items-center ${
                          isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"
                        }`}
                      >
                        {/* Icon */}
                        <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                          <Icon className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
                        </div>

                        {/* Step Number */}
                        <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
                          {t('animatedHowItWorks.stepLabel')} {currentStep.id}
                        </span>

                        {/* Title */}
                        <h3 className="text-xl lg:text-2xl font-bold text-center mb-2">
                          {t(currentStep.titleKey)}
                        </h3>

                        {/* Description */}
                        <p className="text-sm lg:text-base text-muted-foreground text-center">
                          {t(currentStep.descriptionKey)}
                        </p>
                      </div>
                    </div>

                    {/* Home Indicator */}
                    <div className="pb-2 flex justify-center">
                      <div className="w-32 h-1 bg-muted-foreground/30 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Steps List - Desktop only */}
            <div className={`hidden lg:flex flex-col gap-4 ${isRTL ? 'lg:order-first' : 'lg:order-last'}`}>
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = index === activeStep;
                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(index)}
                    className={`flex items-start gap-4 p-5 rounded-2xl transition-all duration-300 text-right ${
                      isActive 
                        ? "bg-primary/10 border-2 border-primary shadow-lg" 
                        : "bg-muted/50 border-2 border-transparent hover:bg-muted"
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isActive ? "bg-primary text-white" : "bg-muted-foreground/20"
                    }`}>
                      <StepIcon className="w-7 h-7" />
                    </div>
                    <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          isActive ? "bg-primary/20 text-primary" : "bg-muted-foreground/20 text-muted-foreground"
                        }`}>
                          {t('animatedHowItWorks.stepLabel')} {step.id}
                        </span>
                      </div>
                      <h4 className={`font-bold text-lg mb-1 ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                        {t(step.titleKey)}
                      </h4>
                      <p className={`text-sm ${isActive ? "text-muted-foreground" : "text-muted-foreground/70"}`}>
                        {t(step.descriptionKey)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile Step Indicators */}
          <div className="flex items-center justify-center gap-4 mt-8 lg:hidden">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(index)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                  index === activeStep
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <step.icon className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">
                  {t(step.titleKey)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
