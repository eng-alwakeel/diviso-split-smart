import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserBehavior {
  expenseFrequency: number;
  groupUsage: number;
  ocrUsage: number;
  lastActiveDate: string;
  weeklyActivity: number;
  preferredFeatures: string[];
  userType: 'saver' | 'social' | 'organizer' | 'beginner';
  engagementLevel: 'low' | 'medium' | 'high';
}

export const useUserBehavior = () => {
  const [behavior, setBehavior] = useState<UserBehavior | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const analyzeBehavior = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get user's expense patterns
        const { data: expenses } = await supabase
          .from('expenses')
          .select('created_at, group_id')
          .eq('created_by', user.id)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        // Get group participation
        const { data: groups } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id);

        // Get OCR usage
        const { data: ocrUsage } = await supabase
          .from('receipt_ocr')
          .select('created_at')
          .eq('created_by', user.id)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        const expenseCount = expenses?.length || 0;
        const groupCount = groups?.length || 0;
        const ocrCount = ocrUsage?.length || 0;

        // Calculate weekly activity
        const weeklyExpenses = expenses?.filter(e => 
          new Date(e.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length || 0;

        // Determine user type
        let userType: UserBehavior['userType'] = 'beginner';
        if (expenseCount > 20 && groupCount <= 1) userType = 'saver';
        else if (groupCount > 2) userType = 'social';
        else if (expenseCount > 15 && ocrCount > 5) userType = 'organizer';

        // Determine engagement level
        let engagementLevel: UserBehavior['engagementLevel'] = 'low';
        if (weeklyExpenses > 5) engagementLevel = 'high';
        else if (weeklyExpenses > 2) engagementLevel = 'medium';

        const behaviorData: UserBehavior = {
          expenseFrequency: expenseCount,
          groupUsage: groupCount,
          ocrUsage: ocrCount,
          lastActiveDate: new Date().toISOString(),
          weeklyActivity: weeklyExpenses,
          preferredFeatures: [],
          userType,
          engagementLevel
        };

        setBehavior(behaviorData);
      } catch (error) {
        console.error('Error analyzing user behavior:', error);
      } finally {
        setLoading(false);
      }
    };

    analyzeBehavior();
  }, []);

  const trackAction = (action: string, metadata?: any) => {
    // Track user actions for future analysis
    const actionData = {
      action,
      timestamp: new Date().toISOString(),
      metadata
    };
    
    const existingActions = JSON.parse(localStorage.getItem('userActions') || '[]');
    existingActions.push(actionData);
    
    // Keep only last 100 actions
    if (existingActions.length > 100) {
      existingActions.splice(0, existingActions.length - 100);
    }
    
    localStorage.setItem('userActions', JSON.stringify(existingActions));
  };

  return {
    behavior,
    loading,
    trackAction
  };
};
