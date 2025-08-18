import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserBehavior } from './useUserBehavior';
import { useAffiliateProducts } from './useAffiliateProducts';

interface SmartRecommendationContext {
  type: 'expense' | 'group' | 'dashboard' | 'category';
  expenseCategory?: string;
  groupType?: string;
  groupId?: string;
  amount?: number;
  location?: string;
  memberCount?: number;
}

interface SmartProduct {
  id: string;
  title: string;
  description?: string;
  price_range?: string;
  rating?: number;
  image_url?: string;
  affiliate_url: string;
  category: string;
  affiliate_partner: string;
  smart_score: number;
  relevance_reason: string;
}

export const useSmartAffiliateRecommendations = () => {
  const [recommendations, setRecommendations] = useState<SmartProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastContext, setLastContext] = useState<SmartRecommendationContext | null>(null);
  
  const { behavior, trackAction } = useUserBehavior();
  const { getProductsByCategory } = useAffiliateProducts();

  // Get smart recommendations based on context and user behavior
  const getSmartRecommendations = async (
    context: SmartRecommendationContext, 
    limit = 5,
    useAI = true
  ): Promise<SmartProduct[]> => {
    setLoading(true);
    try {
      console.log('Getting smart recommendations:', context, behavior);

      if (useAI && behavior) {
        // Use AI-powered recommendations via Edge Function
        const response = await supabase.functions.invoke('amazon-affiliate-sync', {
          body: {
            smartMode: true,
            limit,
            userBehavior: {
              userType: behavior.userType,
              engagementLevel: behavior.engagementLevel,
              preferredCategories: behavior.preferredFeatures || [],
              recentExpenseCategories: getRecentExpenseCategories(),
              groupTypes: getUserGroupTypes(),
              averageExpenseAmount: calculateAverageExpenseAmount(),
              location: 'saudi'
            },
            groupContext: context.groupId ? await getGroupContext(context.groupId) : {
              groupType: context.groupType || 'general',
              currency: 'SAR',
              memberCount: context.memberCount || 1,
              totalExpenses: 0
            }
          }
        });

        if (response.data?.products) {
          const products = response.data.products.map((product: any) => ({
            ...product,
            relevance_reason: generateRelevanceReason(product, context, behavior)
          }));
          
          setRecommendations(products);
          setLastContext(context);
          
          // Track the recommendation request
          trackAction('affiliate_recommendations_requested', {
            context: context.type,
            aiMode: true,
            productsCount: products.length
          });
          
          return products;
        }
      }

      // Fallback to manual recommendations
      const fallbackProducts = await getFallbackRecommendations(context, limit);
      setRecommendations(fallbackProducts);
      setLastContext(context);
      
      return fallbackProducts;
      
    } catch (error) {
      console.error('Error getting smart recommendations:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get fallback recommendations when AI is not available
  const getFallbackRecommendations = async (
    context: SmartRecommendationContext,
    limit: number
  ): Promise<SmartProduct[]> => {
    const categoryMapping: Record<string, string> = {
      'food': 'kitchen',
      'transport': 'automotive',
      'shopping': 'fashion',
      'entertainment': 'entertainment',
      'health': 'health',
      'education': 'books',
      'bills': 'office',
      'travel': 'travel',
      'personal_care': 'beauty'
    };

    let targetCategory = 'general';
    
    if (context.type === 'expense' && context.expenseCategory) {
      targetCategory = categoryMapping[context.expenseCategory] || 'general';
    } else if (context.type === 'group' && context.groupType) {
      const groupCategoryMapping: Record<string, string> = {
        'trip': 'travel',
        'home': 'home',
        'work': 'office',
        'party': 'entertainment',
        'project': 'office'
      };
      targetCategory = groupCategoryMapping[context.groupType] || 'general';
    }

    const products = await getProductsByCategory(targetCategory, limit);
    
    return products.map((product: any) => ({
      ...product,
      smart_score: calculateFallbackScore(product, context),
      relevance_reason: `مُوصى لفئة ${targetCategory}`
    }));
  };

  // Calculate fallback score for products
  const calculateFallbackScore = (product: any, context: SmartRecommendationContext): number => {
    let score = product.conversion_rate * 10 || 5;
    
    if (product.rating > 4) score += 2;
    if (context.amount && product.price_range) {
      // Simple price matching
      const priceLevel = product.price_range.includes('منخفض') ? 1 : 
                        product.price_range.includes('متوسط') ? 2 : 3;
      const userPriceLevel = context.amount < 100 ? 1 : context.amount < 500 ? 2 : 3;
      if (priceLevel === userPriceLevel) score += 1;
    }
    
    return score;
  };

  // Generate human-readable relevance reason
  const generateRelevanceReason = (
    product: any, 
    context: SmartRecommendationContext, 
    userBehavior: any
  ): string => {
    const reasons = [];

    if (context.type === 'expense' && context.expenseCategory) {
      reasons.push(`يناسب فئة ${context.expenseCategory}`);
    }

    if (context.type === 'group' && context.groupType) {
      const groupLabels: Record<string, string> = {
        'trip': 'الرحلات',
        'home': 'السكن المشترك',
        'work': 'العمل',
        'party': 'الحفلات',
        'project': 'المشاريع'
      };
      reasons.push(`مُوصى لمجموعات ${groupLabels[context.groupType] || context.groupType}`);
    }

    if (userBehavior?.userType) {
      const userTypeLabels: Record<string, string> = {
        'saver': 'الموفرين',
        'social': 'الاجتماعيين',
        'organizer': 'المنظمين',
        'beginner': 'المبتدئين'
      };
      reasons.push(`يناسب نمط ${userTypeLabels[userBehavior.userType]}`);
    }

    if (product.rating > 4) {
      reasons.push(`تقييم عالي (${product.rating})`);
    }

    if (product.smart_score > 8) {
      reasons.push('مُوصى بقوة');
    }

    return reasons.join(' • ') || 'منتج مُوصى';
  };

  // Get recent expense categories from user behavior
  const getRecentExpenseCategories = (): string[] => {
    // This would typically come from analyzing recent expenses
    // For now, return empty array or default categories
    return behavior?.preferredFeatures || [];
  };

  // Get user's group types
  const getUserGroupTypes = (): string[] => {
    // This would come from user's group memberships
    // For now, return default types
    return ['general'];
  };

  // Calculate average expense amount
  const calculateAverageExpenseAmount = (): number => {
    // This would be calculated from user's expense history
    // For now, return a default value
    return 300; // SAR
  };

  // Get group context for better recommendations
  const getGroupContext = async (groupId: string) => {
    try {
      const { data: group } = await supabase
        .from('groups')
        .select(`
          group_type,
          currency,
          group_members(count),
          expenses(amount)
        `)
        .eq('id', groupId)
        .single();

      if (group) {
        const totalExpenses = group.expenses?.reduce((sum: number, expense: any) => 
          sum + (expense.amount || 0), 0) || 0;
        
        return {
          groupType: group.group_type || 'general',
          currency: group.currency || 'SAR',
          memberCount: group.group_members?.length || 1,
          totalExpenses
        };
      }
    } catch (error) {
      console.error('Error fetching group context:', error);
    }

    return {
      groupType: 'general',
      currency: 'SAR',
      memberCount: 1,
      totalExpenses: 0
    };
  };

  // Get recommendations for specific expense
  const getExpenseRecommendations = async (
    category: string, 
    amount?: number,
    limit = 3
  ) => {
    return getSmartRecommendations({
      type: 'expense',
      expenseCategory: category,
      amount
    }, limit);
  };

  // Get recommendations for group context
  const getGroupRecommendations = async (
    groupType: string,
    groupId?: string,
    memberCount?: number,
    limit = 3
  ) => {
    return getSmartRecommendations({
      type: 'group',
      groupType,
      groupId,
      memberCount
    }, limit);
  };

  // Get dashboard recommendations
  const getDashboardRecommendations = async (limit = 5) => {
    return getSmartRecommendations({
      type: 'dashboard'
    }, limit);
  };

  // Refresh recommendations with same context
  const refreshRecommendations = async () => {
    if (lastContext) {
      return getSmartRecommendations(lastContext);
    }
    return [];
  };

  return {
    recommendations,
    loading,
    getSmartRecommendations,
    getExpenseRecommendations,
    getGroupRecommendations,
    getDashboardRecommendations,
    refreshRecommendations
  };
};