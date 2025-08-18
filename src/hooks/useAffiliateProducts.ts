import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AffiliateProduct {
  id: string;
  product_id: string;
  affiliate_partner: string;
  category: string;
  subcategory?: string;
  title: string;
  description?: string;
  price_range?: string;
  rating?: number;
  image_url?: string;
  affiliate_url: string;
  keywords: string[];
  target_audience?: string;
  conversion_rate: number;
  commission_rate: number;
}

export const useAffiliateProducts = () => {
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const getProductsByCategory = async (category: string, limit = 5) => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('affiliate_products')
        .select('*')
        .eq('category', category)
        .eq('active', true)
        .order('conversion_rate', { ascending: false })
        .limit(limit);

      return data || [];
    } catch (error) {
      console.error('Error fetching affiliate products:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getProductsByKeywords = async (keywords: string[], limit = 5) => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('affiliate_products')
        .select('*')
        .overlaps('keywords', keywords)
        .eq('active', true)
        .order('conversion_rate', { ascending: false })
        .limit(limit);

      return data || [];
    } catch (error) {
      console.error('Error fetching affiliate products by keywords:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getProductsForExpenseCategory = async (expenseCategory: string, amount?: number) => {
    const categoryMapping: Record<string, string[]> = {
      'food': ['kitchen', 'food', 'cooking'],
      'transport': ['automotive', 'travel', 'transportation'],
      'shopping': ['fashion', 'electronics', 'home'],
      'entertainment': ['entertainment', 'books', 'games'],
      'health': ['health', 'fitness', 'wellness'],
      'education': ['education', 'books', 'courses'],
      'bills': ['utilities', 'finance', 'services'],
      'travel': ['travel', 'luggage', 'electronics'],
      'personal_care': ['beauty', 'health', 'personal_care']
    };

    const keywords = categoryMapping[expenseCategory] || [expenseCategory];
    return await getProductsByKeywords(keywords, 3);
  };

  const getProductsForGroupType = async (groupType: string, memberCount?: number) => {
    const groupMapping: Record<string, string[]> = {
      'family': ['home', 'family', 'kids', 'kitchen'],
      'friends': ['entertainment', 'games', 'travel', 'social'],
      'work': ['business', 'productivity', 'office', 'tech'],
      'travel': ['travel', 'luggage', 'electronics', 'outdoor'],
      'project': ['productivity', 'business', 'organization']
    };

    const keywords = groupMapping[groupType] || ['general'];
    return await getProductsByKeywords(keywords, 3);
  };

  // Amazon-specific product recommendations
  const getAmazonProducts = async (category: string, priceRange?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('affiliate_products')
        .select('*')
        .eq('affiliate_partner', 'amazon')
        .eq('category', category)
        .eq('active', true);

      if (priceRange) {
        query = query.eq('price_range', priceRange);
      }

      const { data } = await query
        .order('rating', { ascending: false })
        .limit(5);

      return data || [];
    } catch (error) {
      console.error('Error fetching Amazon products:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get trending products based on conversion rates
  const getTrendingProducts = async (limit = 5) => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('affiliate_products')
        .select('*')
        .eq('active', true)
        .order('conversion_rate', { ascending: false })
        .limit(limit);

      return data || [];
    } catch (error) {
      console.error('Error fetching trending products:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    getProductsByCategory,
    getProductsByKeywords,
    getProductsForExpenseCategory,
    getProductsForGroupType,
    getAmazonProducts,
    getTrendingProducts
  };
};