import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  ArrowLeft, 
  Info, 
  CreditCard, 
  Coins, 
  PlayCircle, 
  RefreshCw, 
  Building, 
  Mail, 
  AlertTriangle 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { SEO } from "@/components/SEO";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";

const RefundPolicy = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('refund');
  const { isRTL } = useLanguage();

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={t('seo.title')}
        description={t('seo.description')}
        canonical="https://diviso.app/refund-policy"
      />
      <AppHeader />
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
              <RefreshCw className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t('title')}
          </h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('last_updated')}: {t('last_updated_date')}
          </p>
        </div>

        <Card>
          <CardContent className="p-8 space-y-8">
            {/* Section 1: Service Overview */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Info className="h-4 w-4 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold">{t('sections.overview.title')}</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                <p className="text-foreground">{t('sections.overview.content')}</p>
                <p className="text-muted-foreground text-sm italic">{t('sections.overview.note')}</p>
              </div>
            </section>

            {/* Section 2: Subscriptions */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold">{t('sections.subscriptions.title')}</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                <p className="text-foreground">{t('sections.subscriptions.intro')}</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ps-4">
                  <li>{t('sections.subscriptions.items.cancel')}</li>
                  <li>{t('sections.subscriptions.items.auto_renew')}</li>
                  <li>{t('sections.subscriptions.items.access')}</li>
                  <li>{t('sections.subscriptions.items.no_refund')}</li>
                </ul>
              </div>
            </section>

            {/* Section 3: Credits */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                  <Coins className="h-4 w-4 text-yellow-600" />
                </div>
                <h2 className="text-xl font-semibold">{t('sections.credits.title')}</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                <p className="text-foreground">{t('sections.credits.intro')}</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ps-4">
                  <li>{t('sections.credits.items.non_refundable')}</li>
                  <li>{t('sections.credits.items.non_transferable')}</li>
                  <li>{t('sections.credits.items.no_withdraw')}</li>
                </ul>
              </div>
            </section>

            {/* Section 4: Rewarded Ads */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <PlayCircle className="h-4 w-4 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold">{t('sections.rewarded_ads.title')}</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                <p className="text-foreground">{t('sections.rewarded_ads.intro')}</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ps-4">
                  <li>{t('sections.rewarded_ads.items.no_payment')}</li>
                  <li>{t('sections.rewarded_ads.items.no_refund')}</li>
                </ul>
              </div>
            </section>

            {/* Section 5: Refund Requests */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <RefreshCw className="h-4 w-4 text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold">{t('sections.refund_requests.title')}</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                <p className="text-foreground">{t('sections.refund_requests.intro')}</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ps-4">
                  <li>{t('sections.refund_requests.items.timeframe')}</li>
                  <li>{t('sections.refund_requests.items.unused')}</li>
                  <li>{t('sections.refund_requests.items.process')}</li>
                </ul>
                <p className="text-muted-foreground text-sm italic mt-4">{t('sections.refund_requests.note')}</p>
              </div>
            </section>

            {/* Section 6: Payment Providers */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                  <Building className="h-4 w-4 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold">{t('sections.payment_providers.title')}</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg">
                <p className="text-muted-foreground">{t('sections.payment_providers.content')}</p>
              </div>
            </section>

            {/* Section 7: Contact */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900/20 rounded-lg flex items-center justify-center">
                  <Mail className="h-4 w-4 text-pink-600" />
                </div>
                <h2 className="text-xl font-semibold">{t('sections.contact.title')}</h2>
              </div>
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg">
                <p className="text-foreground mb-4">{t('sections.contact.intro')}</p>
                <p className="text-muted-foreground">{t('sections.contact.email')}</p>
              </div>
            </section>

            {/* Section 8: Disclaimer */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold">{t('sections.disclaimer.title')}</h2>
              </div>
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-6 rounded-lg">
                <p className="text-foreground">{t('sections.disclaimer.content')}</p>
              </div>
            </section>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button 
            onClick={() => navigate(-1)} 
            className="gap-2"
            size="lg"
          >
            <BackIcon className="h-4 w-4" />
            {t('back')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
