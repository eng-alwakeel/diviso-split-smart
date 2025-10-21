import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { OptimizedImage } from '@/components/OptimizedImage';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { ExternalLink, Star, Tag, Sparkles, ShoppingCart } from 'lucide-react';
import { useAdTracking } from '@/hooks/useAdTracking';
import { useAffiliateProducts } from '@/hooks/useAffiliateProducts';
import { AD_SIZES } from '@/lib/adConfig';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProductCarouselAdProps {
  context: {
    type: 'expense' | 'group' | 'dashboard' | 'category';
    category?: string;
    groupType?: string;
    amount?: number;
  };
  placement: string;
  maxProducts?: number;
  autoRotate?: boolean;
  className?: string;
}

export const ProductCarouselAd: React.FC<ProductCarouselAdProps> = ({
  context,
  placement,
  maxProducts = 6,
  autoRotate = true,
  className = ''
}) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [api, setApi] = useState<any>();
  const isMobile = useIsMobile();
  
  const { shouldShowAds, trackAdImpression, trackAdClick } = useAdTracking();
  const { getProductsForExpenseCategory, getProductsForGroupType, getAmazonProducts } = useAffiliateProducts();

  // Get appropriate ad size based on device
  const adSize = isMobile 
    ? AD_SIZES.mobile.mediumRectangle 
    : AD_SIZES.desktop.mediumRectangle;

  useEffect(() => {
    if (shouldShowAds()) {
      loadProducts();
    }
  }, [context]);

  // Auto-rotate carousel
  useEffect(() => {
    if (!api || !autoRotate || products.length === 0) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 8000);

    return () => clearInterval(interval);
  }, [api, autoRotate, products]);

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
          ad_type: 'product_carousel',
          ad_category: context.category || 'general',
          placement,
          product_id: limitedProducts[0].product_id,
          affiliate_partner: limitedProducts[0].affiliate_partner
        });
      }
    } catch (error) {
      console.error('Error loading carousel products:', error);
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
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">منتجات مُوصى بها</h3>
        <Badge variant="outline" className="text-sm font-medium border-2 bg-muted/50 text-muted-foreground px-3 py-1.5 mr-auto">
          إعلان
        </Badge>
      </div>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card 
            key={index} 
            className="flex-shrink-0"
            style={{ width: `${adSize.width}px`, minHeight: `${adSize.height}px` }}
          >
            <Skeleton className="w-full h-[160px]" />
            <CardContent className="p-4">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2 mb-3" />
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">منتجات مُوصى بها</h3>
        <Badge variant="outline" className="text-sm font-medium border-2 bg-muted/50 text-muted-foreground px-3 py-1.5 mr-auto">
          إعلان
        </Badge>
      </div>
      
      <Carousel
        opts={{
          align: "start",
          loop: true,
          direction: "rtl",
        }}
        setApi={setApi}
        className="w-full"
      >
        <CarouselContent className="-ml-3 md:-ml-4">
          {products.map((product) => (
            <CarouselItem key={product.id} className="pl-3 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3">
              <Card 
                className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group h-full border-2"
                style={{ width: `${adSize.width}px`, minHeight: `${adSize.height}px` }}
                onClick={() => handleProductClick(product)}
              >
                {/* Image Section */}
                <div className="relative w-full h-[160px] bg-muted overflow-hidden" style={{ aspectRatio: '1/1' }}>
                  <OptimizedImage
                    src={product.image_url || 'https://via.placeholder.com/300x250?text=Product'}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    width={adSize.width}
                    height={160}
                    loading="lazy"
                    onError={() => {}}
                  />
                  
                  {/* Partner Badge */}
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="text-xs bg-background/90 backdrop-blur-sm border">
                      <Tag className="h-3 w-3 ml-1" />
                      {product.affiliate_partner === 'amazon' ? 'أمازون' : product.affiliate_partner}
                    </Badge>
                  </div>

                  {/* Rating Badge */}
                  {product.rating && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="text-xs bg-background/90 backdrop-blur-sm border">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 ml-1" />
                        {product.rating}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <CardContent className="p-4 flex flex-col gap-2">
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
                    className="w-full h-9 gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProductClick(product);
                    }}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    تسوق الآن
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>
    </div>
  );
};
