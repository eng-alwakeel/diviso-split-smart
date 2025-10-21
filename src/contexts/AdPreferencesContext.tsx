import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdPreferences {
  show_ads: boolean;
  preferred_categories: string[];
  blocked_categories: string[];
  max_ads_per_session: number;
  personalized_ads: boolean;
}

interface AdPreferencesContextType {
  preferences: AdPreferences | null;
  loading: boolean;
  updatePreferences: (newPrefs: Partial<AdPreferences>) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const AdPreferencesContext = createContext<AdPreferencesContextType | undefined>(undefined);

export function AdPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<AdPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPreferences = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_ad_preferences')
        .select('show_ads, preferred_categories, blocked_categories, max_ads_per_session, personalized_ads')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading ad preferences:', error);
        // Set default preferences
        setPreferences({
          show_ads: true,
          preferred_categories: [],
          blocked_categories: [],
          max_ads_per_session: 5,
          personalized_ads: true
        });
      } else if (data) {
        setPreferences(data);
      } else {
        // Create default preferences
        const defaultPrefs = {
          show_ads: true,
          preferred_categories: [],
          blocked_categories: [],
          max_ads_per_session: 5,
          personalized_ads: true
        };

        await supabase
          .from('user_ad_preferences')
          .insert({ user_id: user.id, ...defaultPrefs });

        setPreferences(defaultPrefs);
      }
    } catch (error) {
      console.error('Error in loadPreferences:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePreferences = useCallback(async (newPreferences: Partial<AdPreferences>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('user_ad_preferences')
        .update(newPreferences)
        .eq('user_id', user.id)
        .select('show_ads, preferred_categories, blocked_categories, max_ads_per_session, personalized_ads')
        .single();

      if (error) {
        console.error('Error updating preferences:', error);
        return false;
      }

      if (data) {
        setPreferences(data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error in updatePreferences:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return (
    <AdPreferencesContext.Provider
      value={{
        preferences,
        loading,
        updatePreferences,
        refresh: loadPreferences
      }}
    >
      {children}
    </AdPreferencesContext.Provider>
  );
}

export function useAdPreferences() {
  const context = useContext(AdPreferencesContext);
  if (context === undefined) {
    throw new Error('useAdPreferences must be used within AdPreferencesProvider');
  }
  return context;
}
