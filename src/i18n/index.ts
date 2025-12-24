import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import Arabic translations
import arCommon from './locales/ar/common.json';
import arSettings from './locales/ar/settings.json';

// Import English translations
import enCommon from './locales/en/common.json';
import enSettings from './locales/en/settings.json';

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
        settings: arSettings
      },
      en: {
        common: enCommon,
        settings: enSettings
      }
    },
    lng: getSavedLanguage(),
    fallbackLng: 'ar',
    defaultNS: 'common',
    ns: ['common', 'settings'],
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
