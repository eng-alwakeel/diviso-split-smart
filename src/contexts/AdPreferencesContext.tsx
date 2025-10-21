import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

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
  const { user, loading: authLoading } = useAuth();
  const [preferences, setPreferences] = useState<AdPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPreferences = useCallback(async () => {
    console.log('📢 AdPreferencesContext: Loading preferences...', { authLoading, user: !!user });
    
    if (authLoading) {
      console.log('⏳ AdPreferencesContext: Waiting for auth...');
      return;
    }
    
    try {
      if (!user) {
        console.log('👤 AdPreferencesContext: No user, setting loading to false');
        setLoading(false);
        return;
      }

      console.log('🔍 AdPreferencesContext: Fetching preferences for user', user.id);

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
      
      console.log('✅ AdPreferencesContext: Preferences loaded successfully');
    } catch (error) {
      console.error('❌ AdPreferencesContext: Error', error);
    } finally {
      setLoading(false);
    }
  }, [authLoading, user]);

  const updatePreferences = useCallback(async (newPreferences: Partial<AdPreferences>) => {
    if (!user) return false;
    
    try {

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
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      loadPreferences();
    }
  }, [authLoading, loadPreferences]);

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
