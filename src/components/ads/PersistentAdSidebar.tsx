import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Crown, Zap } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

export const PersistentAdSidebar: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  const { subscription } = useSubscription();
  const [currentProductIndex, setCurrentProductIndex] = useState(0);

  // Don't show ads for paid subscribers
  const isFreePlan = !subscription || subscription.status !== 'active';

  const sidebarProducts = [
    {
      id: 1,
      title: 'آيفون 15 برو',
      description: 'أحدث إصدار من آبل بمواصفات متطورة',
      price: '4,999 ريال',
      originalPrice: '5,299 ريال',
      partner: 'Amazon.sa',
      category: 'electronics',
      image: '/lovable-uploads/e7669fe3-f50f-4cdc-95ba-1e72e597c9c2.png',
      discount: '6%',
      url: 'https://amazon.sa'
    },
    {
      id: 2,
      title: 'كتاب الاستثمار الذكي',
      description: 'دليلك الشامل للاستثمار والادخار',
      price: '89 ريال',
      originalPrice: '120 ريال',
      partner: 'Jarir Bookstore',
      category: 'finance',
      image: '/lovable-uploads/e7669fe3-f50f-4cdc-95ba-1e72e597c9c2.png',
      discount: '26%',
      url: '#'
    },
    {
      id: 3,
      title: 'ساعة ذكية سامسونج',
      description: 'تتبع الصحة واللياقة البدنية',
      price: '799 ريال',
      originalPrice: '999 ريال',
      partner: 'Extra',
      category: 'electronics',
      image: '/lovable-uploads/e7669fe3-f50f-4cdc-95ba-1e72e597c9c2.png',
      discount: '20%',
      url: '#'
    }
  ];

  useEffect(() => {
    if (!isFreePlan) return;

    const interval = setInterval(() => {
      setCurrentProductIndex((prev) => (prev + 1) % sidebarProducts.length);
    }, 12000); // Rotate every 12 seconds

    return () => clearInterval(interval);
  }, [isFreePlan]);

  if (!isFreePlan) return null;

  const handleProductClick = (product: typeof sidebarProducts[0]) => {
    if (product.url !== '#') {
      window.open(product.url, '_blank');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Featured Product */}
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="default" className="text-xs">
              منتج مميز
            </Badge>
            <Crown className="h-4 w-4 text-primary" />
          </div>

          <div className="space-y-3">
            <div className="aspect-square w-full rounded-lg overflow-hidden bg-background">
              <img 
                src={sidebarProducts[currentProductIndex].image} 
                alt={sidebarProducts[currentProductIndex].title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm line-clamp-2">
                {sidebarProducts[currentProductIndex].title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {sidebarProducts[currentProductIndex].description}
              </p>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary">
                    {sidebarProducts[currentProductIndex].price}
                  </span>
                  {sidebarProducts[currentProductIndex].originalPrice && (
                    <span className="text-xs text-muted-foreground line-through">
                      {sidebarProducts[currentProductIndex].originalPrice}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {sidebarProducts[currentProductIndex].partner}
                  </span>
                  {sidebarProducts[currentProductIndex].discount && (
                    <Badge variant="destructive" className="text-xs py-0">
                      خصم {sidebarProducts[currentProductIndex].discount}
                    </Badge>
                  )}
                </div>
              </div>

              <Button
                size="sm"
                className="w-full"
                onClick={() => handleProductClick(sidebarProducts[currentProductIndex])}
              >
                <ShoppingCart className="h-3 w-3 mr-2" />
                تسوق الآن
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Amazon Prime Promotion */}
      <Card className="overflow-hidden border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
        <div className="p-4 space-y-3">
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