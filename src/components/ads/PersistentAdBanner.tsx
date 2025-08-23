import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { useAffiliateProducts } from '@/hooks/useAffiliateProducts';
import { ImageWithFallback } from '@/components/ImageWithFallback';

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
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Don't show ads for paid subscribers
  const isFreePlan = !subscription || subscription.status !== 'active';

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
    <Card className={`relative overflow-hidden border-border/50 bg-gradient-to-r from-background/95 to-muted/30 backdrop-blur-sm ${className}`}>
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            إعلان
          </Badge>
          <div className="flex items-center gap-1">
            <RotateCcw className={`h-3 w-3 text-muted-foreground ${isRotating ? 'animate-spin' : ''}`} />
            <span className="text-xs text-muted-foreground">
              {currentAdIndex + 1}/{products.length}
            </span>
          </div>
        </div>

        <div className={`grid grid-cols-[auto,1fr,auto] gap-3 items-center transition-opacity duration-300 ${isRotating ? 'opacity-50' : 'opacity-100'}`}>
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            <ImageWithFallback
              src={currentProduct.image_url || '/placeholder.svg'} 
              alt={currentProduct.title}
              className="w-full h-full object-cover"
              width={48}
              height={48}
              loading="lazy"
            />
          </div>

          <div className="min-w-0 space-y-1">
            <h4 className="font-medium text-sm text-foreground line-clamp-1">
              {currentProduct.title}
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {currentProduct.description || 'منتج مميز من أمازون'}
            </p>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-primary">
                {currentProduct.price_range || 'اعرف السعر'}
              </span>
              <span className="text-muted-foreground">• {currentProduct.affiliate_partner}</span>
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleAdClick}
            className="flex-shrink-0 h-8 px-3"
          >
            <ShoppingCart className="h-3 w-3 mr-1" />
            تسوق
          </Button>
        </div>

        <div className="flex justify-center gap-1 pt-1">
          {products.map((_, index) => (
            <div
              key={index}
              className={`h-1 w-6 rounded-full transition-all duration-300 ${
                index === currentAdIndex ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    </Card>
  );
};