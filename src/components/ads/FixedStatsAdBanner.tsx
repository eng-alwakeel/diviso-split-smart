import { useState, useEffect, memo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, ExternalLink, ShoppingCart, Star } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useOptimizedAffiliateProducts } from "@/hooks/useOptimizedAffiliateProducts";
import { useOptimizedAdTracking } from "@/hooks/useOptimizedAdTracking";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface FixedStatsAdBannerProps {
  placement: string;
  className?: string;
  maxAds?: number;
}

interface ProductAdCardProps {
  product: any;
  slotIndex: number;
  impressionId: string;
  onTrackClick: (slotIndex: number) => void;
  isRotating: boolean;
}

const ProductAdCard = memo(({ product, slotIndex, impressionId, onTrackClick, isRotating }: ProductAdCardProps) => {
  return (
    <Card 
      className={`w-full border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent hover:shadow-lg hover:scale-[1.02] transition-all duration-300 ${
        isRotating ? 'opacity-50' : 'opacity-100'
      }`}
      style={{ width: '300px', height: '250px' }}
    >
      <CardContent className="p-4 flex flex-col h-full relative">
        {/* Ad Badge */}
        <Badge 
          variant="outline" 
          className="absolute top-2 left-2 text-xs font-medium border bg-muted/80 text-muted-foreground px-2 py-0.5 z-10"
        >
          إعلان
        </Badge>

        {/* صورة المنتج */}
        <div className="w-full flex justify-center mb-3 mt-2">
          <div className="w-[120px] h-[120px] rounded-lg overflow-hidden bg-muted border-2 flex-shrink-0">
            {product?.image_url ? (
              <img
                src={product.image_url}
                alt={product.title}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* معلومات المنتج */}
        <div className="flex-1 flex flex-col space-y-1.5">
          <h4 className="text-sm font-semibold leading-tight line-clamp-1 text-center">
            {product?.title || "منتج مميز"}
          </h4>
          <p className="text-xs text-muted-foreground line-clamp-1 text-center">
            {product?.description || "عرض خاص"}
          </p>
          
          <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
            {product?.price_range && (
              <Badge variant="secondary" className="text-xs font-semibold">
                {product.price_range}
              </Badge>
            )}
            {product?.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                <span className="text-xs font-medium">
                  {product.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* زر التسوق */}
        <Button
          size="sm"
          onClick={() => onTrackClick(slotIndex)}
          className="w-full gap-2 h-9 mt-2"
        >
          <ShoppingCart className="w-4 h-4" />
          تسوق الآن
          <ExternalLink className="w-3 h-3" />
        </Button>

        {/* Pagination dots */}
        <div className="flex justify-center gap-1 mt-2">
          {[0, 1].map((dot) => (
            <div
              key={dot}
              className={`h-1 w-1 rounded-full ${
                dot === 0 ? "bg-primary" : "bg-primary/30"
              }`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

ProductAdCard.displayName = 'ProductAdCard';

export const FixedStatsAdBanner = memo(({ placement, className = "", maxAds = 3 }: FixedStatsAdBannerProps) => {
  const { subscription } = useSubscription();
  const { getTrendingProducts, loading } = useOptimizedAffiliateProducts();
  const { trackAdImpression, trackAdClick, shouldShowAds } = useOptimizedAdTracking();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Calculate how many ads to display based on screen size
  const displayCount = isMobile ? 1 : maxAds;

  const [products, setProducts] = useState<any[]>([]);
  const [productIndexes, setProductIndexes] = useState(() => 
    Array.from({ length: maxAds }, (_, i) => i)
  );
  const [isRotating, setIsRotating] = useState(() => 
    Array.from({ length: maxAds }, () => false)
  );
  const [impressionIds, setImpressionIds] = useState<string[]>(() => 
    Array.from({ length: maxAds }, () => "")
  );

  // Load products (double the maxAds for rotation)
  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      if (shouldShowAds()) {
        try {
          const data = await getTrendingProducts(maxAds * 2);
          if (isMounted && data && data.length > 0) {
            setProducts(data);
          }
        } catch (error) {
          console.error("Error loading products:", error);
        }
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [maxAds]);

  // Track impressions for each ad slot
  useEffect(() => {
    if (products.length === 0 || !shouldShowAds()) return;

    const trackImpressions = async () => {
      const newImpressionIds: string[] = [];
      
      for (let i = 0; i < displayCount; i++) {
        const productIndex = productIndexes[i];
        if (productIndex < products.length) {
          const product = products[productIndex];
          try {
            await trackAdImpression({
              ad_type: 'stats_banner_grid',
              placement: `${placement}_slot_${i}`,
              product_id: product.product_id,
              affiliate_partner: product.affiliate_partner
            });
            newImpressionIds[i] = product.id;
          } catch (error) {
            console.error(`Error tracking impression for slot ${i}:`, error);
            newImpressionIds[i] = "";
          }
        }
      }
      
      setImpressionIds(newImpressionIds);
    };

    trackImpressions();
  }, [productIndexes, products, placement, displayCount]);

  // Staggered rotation for each ad (12 seconds interval, 4 seconds delay between slots)
  useEffect(() => {
    if (products.length < maxAds * 2) return;

    const intervals: NodeJS.Timeout[] = [];

    // Start rotation for each slot with staggered delay
    Array.from({ length: displayCount }, (_, i) => i).forEach((slotIndex) => {
      const delay = slotIndex * 4000; // 0s, 4s, 8s, etc.

      // Initial delayed start
      const initialTimeout = setTimeout(() => {
        // Set up interval for continuous rotation
        const interval = setInterval(() => {
          setIsRotating(prev => {
            const newRotating = [...prev];
            newRotating[slotIndex] = true;
            return newRotating;
          });

          setTimeout(() => {
            setProductIndexes((prev) => {
              const newIndexes = [...prev];
              // On mobile (displayCount=1), rotate through ALL products
              // On desktop, rotate through maxAds products
              newIndexes[slotIndex] = isMobile 
                ? (newIndexes[slotIndex] + 1) % products.length
                : (newIndexes[slotIndex] + maxAds) % products.length;
              return newIndexes;
            });
            
            setIsRotating(prev => {
              const newRotating = [...prev];
              newRotating[slotIndex] = false;
              return newRotating;
            });
          }, 300);
        }, 12000); // Rotate every 12 seconds

        intervals.push(interval);
      }, delay);

      return () => clearTimeout(initialTimeout);
    });

    return () => {
      intervals.forEach(interval => clearInterval(interval));
    };
  }, [products.length, maxAds, displayCount, isMobile]);

  // Handle product click
  const handleClick = useCallback(async (slotIndex: number) => {
    try {
      const productIndex = productIndexes[slotIndex];
      const currentProduct = products[productIndex];
      
      // Track click
      if (impressionIds[slotIndex]) {
        await trackAdClick(impressionIds[slotIndex], currentProduct.product_id);
      }

      // Open affiliate link
      window.open(currentProduct.affiliate_url, "_blank", "noopener,noreferrer");

      // Show toast
      toast({
        title: "شكراً لدعمك! 💚",
        description: "تم فتح رابط المنتج في نافذة جديدة",
      });
    } catch (error) {
      console.error("Error handling click:", error);
    }
  }, [productIndexes, products, impressionIds, trackAdClick, toast]);

  // Don't show for active subscribers (non-free plans)
  if (subscription?.status === 'active' && subscription?.plan && subscription.plan !== 'free' as any) {
    return null;
  }

  // Don't show if user preferences disable ads
  if (!shouldShowAds()) {
    return null;
  }

  // Loading state
  if (loading || products.length === 0) {
    return (
      <div className={`grid gap-4 w-full justify-items-center ${
        maxAds === 2 
          ? "grid-cols-1 md:grid-cols-2" 
          : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      } ${className}`}>
        {Array.from({ length: displayCount }, (_, i) => i).map((i) => (
          <Card 
            key={i}
            className="border-2 border-primary/10"
            style={{ width: '300px', height: '250px' }}
          >
            <CardContent className="p-4 flex flex-col items-center space-y-3">
              <Skeleton className="w-[120px] h-[120px] rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid gap-4 w-full justify-items-center ${
      maxAds === 2 
        ? "grid-cols-1 md:grid-cols-2" 
        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
    } ${className}`}>
      {Array.from({ length: displayCount }, (_, i) => i).map((slotIndex) => {
        const productIndex = productIndexes[slotIndex];
        const product = products[productIndex];
        
        return (
          <ProductAdCard
            key={slotIndex}
            product={product}
            slotIndex={slotIndex}
            impressionId={impressionIds[slotIndex]}
            onTrackClick={handleClick}
            isRotating={isRotating[slotIndex]}
          />
        );
      })}
    </div>
  );
});

FixedStatsAdBanner.displayName = 'FixedStatsAdBanner';
