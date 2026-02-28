import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CategorySuggestion {
  category_id: string | null;
  category_name: string;
  suggested_amount: number;
  percentage: number;
  reason: string;
  confidence: number;
  is_new_category: boolean;
}

interface AISuggestionsResponse {
  suggestions: CategorySuggestion[];
  total_suggested_budget: number;
  analysis: string;
}

export const useAIGroupSuggestions = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getSuggestions = async (
    groupType: string,
    groupName: string,
    expectedBudget?: number,
    memberCount?: number
  ): Promise<AISuggestionsResponse | null> => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('suggest-group-categories', {
        body: {
          groupType,
          groupName,
          expectedBudget,
          memberCount
        }
      });

      if (response.error) throw response.error;
      return response.data;
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في الحصول على اقتراحات الذكاء الاصطناعي',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createCategoriesFromSuggestions = async (
    suggestions: CategorySuggestion[]
  ): Promise<{ id: string; name_ar: string; amount: number }[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const categoriesWithAmounts: { id: string; name_ar: string; amount: number }[] = [];

    for (const suggestion of suggestions) {
      if (suggestion.is_new_category) {
        // Check if category already exists before creating
        const { data: existingCat } = await supabase
          .from('categories')
          .select('id, name_ar')
          .eq('name_ar', suggestion.category_name)
          .maybeSingle();

        if (existingCat) {
          categoriesWithAmounts.push({
            id: existingCat.id,
            name_ar: existingCat.name_ar,
            amount: suggestion.suggested_amount
          });
        } else {
          const { data: newCategory, error } = await supabase
            .from('categories')
            .insert([{ 
              name_ar: suggestion.category_name, 
              created_by: user.id 
            }])
            .select('id, name_ar')
            .single();

          if (error) {
            console.error('Error creating category:', error);
            continue;
          }

          categoriesWithAmounts.push({
            id: newCategory.id,
            name_ar: newCategory.name_ar,
            amount: suggestion.suggested_amount
          });
        }
      } else if (suggestion.category_id) {
        // Use existing category
        categoriesWithAmounts.push({
          id: suggestion.category_id,
          name_ar: suggestion.category_name,
          amount: suggestion.suggested_amount
        });
      }
    }

    return categoriesWithAmounts;
  };

  return {
    loading,
    getSuggestions,
    createCategoriesFromSuggestions
  };
};