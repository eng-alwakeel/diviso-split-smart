import { Button } from "@/components/ui/button";
import { UserPlus, Users, Receipt, ArrowRight, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export const QuickStartSection = () => {
  const { t, i18n } = useTranslation('landing');
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';

  const steps = [
    {
      number: 1,
      icon: UserPlus,
      titleKey: "quickStart.step1.title",
      descriptionKey: "quickStart.step1.description",
      color: "from-blue-500 to-blue-600",
    },
    {
      number: 2,
      icon: Users,
      titleKey: "quickStart.step2.title",
      descriptionKey: "quickStart.step2.description",
      color: "from-purple-500 to-purple-600",
    },
    {
      number: 3,
      icon: Receipt,
      titleKey: "quickStart.step3.title",
      descriptionKey: "quickStart.step3.description",
      color: "from-primary to-primary/80",
    },
  ];

  return (
    <section className="py-16 lg:py-20 bg-gradient-hero relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">{t('quickStart.badge')}</span>
          </div>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-3">
            {t('quickStart.title')}
          </h2>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            {t('quickStart.subtitle')}
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto mb-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative group"
              >
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className={`hidden md:block absolute top-10 ${isRTL ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2'} w-full h-0.5 bg-white/20`}>
                    <ArrowRight className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-1/2 rotate-180' : 'right-1/2'} text-white/40`} />
                  </div>
                )}

                {/* Card */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group-hover:scale-105">
                  {/* Icon */}
                  <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg mx-auto`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Number */}
                  <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{step.number}</span>
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-bold text-white text-center mb-2">
                    {t(step.titleKey)}
                  </h3>
                  <p className="text-sm text-white/70 text-center">
                    {t(step.descriptionKey)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            variant="secondary"
            size="lg"
            className="text-lg px-8 py-6 h-auto shadow-lg hover:shadow-xl transition-all"
            onClick={() => navigate('/auth')}
          >
            {t('quickStart.cta')}
            <ArrowRight className={`w-5 h-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
          </Button>
        </div>
      </div>
    </section>
  );
};
