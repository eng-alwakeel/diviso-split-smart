import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Crown, Star, ExternalLink } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAffiliateProducts } from '@/hooks/useAffiliateProducts';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { AD_SIZES } from '@/lib/adConfig';

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
        if (!Array.isArray(products)) products = [];
        
        if (products.length === 0) {
          products = await getTrendingProducts(3);
          if (!Array.isArray(products)) products = [];
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

  if (!Array.isArray(sidebarProducts) || sidebarProducts.length === 0) return null;

  const currentProduct = sidebarProducts[currentProductIndex];
  if (!currentProduct) return null;

  const handleProductClick = (product: any) => {
    if (product.affiliate_url) {
      window.open(product.affiliate_url, '_blank');
    }
  };

  const halfPageSize = AD_SIZES.desktop.halfPage;
  const mediumRectSize = AD_SIZES.desktop.mediumRectangle;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Featured Product Card - Half Page (300x600) */}
      <Card 
        className="overflow-hidden border-2 border-border/40 bg-gradient-to-br from-background/95 to-muted/20 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow"
        style={{
          width: `${halfPageSize.width}px`,
          minHeight: `${halfPageSize.height}px`
        }}
      >
        <div className="p-5 space-y-4">
          {/* Ad Badge */}
          <div className="flex items-center justify-between">
            <Badge 
              variant="outline" 
              className="text-sm font-medium border-2 bg-muted/50 text-muted-foreground px-3 py-1"
            >
              إعلان
            </Badge>
            <Badge variant="default" className="text-xs gap-1 font-medium">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              منتج مميز
            </Badge>
          </div>

          <div className="space-y-4">
            {/* Product Image - Square aspect ratio */}
            <div 
              className="w-full rounded-lg overflow-hidden bg-muted border border-border/30"
              style={{ height: '260px' }}
            >
              <ImageWithFallback
                src={currentProduct.image_url || '/placeholder.svg'}
                alt={currentProduct.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                width={260}
                height={260}
                loading="lazy"
              />
            </div>

            {/* Product Info */}
            <div className="space-y-3">
              <h3 className="font-bold text-base text-foreground line-clamp-2 leading-tight">
                {currentProduct.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                {currentProduct.description || 'منتج مميز من أمازون - جودة عالية وسعر مناسب'}
              </p>
              
              {/* Price & Rating */}
              <div className="space-y-2 pt-2">
                <p className="text-2xl font-bold text-primary">
                  {currentProduct.price_range || 'اعرف السعر'}
                </p>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(currentProduct.rating || 4)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted'
                      }`}
                    />
                  ))}
                  <span className="text-sm text-muted-foreground mr-1 font-medium">
                    ({currentProduct.rating || 4.0})
                  </span>
                </div>
              </div>

              {/* CTA Button */}
              <Button
                onClick={() => handleProductClick(currentProduct)}
                className="w-full gap-2 h-10 font-semibold"
              >
                <ShoppingCart className="h-4 w-4" />
                تسوق الآن
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Product Indicators */}
          <div className="flex justify-center gap-1.5 pt-2">
            {sidebarProducts.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 w-8 rounded-full transition-all duration-300 ${
                  index === currentProductIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
      </Card>

      {/* Amazon Prime Promotion - Medium Rectangle (300x250) */}
      <Card 
        className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-sm hover:shadow-md transition-shadow"
        style={{
          width: `${mediumRectSize.width}px`,
          minHeight: `${mediumRectSize.height}px`
        }}
      >
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <Badge 
              variant="outline" 
              className="text-sm font-medium border-2 bg-muted/50 text-muted-foreground px-3 py-1"
            >
              إعلان
            </Badge>
            <Crown className="h-5 w-5 text-primary" />
          </div>
          
          <div className="space-y-3">
            <h3 className="font-bold text-xl text-foreground">
              Amazon Prime
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              شحن مجاني، عروض حصرية، ومزايا أكثر
            </p>
            
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Star className="h-4 w-4 text-primary mt-0.5 flex-shrink-0 fill-primary" />
                <span>شحن مجاني سريع</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-4 w-4 text-primary mt-0.5 flex-shrink-0 fill-primary" />
                <span>عروض Prime Day حصرية</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-4 w-4 text-primary mt-0.5 flex-shrink-0 fill-primary" />
                <span>Prime Video & Music</span>
              </li>
            </ul>

            <Button
              onClick={() => window.open('https://www.amazon.sa/prime', '_blank')}
              className="w-full gap-2 mt-3 h-10 font-semibold"
            >
              جرّب Prime مجاناً
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};