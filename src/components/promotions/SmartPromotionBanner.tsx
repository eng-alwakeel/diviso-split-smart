import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Star, TrendingUp, Users, Camera, Award } from 'lucide-react';
import { useUserBehavior } from '@/hooks/useUserBehavior';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { useNavigate } from 'react-router-dom';

interface PromotionMessage {
  id: string;
  title: string;
  description: string;
  ctaText: string;
  ctaAction: () => void;
  icon: any;
  variant: 'default' | 'premium' | 'warning';
  priority: number;
}

export const SmartPromotionBanner = () => {
  const { behavior, loading } = useUserBehavior();
  const { isFreePlan, limits } = useSubscriptionLimits();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [currentPromotion, setCurrentPromotion] = useState<PromotionMessage | null>(null);

  useEffect(() => {
    const dismissedIds = JSON.parse(localStorage.getItem('dismissedPromotions') || '[]');
    setDismissed(dismissedIds);
  }, []);

  useEffect(() => {
    if (!behavior || loading) return;

    const promotions = generatePromotions();
    const availablePromotions = promotions.filter(p => !dismissed.includes(p.id));
    
    if (availablePromotions.length > 0) {
      // Sort by priority and show the highest priority one
      const sortedPromotions = availablePromotions.sort((a, b) => b.priority - a.priority);
      setCurrentPromotion(sortedPromotions[0]);
    }
  }, [behavior, loading, dismissed, limits]);

  const generatePromotions = (): PromotionMessage[] => {
    if (!behavior) return [];

    const promotions: PromotionMessage[] = [];

    // For free plan users
    if (isFreePlan) {
      // Near expense limit
      if (behavior.expenseFrequency >= 40) {
        promotions.push({
          id: 'near_expense_limit',
          title: '🔥 أوشكت على الوصول للحد الأقصى!',
          description: 'لديك 10 مصاريف متبقية فقط. احصل على مصاريف غير محدودة',
          ctaText: 'ترقية الآن',
          ctaAction: () => navigate('/pricing'),
          icon: TrendingUp,
          variant: 'warning',
          priority: 10
        });
      }

      // High OCR usage
      if (behavior.ocrUsage >= 8) {
        promotions.push({
          id: 'ocr_power_user',
          title: '📸 أنت تحب تصوير الإيصالات!',
          description: 'احصل على OCR غير محدود + تحليلات ذكية',
          ctaText: 'اكتشف المزيد',
          ctaAction: () => navigate('/pricing'),
          icon: Camera,
          variant: 'premium',
          priority: 8
        });
      }

      // Social user with groups
      if (behavior.userType === 'social' && behavior.groupUsage > 2) {
        promotions.push({
          id: 'social_features',
          title: '👥 أنت تحب العمل الجماعي!',
          description: 'فتح ميزات المجموعات المتقدمة: دردشة، تقارير جماعية، والمزيد',
          ctaText: 'ترقية للعائلية',
          ctaAction: () => navigate('/pricing'),
          icon: Users,
          variant: 'premium',
          priority: 7
        });
      }

      // High engagement user
      if (behavior.engagementLevel === 'high') {
        promotions.push({
          id: 'power_user_upgrade',
          title: '⭐ أنت مستخدم نشط!',
          description: 'احصل على خصم 25% لاستخدامك المميز للتطبيق',
          ctaText: 'احصل على الخصم',
          ctaAction: () => navigate('/pricing'),
          icon: Star,
          variant: 'premium',
          priority: 9
        });
      }

      // General free plan promotion
      if (behavior.expenseFrequency > 10) {
        promotions.push({
          id: 'general_upgrade',
          title: '🚀 جاهز للمستوى التالي؟',
          description: 'فتح جميع الميزات: تحليلات متقدمة، تقارير مفصلة، OCR ذكي',
          ctaText: 'اكتشف الخطط',
          ctaAction: () => navigate('/pricing'),
          icon: TrendingUp,
          variant: 'default',
          priority: 5
        });
      }
    } else {
      // For paid plan users - subtle promotions
      if (behavior.userType === 'organizer' && !behavior.preferredFeatures.includes('advanced_reports')) {
        promotions.push({
          id: 'advanced_reports_tip',
          title: '📊 نصيحة: جرب التقارير المتقدمة',
          description: 'اكتشف أنماط إنفاقك مع تحليلات مفصلة',
          ctaText: 'تعلم المزيد',
          ctaAction: () => {}, // Navigate to reports guide
          icon: Award,
          variant: 'default',
          priority: 3
        });
      }
    }

    return promotions;
  };

  const dismissPromotion = (promotionId: string, duration: 'day' | 'week' | 'month' = 'week') => {
    const newDismissed = [...dismissed, promotionId];
    setDismissed(newDismissed);
    localStorage.setItem('dismissedPromotions', JSON.stringify(newDismissed));
    
    // Auto-remove from dismissed list after duration
    const durationMs = duration === 'day' ? 24 * 60 * 60 * 1000 : 
                     duration === 'week' ? 7 * 24 * 60 * 60 * 1000 : 
                     30 * 24 * 60 * 60 * 1000;
    
    setTimeout(() => {
      const currentDismissed = JSON.parse(localStorage.getItem('dismissedPromotions') || '[]');
      const filtered = currentDismissed.filter((id: string) => id !== promotionId);
      localStorage.setItem('dismissedPromotions', JSON.stringify(filtered));
    }, durationMs);
    
    setCurrentPromotion(null);
  };

  if (!currentPromotion || loading) return null;

  const getVariantStyles = () => {
    switch (currentPromotion.variant) {
      case 'warning':
        return 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20';
      case 'premium':
        return 'border-purple-300 bg-purple-50/50 dark:bg-purple-950/20';
      default:
        return 'border-primary/30 bg-primary/5';
    }
  };

  const getBadgeVariant = () => {
    switch (currentPromotion.variant) {
      case 'warning':
        return 'destructive';
      case 'premium':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const IconComponent = currentPromotion.icon;

  return (
    <Card className={`mb-3 max-w-full ${getVariantStyles()} transition-all duration-300 hover:shadow-md`}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1">
            <div className="mt-0.5">
              <IconComponent className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-xs">{currentPromotion.title}</h4>
                {isFreePlan && (
                  <Badge variant={getBadgeVariant()} className="text-[10px] px-1.5 py-0">
                    ترقية مميزة
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{currentPromotion.description}</p>
              <Button 
                onClick={currentPromotion.ctaAction}
                size="sm" 
                className="text-xs h-7"
                variant={currentPromotion.variant === 'warning' ? 'default' : 'outline'}
              >
                {currentPromotion.ctaText}
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-foreground"
            onClick={() => dismissPromotion(currentPromotion.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};