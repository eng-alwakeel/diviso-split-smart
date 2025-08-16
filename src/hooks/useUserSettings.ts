import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCurrencies } from "@/hooks/useCurrencies";

export interface UserSettings {
  language: string;
  currency: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  expenseReminders: boolean;
  weeklyReports: boolean;
  darkMode: boolean;
  twoFactorAuth: boolean;
}

export function useUserSettings() {
  const { toast } = useToast();
  const { formatCurrency } = useCurrencies();
  const [settings, setSettings] = useState<UserSettings>({
    language: "ar",
    currency: "SAR",
    emailNotifications: true,
    pushNotifications: true,
    expenseReminders: true,
    weeklyReports: false,
    darkMode: false,
    twoFactorAuth: false
  });
  const [loading, setLoading] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          language: data.language,
          currency: data.currency,
          emailNotifications: data.email_notifications,
          pushNotifications: data.push_notifications,
          expenseReminders: data.expense_reminders,
          weeklyReports: data.weekly_reports,
          darkMode: data.dark_mode,
          twoFactorAuth: data.two_factor_auth
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

  const saveSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('غير مصرح');

      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);

      // Try insert first, then update if it fails due to duplicate
      try {
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            language: updatedSettings.language,
            currency: updatedSettings.currency,
            email_notifications: updatedSettings.emailNotifications,
            push_notifications: updatedSettings.pushNotifications,
            expense_reminders: updatedSettings.expenseReminders,
            weekly_reports: updatedSettings.weeklyReports,
            dark_mode: updatedSettings.darkMode,
            two_factor_auth: updatedSettings.twoFactorAuth
          });

        // If insert fails due to duplicate key, update instead
        if (insertError && insertError.code === '23505') {
          const { error: updateError } = await supabase
            .from('user_settings')
            .update({
              language: updatedSettings.language,
              currency: updatedSettings.currency,
              email_notifications: updatedSettings.emailNotifications,
              push_notifications: updatedSettings.pushNotifications,
              expense_reminders: updatedSettings.expenseReminders,
              weekly_reports: updatedSettings.weeklyReports,
              dark_mode: updatedSettings.darkMode,
              two_factor_auth: updatedSettings.twoFactorAuth,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);
          
          if (updateError) throw updateError;
        } else if (insertError) {
          throw insertError;
        }
      } catch (err) {
        // Final fallback to simple upsert
        const { error: upsertError } = await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            language: updatedSettings.language,
            currency: updatedSettings.currency,
            email_notifications: updatedSettings.emailNotifications,
            push_notifications: updatedSettings.pushNotifications,
            expense_reminders: updatedSettings.expenseReminders,
            weekly_reports: updatedSettings.weeklyReports,
            dark_mode: updatedSettings.darkMode,
            two_factor_auth: updatedSettings.twoFactorAuth
          });
          
        if (upsertError) throw upsertError;
      }

      toast({
        title: "تم حفظ الإعدادات!",
        description: "تم تحديث إعدادات التطبيق بنجاح",
      });

    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ الإعدادات. حاول مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [settings, toast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    setSettings,
    saveSettings,
    loading,
    reload: loadSettings,
    formatCurrency
  };
}