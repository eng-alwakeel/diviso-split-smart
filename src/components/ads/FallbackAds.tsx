import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Smartphone, Laptop, Coffee } from 'lucide-react';

interface FallbackAdsProps {
  placement?: string;
  className?: string;
}

export const FallbackAds: React.FC<FallbackAdsProps> = ({
  placement = 'sidebar',
  className = ''
}) => {
  const fallbackAds = [
    {
      id: 'amazon-electronics',
      title: 'أجهزة إلكترونية مميزة',
      description: 'اكتشف أحدث الهواتف واللابتوبات',
      icon: <Smartphone className="h-8 w-8 text-blue-600" />,
      cta: 'تسوق الآن',
      url: 'https://amazon.sa',
      color: 'from-blue-50 to-blue-100',
      border: 'border-blue-200'
    },
    {
      id: 'amazon-home',
      title: 'أدوات منزلية ذكية',
      description: 'حوّل منزلك لمنزل ذكي',
      icon: <Laptop className="h-8 w-8 text-green-600" />,
      cta: 'اكتشف المزيد',
      url: 'https://amazon.sa',
      color: 'from-green-50 to-green-100',
      border: 'border-green-200'
    },
    {
      id: 'amazon-kitchen',
      title: 'أدوات مطبخ حديثة',
      description: 'كل ما تحتاجه للطبخ الاحترافي',
      icon: <Coffee className="h-8 w-8 text-orange-600" />,
      cta: 'تصفح الآن',
      url: 'https://amazon.sa',
      color: 'from-orange-50 to-orange-100',
      border: 'border-orange-200'
    }
  ];

  const getRandomAd = () => {
    return fallbackAds[Math.floor(Math.random() * fallbackAds.length)];
  };

  const ad = getRandomAd();

  console.log('🎯 FallbackAds: Showing fallback ad', { ad, placement });

  const handleClick = () => {
    console.log('🎯 FallbackAds: Clicked', ad.title);
    window.open(ad.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className={`p-4 bg-gradient-to-br ${ad.color} ${ad.border} hover:shadow-md transition-all cursor-pointer ${className}`} onClick={handleClick}>
      <div className="flex items-center justify-between mb-3">
        <Badge variant="secondary" className="text-xs">
          إعلان
        </Badge>
        <span className="text-xs text-muted-foreground">Amazon</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          {ad.icon}
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">{ad.title}</h3>
          <p className="text-xs text-muted-foreground mb-3">{ad.description}</p>
          
          <Button size="sm" variant="outline" className="w-full">
            <ShoppingCart className="h-3 w-3 ml-1" />
            {ad.cta}
          </Button>
        </div>
      </div>
    </Card>
  );
};