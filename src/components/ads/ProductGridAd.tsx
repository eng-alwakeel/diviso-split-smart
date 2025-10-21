import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ExternalLink, Star, Tag, Sparkles } from 'lucide-react';
import { useAdTracking } from '@/hooks/useAdTracking';
import { useAffiliateProducts } from '@/hooks/useAffiliateProducts';

interface ProductGridAdProps {
  context: {
    type: 'expense' | 'group' | 'dashboard' | 'category';
    category?: string;
    groupType?: string;
    amount?: number;
  };
  placement: string;
  maxProducts?: number;
  className?: string;
}

export const ProductGridAd: React.FC<ProductGridAdProps> = ({
  context,
  placement,
  maxProducts = 4,
  className = ''
}) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { shouldShowAds, trackAdImpression, trackAdClick } = useAdTracking();
  const { getProductsForExpenseCategory, getProductsForGroupType, getAmazonProducts } = useAffiliateProducts();

  useEffect(() => {
    if (shouldShowAds()) {
      loadProducts();
    }
  }, [context]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      let fetchedProducts: any[] = [];

      switch (context.type) {
        case 'expense':
          if (context.category) {
            fetchedProducts = await getProductsForExpenseCategory(context.category, context.amount);
          }
          break;
        case 'group':
          if (context.groupType) {
            fetchedProducts = await getProductsForGroupType(context.groupType);
          }
          break;
        case 'dashboard':
          fetchedProducts = await getAmazonProducts('general');
          break;
        case 'category':
          if (context.category) {
            fetchedProducts = await getAmazonProducts(context.category);
          }
          break;
      }

      const limitedProducts = fetchedProducts.slice(0, maxProducts);
      setProducts(limitedProducts);

      // Track impressions
      if (limitedProducts.length > 0) {
        await trackAdImpression({
          ad_type: 'product_grid',
          ad_category: context.category || 'general',
          placement,
          product_id: limitedProducts[0].product_id,
          affiliate_partner: limitedProducts[0].affiliate_partner
        });
      }
    } catch (error) {
      console.error('Error loading grid products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = async (product: any) => {
    await trackAdClick('', product.product_id, product.commission_rate);
    window.open(product.affiliate_url, '_blank', 'noopener,noreferrer');
  };

  if (!shouldShowAds() || (!loading && products.length === 0)) {
    return null;
  }

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">منتجات مُوصى بها</h3>
          <Badge variant="secondary" className="text-xs mr-auto">إعلان</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: maxProducts }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <Skeleton className="w-full h-[150px]" />
              <CardContent className="p-3">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-3" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">منتجات مُوصى بها</h3>
        <Badge variant="secondary" className="text-xs mr-auto">إعلان</Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {products.map((product) => (
          <Card 
            key={product.id} 
            className="overflow-hidden hover:shadow-elevated transition-all cursor-pointer group"
            onClick={() => handleProductClick(product)}
          >
            {/* Image Section - 150px height (IAB 300x250 standard) */}
            <div className="relative w-full h-[150px] bg-muted overflow-hidden">
              <OptimizedImage
                src={product.image_url || 'https://via.placeholder.com/300x150?text=Product'}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                width={300}
                height={150}
                loading="lazy"
                onError={() => {}}
              />
              
              {/* Partner Badge */}
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="text-xs bg-background/80 backdrop-blur-sm">
                  <Tag className="h-3 w-3 ml-1" />
                  {product.affiliate_partner === 'amazon' ? 'أمازون' : product.affiliate_partner}
                </Badge>
              </div>

              {/* Rating Badge */}
              {product.rating && (
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="text-xs bg-background/80 backdrop-blur-sm">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 ml-1" />
                    {product.rating}
                  </Badge>
                </div>
              )}
            </div>

            {/* Content Section - ~100px */}
            <CardContent className="p-3 flex flex-col gap-2">
              <h4 className="text-sm font-semibold line-clamp-2 min-h-[40px]">
                {product.title}
              </h4>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-primary">
                  {product.price_range || 'السعر غير متوفر'}
                </span>
              </div>

              <Button 
                size="sm" 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleProductClick(product);
                }}
              >
                <ExternalLink className="h-3 w-3 mr-2" />
                تسوق الآن
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
