import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  ArrowLeft, 
  FileText, 
  Building2, 
  Globe, 
  CreditCard, 
  Receipt, 
  UserCheck, 
  AlertTriangle, 
  Edit, 
  Scale 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { SEO } from "@/components/SEO";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";

const TermsConditions = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('terms');
  const { isRTL } = useLanguage();

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={t('seo.title')}
        description={t('seo.description')}
        canonical="https://diviso.app/terms"
      />
      <Header />
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
              <FileText className="h-8 w-8 text-white" />
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
                <p className="text-foreground">{t('sections.company_info.intro')}</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ps-4">
                  <li>{t('sections.company_info.items.legal_name')}</li>
                  <li>{t('sections.company_info.items.cr_number')}</li>
                  <li>{t('sections.company_info.items.vat_number')}</li>
                  <li>{t('sections.company_info.items.country')}</li>
                </ul>
              </div>
            </section>

            {/* Service Nature */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <Globe className="h-4 w-4 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold">{t('sections.service_nature.title')}</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                <p className="text-foreground">{t('sections.service_nature.content')}</p>
                <p className="text-muted-foreground text-sm italic">{t('sections.service_nature.note')}</p>
              </div>
            </section>

            {/* Subscriptions & Payment */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold">{t('sections.subscriptions_payment.title')}</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ps-4">
                  <li>{t('sections.subscriptions_payment.items.prices_display')}</li>
                  <li>{t('sections.subscriptions_payment.items.paid_services')}</li>
                  <li>{t('sections.subscriptions_payment.items.vat')}</li>
                </ul>
              </div>
            </section>

            {/* Invoicing */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                  <Receipt className="h-4 w-4 text-yellow-600" />
                </div>
                <h2 className="text-xl font-semibold">{t('sections.invoicing.title')}</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ps-4">
                  <li>{t('sections.invoicing.items.invoice_issued')}</li>
                  <li>{t('sections.invoicing.items.approved_system')}</li>
                </ul>
              </div>
            </section>

            {/* Service Usage */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/20 rounded-lg flex items-center justify-center">
                  <UserCheck className="h-4 w-4 text-teal-600" />
                </div>
                <h2 className="text-xl font-semibold">{t('sections.service_usage.title')}</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                <p className="text-foreground">{t('sections.service_usage.intro')}</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ps-4">
                  <li>{t('sections.service_usage.items.lawful_use')}</li>
                  <li>{t('sections.service_usage.items.no_misuse')}</li>
                </ul>
              </div>
            </section>

            {/* Liability */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold">{t('sections.liability.title')}</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                <p className="text-foreground">{t('sections.liability.intro')}</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ps-4">
                  <li>{t('sections.liability.items.user_errors')}</li>
                  <li>{t('sections.liability.items.external_disputes')}</li>
                </ul>
              </div>
            </section>

            {/* Amendments */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900/20 rounded-lg flex items-center justify-center">
                  <Edit className="h-4 w-4 text-pink-600" />
                </div>
                <h2 className="text-xl font-semibold">{t('sections.amendments.title')}</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg">
                <p className="text-muted-foreground">{t('sections.amendments.content')}</p>
              </div>
            </section>

            {/* Governing Law */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                  <Scale className="h-4 w-4 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold">{t('sections.governing_law.title')}</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg">
                <p className="text-muted-foreground">{t('sections.governing_law.content')}</p>
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

export default TermsConditions;
