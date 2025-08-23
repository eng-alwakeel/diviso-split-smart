import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';

interface PersistentAdBannerProps {
  placement: string;
  className?: string;
}

const sampleAds = [
  {
    title: 'عروض أمازون الحصرية',
    description: 'خصم 50% على الإلكترونيات والأجهزة المنزلية',
    price: 'من 199 ريال',
    partner: 'Amazon.sa',
    url: 'https://amazon.sa',
    image: '/lovable-uploads/e7669fe3-f50f-4cdc-95ba-1e72e597c9c2.png'
  },
  {
    title: 'أدوات التوفير المالي',
    description: 'اكتشف أفضل التطبيقات لإدارة أموالك بذكاء',
    price: 'مجاناً',
    partner: 'تطبيقات مالية',
    url: '#',
    image: '/lovable-uploads/e7669fe3-f50f-4cdc-95ba-1e72e597c9c2.png'
  },
  {
    title: 'بطاقات الائتمان المميزة',
    description: 'احصل على أفضل المزايا والكاش باك',
    price: 'بدون رسوم سنوية',
    partner: 'البنوك الشريكة',
    url: '#',
    image: '/lovable-uploads/e7669fe3-f50f-4cdc-95ba-1e72e597c9c2.png'
  }
];

export const PersistentAdBanner: React.FC<PersistentAdBannerProps> = ({
  placement,
  className = ''
}) => {
  const { subscription } = useSubscription();
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(false);

  // Don't show ads for paid subscribers
  const isFreePlan = !subscription || subscription.status !== 'active';

  useEffect(() => {
    if (!isFreePlan) return;

    const interval = setInterval(() => {
      setIsRotating(true);
      setTimeout(() => {
        setCurrentAdIndex((prev) => (prev + 1) % sampleAds.length);
        setIsRotating(false);
      }, 300);
    }, 15000); // Rotate every 15 seconds

    return () => clearInterval(interval);
  }, [isFreePlan]);

  if (!isFreePlan) return null;

  const currentAd = sampleAds[currentAdIndex];

  const handleAdClick = () => {
    if (currentAd.url !== '#') {
      window.open(currentAd.url, '_blank');
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
              {currentAdIndex + 1}/{sampleAds.length}
            </span>
          </div>
        </div>

        <div className={`grid grid-cols-[auto,1fr,auto] gap-3 items-center transition-opacity duration-300 ${isRotating ? 'opacity-50' : 'opacity-100'}`}>
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            <img 
              src={currentAd.image} 
              alt={currentAd.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="min-w-0 space-y-1">
            <h4 className="font-medium text-sm text-foreground line-clamp-1">
              {currentAd.title}
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {currentAd.description}
            </p>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-primary">{currentAd.price}</span>
              <span className="text-muted-foreground">• {currentAd.partner}</span>
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
          {sampleAds.map((_, index) => (
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