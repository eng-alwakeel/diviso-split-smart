import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Crown, Zap } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAffiliateProducts } from '@/hooks/useAffiliateProducts';
import { ImageWithFallback } from '@/components/ImageWithFallback';

export const PersistentAdSidebar: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  const { subscription } = useSubscription();
  const { getTrendingProducts, getAmazonProducts } = useAffiliateProducts();
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [sidebarProducts, setSidebarProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Don't show ads for paid subscribers
  const isFreePlan = !subscription || subscription.status !== 'active';

  // Load featured products from database
  useEffect(() => {
    const loadProducts = async () => {
      if (!isFreePlan) return;
      
      setLoading(true);
      try {
        // Try to get Amazon products first, fallback to trending products
        let products = await getAmazonProducts('electronics', '100-500');
        if (products.length === 0) {
          products = await getTrendingProducts(3);
        }
        setSidebarProducts(products.slice(0, 3)); // Limit to 3 products
      } catch (error) {
        console.error('Error loading sidebar products:', error);
        setSidebarProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [isFreePlan, getTrendingProducts, getAmazonProducts]);

  useEffect(() => {
    if (!isFreePlan || sidebarProducts.length === 0) return;

    const interval = setInterval(() => {
      setCurrentProductIndex((prev) => (prev + 1) % sidebarProducts.length);
    }, 12000); // Rotate every 12 seconds

    return () => clearInterval(interval);
  }, [isFreePlan, sidebarProducts.length]);

  if (!isFreePlan || loading) return null;

  if (sidebarProducts.length === 0) return null;

  const handleProductClick = (product: any) => {
    if (product.affiliate_url) {
      window.open(product.affiliate_url, '_blank');
    }
  };

  const currentProduct = sidebarProducts[currentProductIndex];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Featured Product */}
      <Card className="overflow-hidden border-2 border-border/50 shadow-md bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              إعلان
            </Badge>
            <Badge variant="default" className="text-xs">
              منتج مميز
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="aspect-square w-full rounded-lg overflow-hidden bg-background">
              <ImageWithFallback
                src={currentProduct.image_url || '/placeholder.svg'} 
                alt={currentProduct.title}
                className="w-full h-full object-cover"
                width={200}
                height={200}
                loading="lazy"
              />
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm line-clamp-2">
                {currentProduct.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {currentProduct.description || 'منتج مميز من أمازون'}
              </p>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary">
                    {currentProduct.price_range || 'اعرف السعر'}
                  </span>
                  {currentProduct.rating && (
                    <span className="text-xs text-amber-500">
                      ⭐ {currentProduct.rating}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {currentProduct.affiliate_partner}
                  </span>
                  <Badge variant="secondary" className="text-xs py-0">
                    {currentProduct.category}
                  </Badge>
                </div>
              </div>

              <Button
                size="sm"
                className="w-full"
                onClick={() => handleProductClick(currentProduct)}
              >
                <ShoppingCart className="h-3 w-3 mr-2" />
                تسوق الآن
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Amazon Prime Promotion */}
      <Card className="overflow-hidden border-2 border-amber-200 shadow-md bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary" className="text-xs">
              إعلان
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-100">
                Amazon Prime
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-200">
                شحن مجاني وسريع
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              اشترك في Prime واحصل على شحن مجاني لآلاف المنتجات
            </p>
            
            <Button 
              size="sm" 
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => window.open('https://amazon.sa/prime', '_blank')}
            >
              جرب Prime مجاناً
            </Button>
          </div>
        </div>
      </Card>

      {/* Indicator dots */}
      <div className="flex justify-center gap-1 py-2">
        {sidebarProducts.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
              index === currentProductIndex ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  );
};