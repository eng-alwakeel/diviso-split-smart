import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ExternalLink, 
  Star, 
  Zap, 
  RefreshCw, 
  Tag,
  TrendingUp,
  Target,
  Brain,
  Users
} from 'lucide-react';
import { useSmartAffiliateRecommendations } from '@/hooks/useSmartAffiliateRecommendations';
import { useAdTracking } from '@/hooks/useAdTracking';

interface SmartProductRecommendationsProps {
  context: {
    type: 'expense' | 'group' | 'dashboard' | 'category';
    expenseCategory?: string;
    groupType?: string;
    groupId?: string;
    amount?: number;
    memberCount?: number;
  };
  maxProducts?: number;
  showTitle?: boolean;
  compact?: boolean;
  className?: string;
}

export const SmartProductRecommendations: React.FC<SmartProductRecommendationsProps> = ({
  context,
  maxProducts = 3,
  showTitle = true,
  compact = false,
  className = ''
}) => {
  const [refreshing, setRefreshing] = useState(false);
  
  const { 
    recommendations, 
    loading, 
    getSmartRecommendations,
    refreshRecommendations 
  } = useSmartAffiliateRecommendations();
  
  const { shouldShowAds, trackAdImpression, trackAdClick } = useAdTracking();

  // Load recommendations on mount and context change
  useEffect(() => {
    if (shouldShowAds()) {
      loadRecommendations();
    }
  }, [context, shouldShowAds]);

  const loadRecommendations = async () => {
    try {
      await getSmartRecommendations(context, maxProducts);
      
      // Track impression
      if (recommendations.length > 0) {
        await trackAdImpression({
          ad_type: 'smart_recommendations',
          placement: `${context.type}_context`,
          ad_category: context.expenseCategory || context.groupType || 'general'
        });
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshRecommendations();
    } finally {
      setRefreshing(false);
    }
  };

  const handleProductClick = async (product: any) => {
    // Track click
    await trackAdClick('', product.product_id, product.commission_rate);
    
    // Open affiliate link
    window.open(product.affiliate_url, '_blank', 'noopener,noreferrer');
  };

  // Don't show if ads are disabled or no recommendations
  if (!shouldShowAds() || (!loading && recommendations.length === 0)) {
    return null;
  }

  const getContextIcon = () => {
    switch (context.type) {
      case 'expense': return <Tag className="h-4 w-4" />;
      case 'group': return <Users className="h-4 w-4" />;
      case 'dashboard': return <TrendingUp className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getContextTitle = () => {
    switch (context.type) {
      case 'expense': 
        return `مُوصى لفئة ${context.expenseCategory || 'المصروفات'}`;
      case 'group':
        const groupLabels: Record<string, string> = {
          'trip': 'الرحلات',
          'home': 'السكن المشترك', 
          'work': 'العمل',
          'party': 'الحفلات',
          'project': 'المشاريع'
        };
        return `مُوصى لمجموعات ${groupLabels[context.groupType || ''] || 'العامة'}`;
      case 'dashboard': 
        return 'مُوصى لك شخصياً';
      default: 
        return 'منتجات مُوصى بها';
    }
  };

  if (loading) {
    return (
      <Card className={`${className}`}>
        {showTitle && (
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-5 w-32" />
              <Badge variant="secondary" className="text-xs mr-auto">
                <Brain className="h-3 w-3 mr-1" />
                ذكي
              </Badge>
            </div>
          </CardHeader>
        )}
        <CardContent className="space-y-3">
          {Array.from({ length: maxProducts }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 p-2">
              <Skeleton className="w-12 h-12 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-8 w-16 rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 ${className}`}>
      {showTitle && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getContextIcon()}
              <CardTitle className="text-sm font-semibold">
                {getContextTitle()}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <Brain className="h-3 w-3 mr-1" />
                ذكي
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className="space-y-3">
        {recommendations.slice(0, maxProducts).map((product, index) => (
          <div 
            key={product.id} 
            className={`flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${
              compact ? 'py-1' : 'py-2'
            }`}
            onClick={() => handleProductClick(product)}
          >
            <div className="flex-shrink-0">
              <img
                src={product.image_url || 'https://via.placeholder.com/48x48?text=Product'}
                alt={product.title}
                className={`object-cover rounded ${compact ? 'w-10 h-10' : 'w-12 h-12'}`}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/48x48?text=Product';
                  e.currentTarget.onerror = null;
                }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-3 w-3 text-primary" />
                <span className="text-xs text-primary font-medium">
                  {product.affiliate_partner === 'amazon' ? 'أمازون' : product.affiliate_partner}
                </span>
                {product.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-muted-foreground">{product.rating}</span>
                  </div>
                )}
              </div>
              
              <h4 className={`font-medium line-clamp-2 mb-1 ${compact ? 'text-xs' : 'text-sm'}`}>
                {product.title}
              </h4>
              
              <div className="flex items-center gap-2 mb-1">
                {product.price_range && (
                  <span className={`font-semibold text-primary ${compact ? 'text-xs' : 'text-sm'}`}>
                    {product.price_range}
                  </span>
                )}
                {product.smart_score > 8 && (
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    مُوصى بقوة
                  </Badge>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground line-clamp-1">
                {product.relevance_reason}
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              className={`flex-shrink-0 ${compact ? 'h-7 w-7 p-0' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleProductClick(product);
              }}
            >
              <ExternalLink className="h-3 w-3" />
              {!compact && <span className="mr-2 text-xs">تسوق</span>}
            </Button>
          </div>
        ))}

        {recommendations.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">لا توجد اقتراحات متاحة حالياً</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};