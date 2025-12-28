import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "./useCategories";
import { useGroupBudgetTracking } from "./useGroupBudgetTracking";

export type SmartCategory = {
  id: string;
  name_ar: string;
  created_by: string | null;
  section: 'budget' | 'recent' | 'suggested' | 'other';
  budgeted_amount?: number;
  spent_amount?: number;
  remaining_amount?: number;
  usage_count?: number;
  confidence?: number;
};

async function fetchRecentCategories(groupId: string): Promise<{id: string, usage_count: number}[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('category_id')
    .eq('group_id', groupId)
    .not('category_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  // Count category usage
  const categoryCount: Record<string, number> = {};
  data?.forEach(expense => {
    if (expense.category_id) {
      categoryCount[expense.category_id] = (categoryCount[expense.category_id] || 0) + 1;
    }
  });

  return Object.entries(categoryCount)
    .map(([id, count]) => ({ id, usage_count: count }))
    .sort((a, b) => b.usage_count - a.usage_count);
}

async function fetchGroupType(groupId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('groups')
    .select('group_type')
    .eq('id', groupId)
    .maybeSingle();

  if (error) return null;
  return data?.group_type || null;
}

const suggestCategoriesForGroupType = (groupType: string, allCategories: any[]): {id: string, confidence: number}[] => {
  const suggestions: {id: string, confidence: number}[] = [];

  switch (groupType) {
    case 'trip':
      const travelCategories = [
        'مواصلات', 'طعام', 'إقامة', 'ترفيه', 'تسوق', 'وقود', 'مطاعم', 'فنادق', 'شراب'
      ];
      
      allCategories.forEach(cat => {
        const confidence = travelCategories.some(travel => 
          cat.name_ar.includes(travel)
        ) ? 0.9 : 0;
        
        if (confidence > 0) {
          suggestions.push({ id: cat.id, confidence });
        }
      });
      break;

    case 'party':
      const partyCategories = [
        'ديكور', 'طعام', 'ترفيه', 'هدايا', 'ملابس', 'تصوير', 'دعوات', 'حلويات', 'مطاعم'
      ];
      
      allCategories.forEach(cat => {
        const confidence = partyCategories.some(party => 
          cat.name_ar.includes(party)
        ) ? 0.8 : 0;
        
        if (confidence > 0) {
          suggestions.push({ id: cat.id, confidence });
        }
      });
      break;

    case 'home':
      const homeCategories = [
        'طعام', 'مطاعم', 'صحة', 'تسوق', 'فواتير', 'صيانة', 'تنظيف', 'أطفال', 'أثاث'
      ];
      
      allCategories.forEach(cat => {
        const confidence = homeCategories.some(home => 
          cat.name_ar.includes(home)
        ) ? 0.8 : 0;
        
        if (confidence > 0) {
          suggestions.push({ id: cat.id, confidence });
        }
      });
      break;

    case 'work':
    case 'project':
      const workCategories = [
        'مكتب', 'اجتماعات', 'مواصلات', 'معدات', 'قرطاسية', 'طعام', 'تقنية', 'مشاريع', 'مبيعات'
      ];
      
      allCategories.forEach(cat => {
        const confidence = workCategories.some(work => 
          cat.name_ar.includes(work)
        ) ? 0.7 : 0;
        
        if (confidence > 0) {
          suggestions.push({ id: cat.id, confidence });
        }
      });
      break;

    default:
      // For general or unknown types, suggest common categories
      const generalCategories = [
        'طعام', 'مواصلات', 'ترفيه', 'تسوق', 'صحة'
      ];
      
      allCategories.forEach(cat => {
        const confidence = generalCategories.some(general => 
          cat.name_ar.includes(general)
        ) ? 0.5 : 0;
        
        if (confidence > 0) {
          suggestions.push({ id: cat.id, confidence });
        }
      });
      break;
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
};

export function useSmartCategories(groupId: string | null) {
  const { categories: allCategories } = useCategories();
  const { budgetTracking: budgetCategories } = useGroupBudgetTracking(groupId || '');

  const {
    data: smartCategories = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["smart-categories", groupId],
    queryFn: async () => {
      if (!groupId) return [];

      const [recentCategories, groupType] = await Promise.all([
        fetchRecentCategories(groupId),
        fetchGroupType(groupId)
      ]);

      const suggestedCategories = groupType 
        ? suggestCategoriesForGroupType(groupType, allCategories)
        : [];

      const result: SmartCategory[] = [];
      const processedIds = new Set<string>();

      // 1. Budget categories (highest priority)
      budgetCategories.forEach(budgetCat => {
        const category = allCategories.find(cat => cat.id === budgetCat.category_id);
        if (category && !processedIds.has(category.id)) {
          result.push({
            ...category,
            section: 'budget',
            budgeted_amount: budgetCat.budgeted_amount,
            spent_amount: budgetCat.spent_amount,
            remaining_amount: budgetCat.remaining_amount
          });
          processedIds.add(category.id);
        }
      });

      // 2. Recently used categories (second priority)
      recentCategories.slice(0, 5).forEach(recent => {
        const category = allCategories.find(cat => cat.id === recent.id);
        if (category && !processedIds.has(category.id)) {
          result.push({
            ...category,
            section: 'recent',
            usage_count: recent.usage_count
          });
          processedIds.add(category.id);
        }
      });

      // 3. Suggested categories based on group type (third priority)
      suggestedCategories.forEach(suggested => {
        const category = allCategories.find(cat => cat.id === suggested.id);
        if (category && !processedIds.has(category.id)) {
          result.push({
            ...category,
            section: 'suggested',
            confidence: suggested.confidence
          });
          processedIds.add(category.id);
        }
      });

      // 4. Other categories (lowest priority)
      allCategories.forEach(category => {
        if (!processedIds.has(category.id)) {
          result.push({
            ...category,
            section: 'other'
          });
        }
      });

      return result;
    },
    enabled: !!groupId && allCategories.length > 0,
  });

  return {
    smartCategories,
    isLoading,
    error,
    refetch,
    getSectionIcon: (section: SmartCategory['section']) => {
      switch (section) {
        case 'budget': return '💰';
        case 'recent': return '🕒';
        case 'suggested': return '💡';
        case 'other': return '📁';
        default: return '';
      }
    }
  };
}