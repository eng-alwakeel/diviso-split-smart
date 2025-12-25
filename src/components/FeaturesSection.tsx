import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  Calculator, 
  Brain, 
  PieChart, 
  Camera,
  MessageCircle,
  Gift,
  Shield
} from "lucide-react";
import { useTranslation } from "react-i18next";

export const FeaturesSection = () => {
  const { t } = useTranslation('landing');

  const features = [
    {
      icon: Users,
      title: t('features.groups.title'),
      description: t('features.groups.description')
    },
    {
      icon: Calculator,
      title: t('features.smartSplit.title'),
      description: t('features.smartSplit.description')
    },
    {
      icon: Brain,
      title: t('features.ai.title'),
      description: t('features.ai.description')
    },
    {
      icon: Camera,
      title: t('features.receiptScan.title'),
      description: t('features.receiptScan.description')
    },
    {
      icon: PieChart,
      title: t('features.reports.title'),
      description: t('features.reports.description')
    },
    {
      icon: MessageCircle,
      title: t('features.chat.title'),
      description: t('features.chat.description')
    },
    {
      icon: Gift,
      title: t('features.referral.title'),
      description: t('features.referral.description')
    },
    {
      icon: Shield,
      title: t('features.security.title'),
      description: t('features.security.description')
    }
  ];

  return (
    <section id="features" className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('features.title')}
            <span className="bg-gradient-primary bg-clip-text text-transparent"> {t('features.titleHighlight')}</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="bg-gradient-card shadow-card hover:shadow-elevated transition-all duration-300 border-0">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-gradient-hero rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">{t('features.cta.title')}</h3>
            <p className="text-muted-foreground mb-6">
              {t('features.cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-primary px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                {t('features.cta.startFree')}
              </button>
              <button className="border border-white/20 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors">
                {t('features.cta.downloadApp')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};