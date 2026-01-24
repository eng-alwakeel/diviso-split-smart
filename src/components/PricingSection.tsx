import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Calendar, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";

export const PricingSection = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('pricing');
  const { trackClickCTA } = useGoogleAnalytics();
  const isRTL = i18n.language === 'ar';

  return (
    <section id="pricing" className="py-16 lg:py-20 px-4 bg-muted/50" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
          {t('title')}
        </h2>
        <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
          {t('subtitle')}
        </p>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-10">
          {/* Welcome Credits Card */}
          <Card className="bg-gradient-card border-0 shadow-card hover:shadow-elevated transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {t('welcome_bonus.title')}
              </h3>
              <div className="text-4xl font-bold text-primary mb-2">
                {t('welcome_bonus.amount')}
              </div>
              <p className="text-md text-muted-foreground mb-2">
                {t('welcome_bonus.unit')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('welcome_bonus.description')}
              </p>
            </CardContent>
          </Card>

          {/* Daily Credits Card */}
          <Card className="bg-gradient-card border-0 shadow-card hover:shadow-elevated transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {t('daily_bonus.title')}
              </h3>
              <div className="text-4xl font-bold text-primary mb-2">
                {t('daily_bonus.amount')}
              </div>
              <p className="text-md text-muted-foreground mb-2">
                {t('daily_bonus.unit')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('daily_bonus.description')}
              </p>
            </CardContent>
          </Card>

          {/* Referral Credits Card */}
          <Card className="bg-gradient-card border-0 shadow-card hover:shadow-elevated transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {t('referral_bonus.title')}
              </h3>
              <div className="text-4xl font-bold text-primary mb-2">
                {t('referral_bonus.amount')}
              </div>
              <p className="text-md text-muted-foreground mb-2">
                {t('referral_bonus.unit')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('referral_bonus.description')}
              </p>
            </CardContent>
          </Card>
        </div>

        <Button 
          size="lg" 
          className="text-lg px-8 py-6"
          onClick={() => {
            trackClickCTA('start_free', 'pricing_section');
            navigate('/auth');
          }}
        >
          {t('cta')}
        </Button>
      </div>
    </section>
  );
};
