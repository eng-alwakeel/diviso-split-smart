import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, RotateCcw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { useAffiliateProducts } from '@/hooks/useAffiliateProducts';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { useIsMobile } from '@/hooks/use-mobile';
import { AD_SIZES } from '@/lib/adConfig';

interface PersistentAdBannerProps {
  placement: string;
  className?: string;
}

export const PersistentAdBanner: React.FC<PersistentAdBannerProps> = ({
  placement,
  className = ''
}) => {
  const { subscription } = useSubscription();
  const { getTrendingProducts } = useAffiliateProducts();
  const isMobile = useIsMobile();
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Don't show ads for paid subscribers
  const isFreePlan = !subscription || subscription.status !== 'active';

  // Get appropriate ad size based on device
  const adSize = isMobile 
    ? AD_SIZES.mobile.largeBanner 
    : AD_SIZES.desktop.leaderboard;

  // Load trending products from database
  useEffect(() => {
    const loadProducts = async () => {
      if (!isFreePlan) return;
      
      setLoading(true);
      try {
        const trendingProducts = await getTrendingProducts(3);
        setProducts(trendingProducts);
      } catch (error) {
        console.error('Error loading products:', error);
        // Fallback to sample data if needed
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [isFreePlan, getTrendingProducts]);

  useEffect(() => {
    if (!isFreePlan || products.length === 0) return;

    const interval = setInterval(() => {
      setIsRotating(true);
      setTimeout(() => {
        setCurrentAdIndex((prev) => (prev + 1) % products.length);
        setIsRotating(false);
      }, 300);
    }, 15000); // Rotate every 15 seconds

    return () => clearInterval(interval);
  }, [isFreePlan, products.length]);

  if (!isFreePlan || loading) return null;

  if (products.length === 0) return null;

  const currentProduct = products[currentAdIndex];

  const handleAdClick = () => {
    if (currentProduct.affiliate_url) {
      window.open(currentProduct.affiliate_url, '_blank');
    }
  };

  return (
    <Card 
      className={`relative overflow-hidden border-2 border-border/40 bg-gradient-to-r from-background/95 to-muted/20 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow ${className}`}
      style={{
        minHeight: `${adSize.height}px`,
        maxWidth: isMobile ? '100%' : `${adSize.width}px`,
        margin: '0 auto'
      }}
    >
      <div className="p-4 space-y-3">
        {/* Ad Badge - Enhanced visibility */}
        <div className="flex items-center justify-between">
          <Badge 
            variant="outline" 
            className="text-sm font-medium border-2 bg-muted/50 text-muted-foreground px-3 py-1"
          >
            إعلان
          </Badge>
          <div className="flex items-center gap-1.5">
            <RotateCcw className={`h-3.5 w-3.5 text-muted-foreground ${isRotating ? 'animate-spin' : ''}`} />
            <span className="text-xs text-muted-foreground font-medium">
              {currentAdIndex + 1}/{products.length}
            </span>
          </div>
        </div>

        {/* Ad Content */}
        <div className={`grid grid-cols-[auto,1fr,auto] gap-4 items-center transition-opacity duration-300 ${isRotating ? 'opacity-50' : 'opacity-100'}`}>
          {/* Product Image - Fixed aspect ratio */}
          <div 
            className="rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border/30"
            style={{ width: '64px', height: '64px' }}
          >
            <ImageWithFallback
              src={currentProduct.image_url || '/placeholder.svg'} 
              alt={currentProduct.title}
              className="w-full h-full object-cover"
              width={64}
              height={64}
              loading="lazy"
            />
          </div>

          {/* Product Info */}
          <div className="min-w-0 space-y-1.5">
            <h4 className="font-semibold text-sm text-foreground line-clamp-1">
              {currentProduct.title}
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {currentProduct.description || 'منتج مميز من أمازون'}
            </p>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-primary">
                {currentProduct.price_range || 'اعرف السعر'}
              </span>
              <span className="text-muted-foreground">• {currentProduct.affiliate_partner}</span>
            </div>
          </div>

          {/* CTA Button - Enhanced */}
          <Button
            size="sm"
            onClick={handleAdClick}
            className="flex-shrink-0 h-9 px-4 gap-2 font-medium"
          >
            <ShoppingCart className="h-4 w-4" />
            تسوق الآن
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>

        {/* Progress Indicators */}
        <div className="flex justify-center gap-1.5 pt-2">
          {products.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 w-8 rounded-full transition-all duration-300 ${
                index === currentAdIndex ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    </Card>
  );
};