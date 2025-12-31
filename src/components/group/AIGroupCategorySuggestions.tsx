import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bot, TrendingUp, Plus, DollarSign, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useBudgetFromAI } from '@/hooks/useBudgetFromAI';

interface CategorySuggestion {
  category_id: string | null;
  category_name: string;
  suggested_amount: number;
  percentage: number;
  reason: string;
  confidence: number;
  is_new_category: boolean;
}

interface AISuggestionsData {
  suggestions: CategorySuggestion[];
  total_suggested_budget: number;
  analysis: string;
}

interface AIGroupCategorySuggestionsProps {
  groupId: string;
  groupType: string;
  groupName: string;
  expectedBudget?: number;
  memberCount?: number;
  onAcceptSuggestions: (budgetId: string) => void;
  onSkip: () => void;
  loading?: boolean;
}

export const AIGroupCategorySuggestions: React.FC<AIGroupCategorySuggestionsProps> = ({
  groupId,
  groupType,
  groupName,
  expectedBudget,
  memberCount,
  onAcceptSuggestions,
  onSkip,
  loading = false
}) => {
  const [suggestions, setSuggestions] = useState<AISuggestionsData | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<CategorySuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const { toast } = useToast();
  const { createBudgetFromAISuggestions, loading: creatingBudget } = useBudgetFromAI();

  const fetchSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`https://iwthriddasxzbjddpzzf.functions.supabase.co/suggest-group-categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          groupType,
          groupName,
          expectedBudget,
          memberCount
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();
      setSuggestions(data);
      setSelectedCategories(data.suggestions.filter((s: CategorySuggestion) => s.confidence > 0.7));
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في الحصول على اقتراحات الذكاء الاصطناعي',
        variant: 'destructive',
      });
    } finally {
      setLoadingSuggestions(false);
    }
  };

  React.useEffect(() => {
    fetchSuggestions();
  }, [groupType, groupName, expectedBudget, memberCount]);

  const toggleCategorySelection = (category: CategorySuggestion) => {
    setSelectedCategories(prev => {
      const isSelected = prev.some(c => c.category_name === category.category_name);
      if (isSelected) {
        return prev.filter(c => c.category_name !== category.category_name);
      } else {
        return [...prev, category];
      }
    });
  };

  const updateCategoryAmount = (categoryName: string, amount: number) => {
    setSelectedCategories(prev => 
      prev.map(c => 
        c.category_name === categoryName 
          ? { ...c, suggested_amount: amount }
          : c
      )
    );
  };

  const getTotalSelectedAmount = () => {
    return selectedCategories.reduce((total, cat) => total + cat.suggested_amount, 0);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const handleAcceptSuggestions = async () => {
    if (selectedCategories.length === 0) {
      toast({
        title: 'تنبيه',
        description: 'يرجى اختيار فئة واحدة على الأقل',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const budgetId = await createBudgetFromAISuggestions(
        groupId,
        `ميزانية ${groupName}`,
        getTotalSelectedAmount(),
        selectedCategories
      );
      onAcceptSuggestions(budgetId);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  if (loadingSuggestions) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Bot className="h-8 w-8 text-primary animate-pulse" />
            <CardTitle className="text-xl">الذكاء الاصطناعي يحلل مجموعتك</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">جاري إنشاء اقتراحات مخصصة لمجموعتك...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!suggestions) {
    return (
      <Card className="w-full">
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">فشل في تحميل الاقتراحات</p>
          <Button onClick={fetchSuggestions} variant="outline" className="mt-4">
            إعادة المحاولة
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle>تحليل المجموعة</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{suggestions.analysis}</p>
          <div className="flex items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              <span>الميزانية المقترحة: {suggestions.total_suggested_budget.toLocaleString()} ريال</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span>{suggestions.suggestions.length} فئات مقترحة</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle>الفئات المقترحة</CardTitle>
          <p className="text-sm text-muted-foreground">
            اختر الفئات المناسبة لمجموعتك وعدل المبالغ حسب الحاجة
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {suggestions.suggestions.map((suggestion, index) => {
            const isSelected = selectedCategories.some(c => c.category_name === suggestion.category_name);
            const selectedCategory = selectedCategories.find(c => c.category_name === suggestion.category_name);
            
            return (
              <div key={index} className={`p-4 border rounded-lg transition-all overflow-hidden ${isSelected ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleCategorySelection(suggestion)}
                    className="mt-1 shrink-0"
                  />
                  
                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-sm sm:text-base">{suggestion.category_name}</h4>
                        {suggestion.is_new_category && (
                          <Badge variant="outline" className="text-xs whitespace-nowrap">
                            <Plus className="h-3 w-3 ml-1" />
                            جديدة
                          </Badge>
                        )}
                        <Badge 
                          variant="outline" 
                          className={`text-xs whitespace-nowrap ${getConfidenceColor(suggestion.confidence)}`}
                        >
                          {Math.round(suggestion.confidence * 100)}% ثقة
                        </Badge>
                      </div>
                      <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                        {suggestion.percentage}% من الميزانية
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
                    
                    {isSelected && (
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`amount-${index}`} className="text-sm">المبلغ:</Label>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <Input
                            id={`amount-${index}`}
                            type="number"
                            value={selectedCategory?.suggested_amount || suggestion.suggested_amount}
                            onChange={(e) => updateCategoryAmount(suggestion.category_name, Number(e.target.value))}
                            className="w-32"
                          />
                          <span className="text-sm text-muted-foreground">ريال</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Selected Summary */}
      {selectedCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>ملخص الفئات المختارة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedCategories.map((category, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span>{category.category_name}</span>
                  <span className="font-medium">{category.suggested_amount.toLocaleString()} ريال</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-4 flex justify-between items-center font-semibold">
                <span>الإجمالي:</span>
                <span>{getTotalSelectedAmount().toLocaleString()} ريال</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={handleAcceptSuggestions}
          disabled={selectedCategories.length === 0 || loading || creatingBudget}
          className="flex-1"
        >
          {(loading || creatingBudget) ? 'جاري الإنشاء...' : `استخدام الفئات المختارة (${selectedCategories.length})`}
        </Button>
        <Button 
          onClick={onSkip}
          variant="outline"
          disabled={loading}
        >
          تخطي
        </Button>
      </div>
    </div>
  );
};