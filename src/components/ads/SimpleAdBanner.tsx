import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, X, ShoppingCart } from 'lucide-react';

interface SimpleAdBannerProps {
  onDismiss?: () => void;
  className?: string;
}

export const SimpleAdBanner: React.FC<SimpleAdBannerProps> = ({
  onDismiss,
  className = ''
}) => {
  const sampleAds = [
    {
      id: '1',
      title: 'آيفون 15 برو بأفضل الأسعار',
      description: 'احصل على أحدث موديل من آيفون مع توصيل مجاني',
      price: 'من 4,199 ريال',
      image: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&h=200&fit=crop',
      url: 'https://amazon.sa',
      partner: 'Amazon'
    },
    {
      id: '2', 
      title: 'أجهزة مطبخ ذكية - خصم 30%',
      description: 'اكتشف مجموعة واسعة من أدوات المطبخ الحديثة',
      price: 'ابتداء من 99 ريال',
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=200&fit=crop',
      url: 'https://amazon.sa',
      partner: 'Amazon'
    },
    {
      id: '3',
      title: 'لابتوب جيمنج عالي الأداء',
      description: 'مثالي للألعاب والعمل مع معالج قوي وكارت شاشة متطور',
      price: '2,999 ريال',
      image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=200&fit=crop',
      url: 'https://amazon.sa',
      partner: 'Amazon'
    }
  ];

  const randomAd = sampleAds[Math.floor(Math.random() * sampleAds.length)];

  console.log('🎯 SimpleAdBanner: Displaying ad:', randomAd);

  const handleClick = () => {
    console.log('🎯 SimpleAdBanner: Ad clicked:', randomAd.title);
    window.open(randomAd.url, '_blank', 'noopener,noreferrer');
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('🎯 SimpleAdBanner: Ad dismissed');
    onDismiss?.();
  };

  return (
    <Card className={`relative p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:shadow-md transition-all cursor-pointer ${className}`} onClick={handleClick}>
      {/* Ad Badge */}
      <div className="flex items-center justify-between mb-3">
        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
          إعلان
        </Badge>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-blue-100"
            onClick={handleDismiss}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="flex gap-4">
        {/* Product Image */}
        <div className="flex-shrink-0">
          <img
            src={randomAd.image}
            alt={randomAd.title}
            className="w-20 h-16 object-cover rounded-lg"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1">
            {randomAd.title}
          </h3>
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {randomAd.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-green-600">
              {randomAd.price}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{randomAd.partner}</span>
              <Button size="sm" variant="outline" className="h-7 px-2">
                <ShoppingCart className="h-3 w-3 ml-1" />
                تسوق الآن
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};