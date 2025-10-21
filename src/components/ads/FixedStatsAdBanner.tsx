import { useState, useEffect, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, ExternalLink, ShoppingCart } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useOptimizedAffiliateProducts } from "@/hooks/useOptimizedAffiliateProducts";
import { useOptimizedAdTracking } from "@/hooks/useOptimizedAdTracking";
import { useToast } from "@/hooks/use-toast";
import { AD_SIZES } from "@/lib/adConfig";
import { useIsMobile } from "@/hooks/use-mobile";

interface FixedStatsAdBannerProps {
  placement: string;
  className?: string;
}

export const FixedStatsAdBanner = memo(({ placement, className = "" }: FixedStatsAdBannerProps) => {
  const { subscription } = useSubscription();
  const { getTrendingProducts, loading } = useOptimizedAffiliateProducts();
  const { trackAdImpression, trackAdClick, shouldShowAds } = useOptimizedAdTracking();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [products, setProducts] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [impressionId, setImpressionId] = useState<string>("");

  // Get appropriate ad size based on device
  const adSize = isMobile 
    ? AD_SIZES.mobile.largeBanner 
    : AD_SIZES.desktop.leaderboard;

  // Load trending products
  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      if (shouldShowAds()) {
        try {
          const data = await getTrendingProducts(5);
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
  }, []);

  // Track impression when product changes
  useEffect(() => {
    let isMounted = true;

    if (products.length > 0 && shouldShowAds()) {
      const currentProduct = products[currentIndex];
      const trackImpression = async () => {
        try {
          if (isMounted) {
            await trackAdImpression({
              ad_type: 'stats_banner',
              placement: placement,
              product_id: currentProduct.product_id,
              affiliate_partner: currentProduct.affiliate_partner
            });
            if (isMounted) {
              setImpressionId(currentProduct.id);
            }
          }
        } catch (error) {
          console.error("Error tracking impression:", error);
        }
      };

      trackImpression();
    }

    return () => {
      isMounted = false;
    };
  }, [currentIndex, products, placement]);

  // Auto-rotate every 20 seconds
  useEffect(() => {
    if (products.length <= 1) return;

    const interval = setInterval(() => {
      setIsRotating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % products.length);
        setIsRotating(false);
      }, 300);
    }, 20000);

    return () => clearInterval(interval);
  }, [products.length]);

  // Handle product click
  const handleClick = async () => {
    try {
      const currentProduct = products[currentIndex];
      
      // Track click
      if (impressionId) {
        await trackAdClick(impressionId, currentProduct.product_id);
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
  };

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
      <Card 
        className={`w-full border-2 border-primary/10 ${className}`}
        style={{ minHeight: `${adSize.height}px` }}
      >
        <CardContent className="p-4 flex items-center gap-4">
          <Skeleton className="w-20 h-20 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
          <Skeleton className="h-9 w-28 flex-shrink-0" />
        </CardContent>
      </Card>
    );
  }

  const currentProduct = products[currentIndex];

  return (
    <Card 
      className={`w-full border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent hover:shadow-lg transition-all duration-300 ${
        isRotating ? 'opacity-50' : 'opacity-100'
      } ${className}`}
      style={{ minHeight: `${adSize.height}px` }}
    >
      <CardContent className="p-4 flex items-center gap-4">
        {/* Ad Badge */}
        <Badge variant="outline" className="absolute top-2 right-2 text-sm font-medium border-2 bg-muted/50 text-muted-foreground px-3 py-1.5">
          إعلان
        </Badge>

        {/* صورة المنتج */}
        <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted border-2"
             style={{ aspectRatio: '1/1' }}>
          {currentProduct.image_url ? (
            <img
              src={currentProduct.image_url}
              alt={currentProduct.title}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* معلومات المنتج */}
        <div className="flex-1 min-w-0 space-y-1">
          <h4 className="text-sm font-semibold leading-tight line-clamp-1">
            {currentProduct.title}
          </h4>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {currentProduct.description || "منتج موصى به"}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {currentProduct.price_range && (
              <Badge variant="secondary" className="text-xs font-semibold">
                {currentProduct.price_range}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs border-primary/30 text-primary font-medium">
              عرض خاص
            </Badge>
            {currentProduct.rating && (
              <span className="text-xs text-muted-foreground font-medium">
                ⭐ {currentProduct.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        {/* زر التسوق */}
        <Button
          size="sm"
          onClick={handleClick}
          className="flex-shrink-0 gap-2 h-9 px-4"
        >
          <ShoppingCart className="w-4 h-4" />
          تسوق الآن
          <ExternalLink className="w-3 h-3" />
        </Button>
      </CardContent>

      {/* Pagination dots */}
      {products.length > 1 && (
        <div className="flex justify-center gap-1 pb-2">
          {products.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "w-6 bg-primary"
                  : "w-1.5 bg-primary/30"
              }`}
            />
          ))}
        </div>
      )}
    </Card>
  );
});

FixedStatsAdBanner.displayName = 'FixedStatsAdBanner';
