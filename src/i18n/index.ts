import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import Arabic translations
import arCommon from './locales/ar/common.json';
import arSettings from './locales/ar/settings.json';
import arAuth from './locales/ar/auth.json';
import arDashboard from './locales/ar/dashboard.json';
import arExpenses from './locales/ar/expenses.json';
import arGroups from './locales/ar/groups.json';
import arErrors from './locales/ar/errors.json';
import arFaq from './locales/ar/faq.json';
import arQuota from './locales/ar/quota.json';
import arNotifications from './locales/ar/notifications.json';
import arLanding from './locales/ar/landing.json';
import arPricing from './locales/ar/pricing.json';
import arRecommendations from './locales/ar/recommendations.json';
import arReferral from './locales/ar/referral.json';
import arBudget from './locales/ar/budget.json';
import arPrivacy from './locales/ar/privacy.json';
import arCredits from './locales/ar/credits.json';
import arSupport from './locales/ar/support.json';
import arBlog from './locales/ar/blog.json';
import arRefund from './locales/ar/refund.json';
import arTerms from './locales/ar/terms.json';
import arCookies from './locales/ar/cookies.json';
import arFounding from './locales/ar/founding.json';
import arDice from './locales/ar/dice.json';
import arInstall from './locales/ar/install.json';

// Import English translations
import enCommon from './locales/en/common.json';
import enSettings from './locales/en/settings.json';
import enAuth from './locales/en/auth.json';
import enDashboard from './locales/en/dashboard.json';
import enExpenses from './locales/en/expenses.json';
import enGroups from './locales/en/groups.json';
import enErrors from './locales/en/errors.json';
import enFaq from './locales/en/faq.json';
import enQuota from './locales/en/quota.json';
import enNotifications from './locales/en/notifications.json';
import enLanding from './locales/en/landing.json';
import enPricing from './locales/en/pricing.json';
import enRecommendations from './locales/en/recommendations.json';
import enReferral from './locales/en/referral.json';
import enBudget from './locales/en/budget.json';
import enPrivacy from './locales/en/privacy.json';
import enCredits from './locales/en/credits.json';
import enSupport from './locales/en/support.json';
import enBlog from './locales/en/blog.json';
import enRefund from './locales/en/refund.json';
import enTerms from './locales/en/terms.json';
import enCookies from './locales/en/cookies.json';
import enFounding from './locales/en/founding.json';
import enDice from './locales/en/dice.json';
import enInstall from './locales/en/install.json';

// Get saved language from localStorage or default to Arabic
const getSavedLanguage = (): string => {
  try {
    const saved = localStorage.getItem('app-language');
    if (saved && (saved === 'ar' || saved === 'en')) {
      return saved;
    }
  } catch (e) {
    console.error('Error reading language from localStorage:', e);
  }
  return 'ar';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ar: {
        common: arCommon,
        settings: arSettings,
        auth: arAuth,
        dashboard: arDashboard,
        expenses: arExpenses,
        groups: arGroups,
        errors: arErrors,
        faq: arFaq,
        quota: arQuota,
        notifications: arNotifications,
        landing: arLanding,
        pricing: arPricing,
        recommendations: arRecommendations,
        referral: arReferral,
        budget: arBudget,
        privacy: arPrivacy,
        credits: arCredits,
        support: arSupport,
        blog: arBlog,
        refund: arRefund,
        terms: arTerms,
        cookies: arCookies,
        founding: arFounding,
        dice: arDice,
        install: arInstall
      },
      en: {
        common: enCommon,
        settings: enSettings,
        auth: enAuth,
        dashboard: enDashboard,
        expenses: enExpenses,
        groups: enGroups,
        errors: enErrors,
        faq: enFaq,
        quota: enQuota,
        notifications: enNotifications,
        landing: enLanding,
        pricing: enPricing,
        recommendations: enRecommendations,
        referral: enReferral,
        budget: enBudget,
        privacy: enPrivacy,
        credits: enCredits,
        support: enSupport,
        blog: enBlog,
        refund: enRefund,
        terms: enTerms,
        cookies: enCookies,
        founding: enFounding,
        dice: enDice,
        install: enInstall
      }
    },
    lng: getSavedLanguage(),
    fallbackLng: 'ar',
    defaultNS: 'common',
    ns: ['common', 'settings', 'auth', 'dashboard', 'expenses', 'groups', 'errors', 'faq', 'quota', 'notifications', 'landing', 'pricing', 'recommendations', 'referral', 'budget', 'privacy', 'credits', 'support', 'blog', 'refund', 'terms', 'cookies', 'founding', 'dice', 'install'],
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

// Update document direction when language changes
i18n.on('languageChanged', (lng) => {
  const dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
  
  // Save to localStorage
  try {
    localStorage.setItem('app-language', lng);
  } catch (e) {
    console.error('Error saving language to localStorage:', e);
  }
});

// Set initial direction
const initialDir = getSavedLanguage() === 'ar' ? 'rtl' : 'ltr';
document.documentElement.dir = initialDir;
document.documentElement.lang = getSavedLanguage();

export default i18n;
