import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const PricingSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('pricing');

  return (
    <section id="pricing" className="py-12 px-4 bg-muted/50">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          {t('title')}
        </h2>
        <p className="text-lg text-muted-foreground mb-8">
          {t('subtitle')}
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Welcome Credits Card */}
          <Card className="bg-gradient-card border-0 shadow-card hover:shadow-elevated transition-all duration-300">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {t('welcome_bonus.title')}
              </h3>
              <div className="text-5xl font-bold text-primary mb-2">
                {t('welcome_bonus.amount')}
              </div>
              <p className="text-lg text-muted-foreground mb-2">
                {t('welcome_bonus.unit')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('welcome_bonus.description')}
              </p>
            </CardContent>
          </Card>

          {/* Daily Credits Card */}
          <Card className="bg-gradient-card border-0 shadow-card hover:shadow-elevated transition-all duration-300">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {t('daily_bonus.title')}
              </h3>
              <div className="text-5xl font-bold text-primary mb-2">
                {t('daily_bonus.amount')}
              </div>
              <p className="text-lg text-muted-foreground mb-2">
                {t('daily_bonus.unit')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('daily_bonus.description')}
              </p>
            </CardContent>
          </Card>
        </div>

        <Button 
          size="lg" 
          className="text-lg px-8 py-6"
          onClick={() => navigate('/auth')}
        >
          {t('cta')}
        </Button>
      </div>
    </section>
  );
};
