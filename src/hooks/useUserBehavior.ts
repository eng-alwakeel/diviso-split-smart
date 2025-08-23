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
  
  // Enhanced behavior tracking
  topExpenseCategories: string[];
  averageExpenseAmount: number;
  preferredUsageTime: 'morning' | 'afternoon' | 'evening' | 'night';
  sessionDuration: number;
  clickThroughPatterns: {
    adInteractions: number;
    featureExploration: number;
    reportViews: number;
  };
  financialGoals: 'budgeting' | 'tracking' | 'group_management' | 'analysis';
  devicePreference: 'mobile' | 'desktop';
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
          .select('created_at, group_id, amount, category_id, categories(name_ar)')
          .eq('created_by', user.id)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        // Get group participation
        const { data: groups } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id);

        // Get OCR usage (using ad_impressions as proxy for now)
        const { data: ocrUsage } = await supabase
          .from('ad_impressions')
          .select('created_at')
          .eq('user_id', user.id)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        const expenseCount = expenses?.length || 0;
        const groupCount = groups?.length || 0;
        const ocrCount = ocrUsage?.length || 0;

        // Enhanced analysis
        const topCategories = analyzeTopCategories(expenses || []);
        const avgAmount = calculateAverageAmount(expenses || []);
        const usageTime = analyzeUsageTime(expenses || []);
        const sessionData = getSessionData();
        const clickPatterns = getClickPatterns();
        const financialGoal = determineFinancialGoals(expenses || [], groups || [], ocrCount);
        const devicePref = getDevicePreference();

        // Calculate weekly activity
        const weeklyExpenses = expenses?.filter(e => 
          new Date(e.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length || 0;

        // Enhanced user type determination
        let userType: UserBehavior['userType'] = 'beginner';
        if (expenseCount > 20 && topCategories.includes('savings') && ocrCount < 5) {
          userType = 'saver';
        } else if (groupCount > 2 && topCategories.some(cat => ['entertainment', 'dining'].includes(cat))) {
          userType = 'social';
        } else if (expenseCount > 30 && ocrCount > 10 && clickPatterns.reportViews > 5) {
          userType = 'organizer';
        }

        // Enhanced engagement level
        let engagementLevel: UserBehavior['engagementLevel'] = 'low';
        if (weeklyExpenses >= 5 && expenseCount > 15 && sessionData > 300) {
          engagementLevel = 'high';
        } else if (weeklyExpenses >= 2 || expenseCount > 5) {
          engagementLevel = 'medium';
        }

        // Get preferred features from usage patterns
        const preferredFeatures = analyzePreferredFeatures(
          ocrCount, groupCount, clickPatterns.reportViews
        );

        const behaviorData: UserBehavior = {
          expenseFrequency: expenseCount,
          groupUsage: groupCount,
          ocrUsage: ocrCount,
          lastActiveDate: new Date().toISOString(),
          weeklyActivity: weeklyExpenses,
          preferredFeatures,
          userType,
          engagementLevel,
          topExpenseCategories: topCategories,
          averageExpenseAmount: avgAmount,
          preferredUsageTime: usageTime,
          sessionDuration: sessionData,
          clickThroughPatterns: clickPatterns,
          financialGoals: financialGoal,
          devicePreference: devicePref,
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

  // Helper functions for enhanced analysis
  const analyzeTopCategories = (expenses: any[]): string[] => {
    const categoryCount: Record<string, number> = {};
    expenses.forEach(expense => {
      if (expense.categories?.name_ar) {
        categoryCount[expense.categories.name_ar] = (categoryCount[expense.categories.name_ar] || 0) + 1;
      }
    });
    
    return Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);
  };

  const calculateAverageAmount = (expenses: any[]): number => {
    if (expenses.length === 0) return 0;
    const total = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    return total / expenses.length;
  };

  const analyzeUsageTime = (expenses: any[]): 'morning' | 'afternoon' | 'evening' | 'night' => {
    const timeSlots = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    
    expenses.forEach(expense => {
      const hour = new Date(expense.created_at).getHours();
      if (hour >= 6 && hour < 12) timeSlots.morning++;
      else if (hour >= 12 && hour < 17) timeSlots.afternoon++;
      else if (hour >= 17 && hour < 22) timeSlots.evening++;
      else timeSlots.night++;
    });

    return Object.entries(timeSlots).reduce((a, b) => 
      timeSlots[a[0] as keyof typeof timeSlots] > timeSlots[b[0] as keyof typeof timeSlots] ? a : b
    )[0] as 'morning' | 'afternoon' | 'evening' | 'night';
  };

  const getSessionData = (): number => {
    const sessions = JSON.parse(localStorage.getItem('userSessions') || '[]');
    return sessions.reduce((total: number, session: any) => total + (session.duration || 0), 0) / sessions.length || 180;
  };

  const getClickPatterns = () => {
    const patterns = JSON.parse(localStorage.getItem('userClickPatterns') || '{}');
    return {
      adInteractions: patterns.adInteractions || 0,
      featureExploration: patterns.featureExploration || 0,
      reportViews: patterns.reportViews || 0,
    };
  };

  const determineFinancialGoals = (expenses: any[], groups: any[], ocrUsage: number): 'budgeting' | 'tracking' | 'group_management' | 'analysis' => {
    if (groups.length > 2) return 'group_management';
    if (ocrUsage > 15) return 'analysis';
    if (expenses.length > 30) return 'budgeting';
    return 'tracking';
  };

  const getDevicePreference = (): 'mobile' | 'desktop' => {
    return window.innerWidth < 768 ? 'mobile' : 'desktop';
  };

  const analyzePreferredFeatures = (ocrUsage: number, groupUsage: number, reportViews: number): string[] => {
    const features: string[] = [];
    if (ocrUsage > 5) features.push('ocr', 'receipt_scanning');
    if (groupUsage > 1) features.push('group_expenses', 'collaborative_budgets');
    if (reportViews > 3) features.push('advanced_reports', 'analytics');
    return features;
  };

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
