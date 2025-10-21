import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, ExternalLink } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAffiliateProducts } from "@/hooks/useAffiliateProducts";
import { useAdTracking } from "@/hooks/useAdTracking";
import { useToast } from "@/hooks/use-toast";

interface FixedStatsAdBannerProps {
  placement: string;
  className?: string;
}

export const FixedStatsAdBanner = ({ placement, className = "" }: FixedStatsAdBannerProps) => {
  const { subscription } = useSubscription();
  const { getTrendingProducts, loading } = useAffiliateProducts();
  const { trackAdImpression, trackAdClick, shouldShowAds } = useAdTracking();
  const { toast } = useToast();

  const [products, setProducts] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [impressionId, setImpressionId] = useState<string>("");

  // Load trending products
  useEffect(() => {
    const loadProducts = async () => {
      if (shouldShowAds()) {
        const data = await getTrendingProducts(5);
        setProducts(data);
      }
    };

    loadProducts();
  }, []);

  // Track impression when product changes
  useEffect(() => {
    if (products.length > 0 && shouldShowAds()) {
      const currentProduct = products[currentIndex];
      const trackImpression = async () => {
        try {
          await trackAdImpression({
            ad_type: 'stats_banner',
            placement: placement,
            product_id: currentProduct.product_id,
            affiliate_partner: currentProduct.affiliate_partner
          });
          // Store impression ID from product for tracking
          setImpressionId(currentProduct.id);
        } catch (error) {
          console.error("Error tracking impression:", error);
        }
      };

      trackImpression();
    }
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
      <Card className={`w-full border-2 border-primary/10 ${className}`}>
        <CardContent className="p-4 flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
          <Skeleton className="h-9 w-24 flex-shrink-0" />
        </CardContent>
      </Card>
    );
  }

  const currentProduct = products[currentIndex];

  return (
    <Card 
      className={`w-full border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent hover:shadow-md transition-all duration-300 ${
        isRotating ? 'opacity-50' : 'opacity-100'
      } ${className}`}
    >
      <CardContent className="p-4 flex items-center gap-4">
        {/* صورة المنتج */}
        <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
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
              <Badge variant="secondary" className="text-xs">
                {currentProduct.price_range}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">
              عرض خاص
            </Badge>
            {currentProduct.rating && (
              <span className="text-xs text-muted-foreground">
                ⭐ {currentProduct.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        {/* زر التسوق */}
        <Button
          size="sm"
          onClick={handleClick}
          className="flex-shrink-0 gap-1"
        >
          <ShoppingBag className="w-3 h-3" />
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
};
