import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (lang: string) => Promise<void>;
  isRTL: boolean;
  isChanging: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n, t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'ar');
  const [isChanging, setIsChanging] = useState(false);

  // Load language from user settings on mount
  useEffect(() => {
    const loadUserLanguage = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('user_settings')
            .select('language')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (data?.language && data.language !== i18n.language) {
            await i18n.changeLanguage(data.language);
            setCurrentLanguage(data.language);
          }
        }
      } catch (error) {
        console.error('Error loading user language:', error);
      }
    };

    loadUserLanguage();
  }, [i18n]);

  // Update state when i18n language changes
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const changeLanguage = async (lang: string) => {
    const previousLanguage = currentLanguage;
    setIsChanging(true);
    
    try {
      // Change i18n language first
      await i18n.changeLanguage(lang);
      setCurrentLanguage(lang);

      // Save to localStorage
      localStorage.setItem('i18nextLng', lang);

      // Update user settings in database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check if settings exist
        const { data: existingSettings } = await supabase
          .from('user_settings')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingSettings) {
          // Update existing settings
          const { error } = await supabase
            .from('user_settings')
            .update({ 
              language: lang, 
              updated_at: new Date().toISOString() 
            })
            .eq('user_id', user.id);
          
          if (error) throw error;
        } else {
          // Insert new settings with all required fields
          const { error } = await supabase
            .from('user_settings')
            .insert({
              user_id: user.id,
              language: lang,
              currency: 'SAR',
              email_notifications: true,
              push_notifications: true,
              expense_reminders: true,
              weekly_reports: false,
              dark_mode: false,
              two_factor_auth: false
            });
          
          if (error) throw error;
        }
      }

      // Show success toast
      toast.success(lang === 'ar' ? 'تم تغيير اللغة بنجاح' : 'Language changed successfully');
      
    } catch (error) {
      console.error('Error changing language:', error);
      // Revert to previous language on error
      await i18n.changeLanguage(previousLanguage);
      setCurrentLanguage(previousLanguage);
      localStorage.setItem('i18nextLng', previousLanguage);
      
      toast.error(previousLanguage === 'ar' ? 'فشل تغيير اللغة' : 'Failed to change language');
    } finally {
      setIsChanging(false);
    }
  };

  const isRTL = currentLanguage === 'ar';

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage, isRTL, isChanging }}>
      {children}
    </LanguageContext.Provider>
  );
};
