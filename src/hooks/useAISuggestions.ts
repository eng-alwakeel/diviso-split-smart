import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AISuggestion {
  id: string;
  suggestion_type: string;
  content: any;
  confidence_score: number;
  status: string;
  created_at: string;
}

interface CategorySuggestion {
  category_id: string;
  category_name: string;
  confidence: number;
  reason: string;
}

export const useAISuggestions = () => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_suggestions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في جلب الاقتراحات الذكية',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const acceptSuggestion = async (suggestionId: string) => {
    try {
      const { error } = await supabase
        .from('ai_suggestions')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', suggestionId);

      if (error) throw error;

      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      toast({
        title: 'تم القبول',
        description: 'تم قبول الاقتراح بنجاح',
      });
    } catch (error) {
      console.error('Error accepting suggestion:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في قبول الاقتراح',
        variant: 'destructive',
      });
    }
  };

  const rejectSuggestion = async (suggestionId: string) => {
    try {
      const { error } = await supabase
        .from('ai_suggestions')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', suggestionId);

      if (error) throw error;

      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      toast({
        title: 'تم الرفض',
        description: 'تم رفض الاقتراح',
      });
    } catch (error) {
      console.error('Error rejecting suggestion:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في رفض الاقتراح',
        variant: 'destructive',
      });
    }
  };

  const suggestCategories = async (description: string, merchant?: string, amount?: number, groupId?: string): Promise<CategorySuggestion[]> => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('suggest-categories', {
        body: {
          description,
          merchant,
          amount,
          group_id: groupId
        }
      });

      if (error) throw error;
      return data.suggestions || [];
    } catch (error) {
      console.error('Error getting category suggestions:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في الحصول على اقتراحات الفئات',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const enhanceReceiptOCR = async (filePath: string, receiptId?: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('enhance-receipt-ocr', {
        body: {
          file_path: filePath,
          receipt_id: receiptId
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error enhancing receipt OCR:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحليل الإيصال بالذكاء الاصطناعي',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  return {
    suggestions,
    loading,
    fetchSuggestions,
    acceptSuggestion,
    rejectSuggestion,
    suggestCategories,
    enhanceReceiptOCR
  };
};