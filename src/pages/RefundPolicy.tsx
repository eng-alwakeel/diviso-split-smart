import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  Building2, 
  CreditCard, 
  Coins, 
  AlertTriangle, 
  Receipt, 
  Mail 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
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
      <Header />
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
            {/* Company Info */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold">{t('sections.company_info.title')}</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ps-4">
                  <li>{t('sections.company_info.items.legal_name')}</li>
                  <li>{t('sections.company_info.items.cr_number')}</li>
                  <li>{t('sections.company_info.items.vat_number')}</li>
                </ul>
              </div>
            </section>

            {/* Subscriptions */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold">{t('sections.subscriptions.title')}</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ps-4">
                  <li>{t('sections.subscriptions.items.cancel')}</li>
                  <li>{t('sections.subscriptions.items.auto_renew')}</li>
                  <li>{t('sections.subscriptions.items.no_refund')}</li>
                </ul>
              </div>
            </section>

            {/* Credits */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                  <Coins className="h-4 w-4 text-yellow-600" />
                </div>
                <h2 className="text-xl font-semibold">{t('sections.credits.title')}</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ps-4">
                  <li>{t('sections.credits.items.non_refundable')}</li>
                  <li>{t('sections.credits.items.no_refund_after_add')}</li>
                </ul>
              </div>
            </section>

            {/* Technical Errors */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold">{t('sections.technical_errors.title')}</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg">
                <p className="text-muted-foreground">{t('sections.technical_errors.content')}</p>
              </div>
            </section>

            {/* Tax Refunds */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Receipt className="h-4 w-4 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold">{t('sections.tax_refunds.title')}</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg">
                <p className="text-muted-foreground">{t('sections.tax_refunds.content')}</p>
              </div>
            </section>

            {/* Contact */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900/20 rounded-lg flex items-center justify-center">
                  <Mail className="h-4 w-4 text-pink-600" />
                </div>
                <h2 className="text-xl font-semibold">{t('sections.contact.title')}</h2>
              </div>
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg">
                <p className="text-muted-foreground">{t('sections.contact.content')}</p>
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
