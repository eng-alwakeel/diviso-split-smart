import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  Calculator, 
  Brain, 
  PieChart, 
  Camera,
  MessageCircle,
  Gem,
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
      icon: Gem,
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
    <section 
      id="features" 
      className="py-12 bg-muted/50"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 600px' }}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
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
              <Card 
                key={index} 
                className="bg-gradient-card shadow-card hover:shadow-elevated transition-all duration-300 border-0 group hover:scale-[1.02] hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
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

      </div>
    </section>
  );
};