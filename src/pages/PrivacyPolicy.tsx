import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Shield, Building2, Database, Share2, Lock, UserCheck, Scale } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { SEO } from "@/components/SEO";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('privacy');
  const { isRTL } = useLanguage();

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={t('seo.title')}
        description={t('seo.description')}
        canonical="https://diviso.app/privacy-policy"
      />
      <AppHeader />
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
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
                  <li>{t('sections.company_info.items.entity_type')}</li>
                  <li>{t('sections.company_info.items.cr_number')}</li>
                  <li>{t('sections.company_info.items.country')}</li>
                </ul>
              </div>
            </section>

            {/* Data Collection */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <Database className="h-4 w-4 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold">{t('sections.data_collection.title')}</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                <p className="text-foreground">{t('sections.data_collection.intro')}</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ps-4">
                  <li>{t('sections.data_collection.items.account')}</li>
                  <li>{t('sections.data_collection.items.subscriptions')}</li>
                  <li>{t('sections.data_collection.items.payments')}</li>
                  <li>{t('sections.data_collection.items.support')}</li>
                  <li>{t('sections.data_collection.items.experience')}</li>
                </ul>
                <p className="text-muted-foreground text-sm italic mt-4">{t('sections.data_collection.note')}</p>
              </div>
            </section>

            {/* Data Sharing */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Share2 className="h-4 w-4 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold">{t('sections.data_sharing.title')}</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                <p className="text-foreground">{t('sections.data_sharing.intro')}</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ps-4">
                  <li>{t('sections.data_sharing.items.payment_providers')}</li>
                  <li>{t('sections.data_sharing.items.tech_providers')}</li>
                </ul>
                <p className="text-muted-foreground text-sm italic mt-4">{t('sections.data_sharing.note')}</p>
              </div>
            </section>

            {/* Data Protection */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <Lock className="h-4 w-4 text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold">{t('sections.data_protection.title')}</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg">
                <p className="text-muted-foreground">
                  {t('sections.data_protection.content')}
                </p>
              </div>
            </section>

            {/* Your Rights */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/20 rounded-lg flex items-center justify-center">
                  <UserCheck className="h-4 w-4 text-teal-600" />
                </div>
                <h2 className="text-xl font-semibold">{t('sections.your_rights.title')}</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                <p className="text-foreground">{t('sections.your_rights.intro')}</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ps-4">
                  <li>{t('sections.your_rights.items.access')}</li>
                  <li>{t('sections.your_rights.items.modify')}</li>
                  <li>{t('sections.your_rights.items.cancel')}</li>
                </ul>
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
                <p className="text-muted-foreground">
                  {t('sections.governing_law.content')}
                </p>
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

export default PrivacyPolicy;
