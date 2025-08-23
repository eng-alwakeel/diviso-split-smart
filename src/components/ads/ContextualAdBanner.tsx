import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, X, Tag, Star } from 'lucide-react';
import { useAdTracking } from '@/hooks/useAdTracking';
import { useAffiliateProducts } from '@/hooks/useAffiliateProducts';
import { useSmartAdLearning } from '@/hooks/useSmartAdLearning';

interface ContextualAdBannerProps {
  context: {
    type: 'expense' | 'group' | 'dashboard' | 'category';
    category?: string;
    groupType?: string;
    amount?: number;
    location?: string;
  };
  placement: string;
  maxAds?: number;
  className?: string;
}

export const ContextualAdBanner: React.FC<ContextualAdBannerProps> = ({
  context,
  placement,
  maxAds = 1,
  className = ''
}) => {
  const [products, setProducts] = useState<any[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [impressionId, setImpressionId] = useState<string>('');
  const [isVisible, setIsVisible] = useState(true);
  
  const { shouldShowAds, trackAdImpression, trackAdClick, getTargetedCategories } = useAdTracking();
  const { getProductsForExpenseCategory, getProductsForGroupType, getAmazonProducts } = useAffiliateProducts();
  const { recordAdInteraction, getSmartAdRecommendations } = useSmartAdLearning();

  useEffect(() => {
    if (shouldShowAds() && isVisible) {
      loadSmartContextualAds();
    }
  }, [context, shouldShowAds, isVisible]);

  useEffect(() => {
    if (products.length > 0) {
      const interval = setInterval(() => {
        setCurrentAdIndex(prev => (prev + 1) % products.length);
      }, 45000); // Longer rotation for less intrusion

      return () => clearInterval(interval);
    }
  }, [products.length]);

  const loadSmartContextualAds = async () => {
    try {
      let fetchedProducts: any[] = [];
      const targetedCategories = getTargetedCategories();

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
          if (targetedCategories.length > 0) {
            // Use smart recommendations
            const smartCategories = getSmartAdRecommendations(placement, targetedCategories);
            if (smartCategories.length > 0) {
              fetchedProducts = await getAmazonProducts(smartCategories[0]);
            }
          }
          break;
          
        case 'category':
          if (context.category) {
            fetchedProducts = await getAmazonProducts(context.category);
          }
          break;
      }

      if (fetchedProducts.length > 0) {
        const limitedProducts = fetchedProducts.slice(0, maxAds);
        setProducts(limitedProducts);
        
        // Track smart impression
        const firstProduct = limitedProducts[0];
        await trackAdImpression({
          ad_type: 'smart_affiliate_banner',
          ad_category: firstProduct.category,
          placement,
          product_id: firstProduct.product_id,
          affiliate_partner: firstProduct.affiliate_partner,
          expense_category: context.category
        });

        // Record learning interaction
        recordAdInteraction({
          ad_type: 'smart_banner',
          ad_category: firstProduct.category,
          context: placement,
          interaction_type: 'view'
        });
        
        setImpressionId('temp-id');
      }
    } catch (error) {
      console.error('Error loading smart contextual ads:', error);
    }
  };

  const handleSmartAdClick = async (product: any) => {
    if (impressionId) {
      await trackAdClick(impressionId, product.product_id, product.commission_rate);
    }

    // Record smart click
    recordAdInteraction({
      ad_type: 'smart_banner',
      ad_category: product.category,
      context: placement,
      interaction_type: 'click'
    });
    
    // Open affiliate link
    window.open(product.affiliate_url, '_blank', 'noopener,noreferrer');
  };

  const handleSmartDismiss = () => {
    setIsVisible(false);
    
    // Record dismissal for learning
    if (products[currentAdIndex]) {
      recordAdInteraction({
        ad_type: 'smart_banner',
        ad_category: products[currentAdIndex].category,
        context: placement,
        interaction_type: 'dismiss'
      });
    }
    
    // Remember dismissal for this session
    sessionStorage.setItem(`smart_ad_dismissed_${placement}`, 'true');
  };

  // Check if ad was dismissed this session
  useEffect(() => {
    const wasDismissed = sessionStorage.getItem(`smart_ad_dismissed_${placement}`);
    if (wasDismissed) {
      setIsVisible(false);
    }
  }, [placement]);

  if (!shouldShowAds() || !isVisible || products.length === 0) {
    return null;
  }

  const currentProduct = products[currentAdIndex];

  return (
    <Card className={`relative overflow-hidden bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20 ${className}`}>
      <div className="absolute top-2 right-2 flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          إعلان
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSmartDismiss}
          className="h-6 w-6 p-0 hover:bg-destructive/10"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      <div className="p-4 flex items-center gap-4">
        {currentProduct.image_url && (
          <div className="flex-shrink-0">
            <img
              src={currentProduct.image_url}
              alt={currentProduct.title}
              className="w-16 h-16 object-cover rounded-lg"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Tag className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {currentProduct.affiliate_partner === 'amazon' ? 'أمازون' : currentProduct.affiliate_partner}
            </span>
            {currentProduct.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-muted-foreground">{currentProduct.rating}</span>
              </div>
            )}
          </div>
          
          <h4 className="font-medium text-sm line-clamp-2 mb-2">
            {currentProduct.title}
          </h4>
          
          {currentProduct.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {currentProduct.description}
            </p>
          )}
          
          {currentProduct.price_range && (
            <p className="text-sm font-semibold text-primary mb-2">
              {currentProduct.price_range}
            </p>
          )}
        </div>

        <Button
          onClick={() => handleSmartAdClick(currentProduct)}
          className="flex-shrink-0"
          size="sm"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          تسوق الآن
        </Button>
      </div>

      {products.length > 1 && (
        <div className="px-4 pb-2">
          <div className="flex justify-center gap-1">
            {products.map((_, index) => (
              <div
                key={index}
                className={`h-1 w-4 rounded-full transition-all ${
                  index === currentAdIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};