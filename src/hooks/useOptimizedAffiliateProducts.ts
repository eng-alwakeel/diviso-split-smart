import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LRUCache } from '@/utils/performanceOptimizations';

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

// Global cache for trending products (shared across all instances)
const trendingProductsCache = new LRUCache<string, AffiliateProduct[]>(10);

export const useOptimizedAffiliateProducts = () => {
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const getProductsByCategory = useCallback(async (category: string, limit = 5) => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('affiliate_products')
        .select('id, product_id, affiliate_partner, category, title, price_range, rating, image_url, affiliate_url, conversion_rate')
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
  }, []);

  const getTrendingProducts = useCallback(async (limit = 5) => {
    // Check cache first
    const cacheKey = `trending_${limit}`;
    const cached = trendingProductsCache.get(cacheKey);
    if (cached) {
      setProducts(cached);
      return cached;
    }

    setLoading(true);
    try {
      const { data } = await supabase
        .from('affiliate_products')
        .select('id, product_id, affiliate_partner, category, title, price_range, rating, image_url, affiliate_url, conversion_rate, commission_rate')
        .eq('active', true)
        .order('conversion_rate', { ascending: false })
        .limit(limit);

      const products = data || [];
      trendingProductsCache.set(cacheKey, products);
      setProducts(products);
      return products;
    } catch (error) {
      console.error('Error fetching trending products:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getStatsBannerProduct = useCallback(async () => {
    // Check cache first
    const cacheKey = 'stats_banner';
    const cached = trendingProductsCache.get(cacheKey);
    if (cached && cached.length > 0) {
      return cached[0];
    }

    setLoading(true);
    try {
      const { data } = await supabase
        .from('affiliate_products')
        .select('id, product_id, affiliate_partner, category, title, price_range, rating, image_url, affiliate_url, conversion_rate')
        .eq('active', true)
        .order('click_count', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        trendingProductsCache.set(cacheKey, [data]);
      }
      return data || null;
    } catch (error) {
      console.error('Error fetching stats banner product:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    products,
    loading,
    getProductsByCategory,
    getTrendingProducts,
    getStatsBannerProduct
  };
};
