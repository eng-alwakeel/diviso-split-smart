import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, ShoppingBag, TrendingUp, Zap } from 'lucide-react';
import { useAdTracking } from '@/hooks/useAdTracking';
import { useAffiliateProducts } from '@/hooks/useAffiliateProducts';
import { useUserBehavior } from '@/hooks/useUserBehavior';

interface SmartAdSidebarProps {
  className?: string;
}

export const SmartAdSidebar: React.FC<SmartAdSidebarProps> = ({ className = '' }) => {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { shouldShowAds, trackAdImpression, trackAdClick, getTargetedCategories } = useAdTracking();
  const { getTrendingProducts, getProductsByCategory } = useAffiliateProducts();
  const { behavior } = useUserBehavior();

  useEffect(() => {
    if (shouldShowAds()) {
      loadSidebarAds();
    }
  }, [shouldShowAds, behavior]);

  const loadSidebarAds = async () => {
    setLoading(true);
    try {
      // Get trending products
      const trending = await getTrendingProducts(3);
      setTrendingProducts(trending);

      // Get targeted products based on user behavior
      const targetedCategories = getTargetedCategories();
      if (targetedCategories.length > 0) {
        const featured = await getProductsByCategory(targetedCategories[0], 2);
        setFeaturedProducts(featured);
      }

      // Track impression
      if (trending.length > 0 || featuredProducts.length > 0) {
        await trackAdImpression({
          ad_type: 'sidebar_ads',
          placement: 'sidebar',
          ad_category: 'mixed'
        });
      }
    } catch (error) {
      console.error('Error loading sidebar ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = async (product: any, section: string) => {
    await trackAdClick('', product.product_id, product.commission_rate);
    window.open(product.affiliate_url, '_blank', 'noopener,noreferrer');
  };

  if (!shouldShowAds() || loading) {
    return null;
  }

  if (featuredProducts.length === 0 && trendingProducts.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <Card className="p-4 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">مُوصى لك</h3>
            <Badge variant="secondary" className="text-xs mr-auto">إعلان</Badge>
          </div>
          
          <div className="space-y-3">
            {featuredProducts.map((product, index) => (
              <div key={product.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => handleProductClick(product, 'featured')}>
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="w-12 h-12 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2">{product.title}</p>
                  {product.price_range && (
                    <p className="text-xs text-primary font-semibold">{product.price_range}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductClick(product, 'featured');
                  }}
                  className="flex-shrink-0"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Trending Products */}
      {trendingProducts.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-accent" />
            <h3 className="font-semibold text-sm">الأكثر مبيعاً</h3>
            <Badge variant="secondary" className="text-xs mr-auto">إعلان</Badge>
          </div>
          
          <div className="space-y-3">
            {trendingProducts.map((product, index) => (
              <div key={product.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-shrink-0 w-6 h-6 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="w-10 h-10 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium line-clamp-2">{product.title}</p>
                  {product.rating && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-yellow-500">★</span>
                      <span className="text-xs text-muted-foreground">{product.rating}</span>
                    </div>
                  )}
                </div>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleProductClick(product, 'trending')}
                  className="flex-shrink-0 h-8 w-8 p-0"
                >
                  <ShoppingBag className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Amazon Prime Notice */}
      <Card className="p-3 bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-orange-500 rounded text-white text-xs font-bold flex items-center justify-center">
            A
          </div>
          <span className="text-sm font-semibold text-orange-900">Amazon Prime</span>
        </div>
        <p className="text-xs text-orange-700 mb-2">
          احصل على توصيل مجاني وسريع مع عضوية برايم
        </p>
        <Button 
          size="sm" 
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          onClick={() => window.open('https://amazon.sa/prime', '_blank')}
        >
          جرب برايم مجاناً
        </Button>
      </Card>
    </div>
  );
};