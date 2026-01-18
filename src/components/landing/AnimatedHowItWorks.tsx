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
  const { t } = useTranslation('landing');
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
    <section className="py-16 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            {t('animatedHowItWorks.title')}
          </h2>
          <p className="text-muted-foreground">
            {t('animatedHowItWorks.subtitle')}
          </p>
        </div>

        {/* Phone Mockup */}
        <div className="max-w-sm mx-auto">
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
              <div className="p-8 min-h-[300px] flex flex-col items-center justify-center">
                <div
                  className={`transition-all duration-300 flex flex-col items-center ${
                    isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"
                  }`}
                >
                  {/* Icon */}
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <Icon className="w-10 h-10 text-white" />
                  </div>

                  {/* Step Number */}
                  <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
                    {t('animatedHowItWorks.stepLabel')} {currentStep.id}
                  </span>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-center mb-2">
                    {t(currentStep.titleKey)}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground text-center">
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

          {/* Step Indicators */}
          <div className="flex items-center justify-center gap-4 mt-8">
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
                {index < steps.length - 1 && (
                  <ArrowRight className="w-4 h-4 hidden sm:inline text-muted-foreground/50 absolute -right-6" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
