import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Crown, Star, ExternalLink } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAffiliateProducts } from '@/hooks/useAffiliateProducts';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { AD_SIZES, ENABLE_AMAZON_ADS } from '@/lib/adConfig';

// مكون إعلان منتج مميز - 300x250
const ProductAdCard = ({ 
  product, 
  onClick,
  index 
}: { 
  product: any; 
  onClick: () => void;
  index: number;
}) => {
  const adSize = AD_SIZES.desktop.mediumRectangle;

  return (
    <Card 
      className="overflow-hidden border-2 border-border/40 bg-gradient-to-br from-background/95 to-muted/20 backdrop-blur-sm shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 animate-fade-in"
      style={{
        width: `${adSize.width}px`,
        minHeight: `${adSize.height}px`
      }}
    >
      <div className="p-4 space-y-3">
        {/* Ad Badge */}
        <div className="flex items-center justify-between">
          <Badge 
            variant="outline" 
            className="text-xs font-medium border-2 bg-muted/50 text-muted-foreground px-2 py-0.5"
          >
            إعلان
          </Badge>
          <Badge variant="default" className="text-xs gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            مميز
          </Badge>
        </div>

        {/* Product Image - Smaller */}
        <div 
          className="w-full rounded-lg overflow-hidden bg-muted border border-border/30"
          style={{ height: '120px' }}
        >
          <ImageWithFallback
            src={product.image_url || '/placeholder.svg'}
            alt={product.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            width={120}
            height={120}
            loading="lazy"
          />
        </div>

        {/* Product Info - Compact */}
        <div className="space-y-2">
          <h3 className="font-bold text-sm text-foreground line-clamp-1 leading-tight">
            {product.title}
          </h3>
          
          {/* Price & Rating */}
          <div className="space-y-1">
            <p className="text-lg font-bold text-primary">
              {product.price_range || 'اعرف السعر'}
            </p>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(product.rating || 4)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted'
                  }`}
                />
              ))}
              <span className="text-xs text-muted-foreground mr-1">
                ({product.rating || 4.0})
              </span>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={onClick}
            size="sm"
            className="w-full gap-1.5 h-9 text-sm font-semibold"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            تسوق الآن
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export const PersistentAdSidebar: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  // ✅ إذا كانت الإعلانات معطلة: لا تعرض شيء
  if (!ENABLE_AMAZON_ADS) {
    return null;
  }

  const { subscription } = useSubscription();
  const { getTrendingProducts, getAmazonProducts } = useAffiliateProducts();
  const [productIndexes, setProductIndexes] = useState([0, 1, 2]); // 3 إعلانات
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
          products = await getTrendingProducts(6);
          if (!Array.isArray(products)) products = [];
        }
        setSidebarProducts(products.slice(0, 6)); // 6 منتجات للدوران
      } catch (error) {
        console.error('Error loading sidebar products:', error);
        setSidebarProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [isFreePlan, getTrendingProducts, getAmazonProducts]);

  // دوران متداخل - كل إعلان يدور كل 12 ثانية مع تأخير 4 ثواني
  useEffect(() => {
    if (!isFreePlan || sidebarProducts.length < 6) return;

    const intervals = [
      setInterval(() => {
        setProductIndexes(prev => [(prev[0] + 3) % sidebarProducts.length, prev[1], prev[2]]);
      }, 12000),
      
      setInterval(() => {
        setProductIndexes(prev => [prev[0], (prev[1] + 3) % sidebarProducts.length, prev[2]]);
      }, 16000), // تأخير 4 ثواني
      
      setInterval(() => {
        setProductIndexes(prev => [prev[0], prev[1], (prev[2] + 3) % sidebarProducts.length]);
      }, 20000), // تأخير 8 ثواني
    ];

    return () => intervals.forEach(clearInterval);
  }, [isFreePlan, sidebarProducts.length]);

  if (!isFreePlan || loading) return null;

  if (!Array.isArray(sidebarProducts) || sidebarProducts.length === 0) return null;

  const handleProductClick = (product: any) => {
    if (product.affiliate_url) {
      window.open(product.affiliate_url, '_blank');
    }
  };

  const mediumRectSize = AD_SIZES.desktop.mediumRectangle;

  // 3 إعلانات منتجات بمقاس 300x250
  const ad1Product = sidebarProducts[productIndexes[0]];
  const ad2Product = sidebarProducts[productIndexes[1]];
  const ad3Product = sidebarProducts[productIndexes[2]];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* إعلان 1 - منتج مميز */}
      {ad1Product && (
        <ProductAdCard 
          product={ad1Product}
          onClick={() => handleProductClick(ad1Product)}
          index={0}
        />
      )}

      {/* إعلان 2 - منتج ثاني */}
      {ad2Product && (
        <ProductAdCard 
          product={ad2Product}
          onClick={() => handleProductClick(ad2Product)}
          index={1}
        />
      )}

      {/* إعلان 3 - Amazon Prime */}
      <Card 
        className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 animate-fade-in"
        style={{
          width: `${mediumRectSize.width}px`,
          minHeight: `${mediumRectSize.height}px`
        }}
      >
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Badge 
              variant="outline" 
              className="text-xs font-medium border-2 bg-muted/50 text-muted-foreground px-2 py-0.5"
            >
              إعلان
            </Badge>
            <Crown className="h-4 w-4 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-bold text-lg text-foreground">
              Amazon Prime
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              شحن مجاني، عروض حصرية، ومزايا أكثر
            </p>
            
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-1.5">
                <Star className="h-3 w-3 text-primary mt-0.5 flex-shrink-0 fill-primary" />
                <span>شحن مجاني سريع</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Star className="h-3 w-3 text-primary mt-0.5 flex-shrink-0 fill-primary" />
                <span>عروض Prime Day حصرية</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Star className="h-3 w-3 text-primary mt-0.5 flex-shrink-0 fill-primary" />
                <span>Prime Video & Music</span>
              </li>
            </ul>

            <Button
              onClick={() => window.open('https://www.amazon.sa/prime', '_blank')}
              size="sm"
              className="w-full gap-1.5 mt-2 h-9 text-sm font-semibold"
            >
              جرّب Prime مجاناً
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};