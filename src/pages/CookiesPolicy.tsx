import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  ArrowLeft, 
  Cookie, 
  Info, 
  Shield, 
  BarChart3, 
  Megaphone, 
  Globe, 
  Settings, 
  Check, 
  RefreshCw, 
  Mail 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { SEO } from "@/components/SEO";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";

const CookiesPolicy = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('cookies');
  const { isRTL } = useLanguage();

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={t('seo.title')}
        description={t('seo.description')}
        canonical="https://diviso.app/cookies"
      />
      <AppHeader />
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
              <Cookie className="h-8 w-8 text-white" />
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
            {/* What are Cookies */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Info className="h-4 w-4 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold">{t('sections.what_are_cookies.title')}</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg">
                <p className="text-muted-foreground">{t('sections.what_are_cookies.content')}</p>
              </div>
            </section>

            {/* Types of Cookies */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <Cookie className="h-4 w-4 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold">{t('sections.types_of_cookies.title')}</h2>
              </div>
              
              {/* Essential Cookies */}
              <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">{t('sections.types_of_cookies.essential.title')}</h3>
                </div>
                <p className="text-muted-foreground">{t('sections.types_of_cookies.essential.content')}</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ps-4">
                  <li>{t('sections.types_of_cookies.essential.items.session')}</li>
                  <li>{t('sections.types_of_cookies.essential.items.preferences')}</li>
                  <li>{t('sections.types_of_cookies.essential.items.security')}</li>
                </ul>
              </div>

              {/* Analytics Cookies */}
              <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">{t('sections.types_of_cookies.analytics.title')}</h3>
                </div>
                <p className="text-muted-foreground">{t('sections.types_of_cookies.analytics.content')}</p>
              </div>

              {/* Advertising Cookies */}
              <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">{t('sections.types_of_cookies.advertising.title')}</h3>
                </div>
                <p className="text-muted-foreground">{t('sections.types_of_cookies.advertising.content')}</p>
              </div>
            </section>

            {/* Third Party Cookies */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Globe className="h-4 w-4 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold">{t('sections.third_party.title')}</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                <p className="text-foreground">{t('sections.third_party.content')}</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ps-4">
                  <li>{t('sections.third_party.items.google_adsense')}</li>
                  <li>{t('sections.third_party.items.analytics')}</li>
                </ul>
                <p className="text-muted-foreground text-sm italic mt-4">{t('sections.third_party.note')}</p>
              </div>
            </section>

            {/* Manage Cookies */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <Settings className="h-4 w-4 text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold">{t('sections.manage_cookies.title')}</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                <p className="text-foreground">{t('sections.manage_cookies.content')}</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ps-4">
                  <li>{t('sections.manage_cookies.items.browser')}</li>
                  <li>{t('sections.manage_cookies.items.app_settings')}</li>
                </ul>
                <p className="text-amber-600 dark:text-amber-400 text-sm mt-4">{t('sections.manage_cookies.warning')}</p>
              </div>
            </section>

            {/* Consent */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/20 rounded-lg flex items-center justify-center">
                  <Check className="h-4 w-4 text-teal-600" />
                </div>
                <h2 className="text-xl font-semibold">{t('sections.consent.title')}</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg">
                <p className="text-muted-foreground">{t('sections.consent.content')}</p>
              </div>
            </section>

            {/* Updates */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                  <RefreshCw className="h-4 w-4 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold">{t('sections.updates.title')}</h2>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg">
                <p className="text-muted-foreground">{t('sections.updates.content')}</p>
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

export default CookiesPolicy;
