import { useState } from 'react';
import { Check, Sparkles, Crown, Coins } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';

interface CreditPackage {
  id: string;
  name: string;
  nameKey: string;
  price: number;
  credits: number;
  validityDays: number;
  badge?: 'best_value' | 'most_popular';
  icon: React.ReactNode;
}

// الباقات الجديدة S/M/L
const packages: CreditPackage[] = [
  {
    id: 'large',
    name: 'Large',
    nameKey: 'packages.large',
    price: 99,
    credits: 450,
    validityDays: 90,
    badge: 'best_value',
    icon: <Crown className="h-6 w-6" />
  },
  {
    id: 'medium',
    name: 'Medium',
    nameKey: 'packages.medium',
    price: 49,
    credits: 200,
    validityDays: 60,
    badge: 'most_popular',
    icon: <Sparkles className="h-6 w-6" />
  },
  {
    id: 'small',
    name: 'Small',
    nameKey: 'packages.small',
    price: 25,
    credits: 90,
    validityDays: 30,
    icon: <Coins className="h-6 w-6" />
  }
];

interface CreditPackagesGridProps {
  onPurchase?: (packageId: string) => void;
  preselectedPackage?: string;
}

export function CreditPackagesGrid({ onPurchase, preselectedPackage }: CreditPackagesGridProps) {
  const { t, i18n } = useTranslation('credits');
  const { toast } = useToast();
  const isRTL = i18n.language === 'ar';
  const [selectedPackage, setSelectedPackage] = useState(preselectedPackage || 'large');

  const handlePurchase = (pkg: CreditPackage) => {
    setSelectedPackage(pkg.id);
    toast({
      title: t('packages.coming_soon'),
      description: t('packages.coming_soon_desc'),
    });
    onPurchase?.(pkg.id);
  };

  const getBadgeText = (badge?: string) => {
    switch (badge) {
      case 'best_value': return t('packages.best_value');
      case 'most_popular': return t('packages.most_popular');
      default: return null;
    }
  };

  const getBadgeColor = (badge?: string) => {
    switch (badge) {
      case 'best_value': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'most_popular': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default: return '';
    }
  };

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">{t('packages.title')}</h3>
        <p className="text-sm text-muted-foreground">{t('packages.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {packages.map((pkg) => {
          const isSelected = selectedPackage === pkg.id;
          const isBestValue = pkg.badge === 'best_value';
          
          return (
            <Card 
              key={pkg.id}
              className={`relative transition-all cursor-pointer ${
                isSelected
                  ? 'border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/20' 
                  : isBestValue
                    ? 'border-green-300 dark:border-green-700 hover:border-primary/50'
                    : 'border-border hover:border-primary/50'
              } hover:shadow-lg`}
              onClick={() => setSelectedPackage(pkg.id)}
            >
              {pkg.badge && (
                <Badge 
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 ${getBadgeColor(pkg.badge)} border-0`}
                >
                  {getBadgeText(pkg.badge)}
                </Badge>
              )}
              
              {isSelected && (
                <div className="absolute top-3 left-3">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
              )}
              
              <CardHeader className="text-center pb-2 pt-6">
                <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-2 ${
                  isBestValue 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600' 
                    : pkg.badge === 'most_popular'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                      : 'bg-muted text-muted-foreground'
                }`}>
                  {pkg.icon}
                </div>
                <CardTitle className="text-lg">
                  {t(`${pkg.nameKey}.name`)}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="text-center space-y-4">
                {/* Price */}
                <div>
                  <span className="text-3xl font-bold text-foreground">{pkg.price}</span>
                  <span className="text-muted-foreground mr-1"> {t('common:sar')}</span>
                </div>

                {/* Credits */}
                <div className="space-y-1">
                  <div className={`text-2xl font-semibold ${
                    isBestValue ? 'text-green-600' : 'text-primary'
                  }`}>
                    {pkg.credits}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('balance.credits')}
                  </div>
                </div>

                {/* Validity */}
                <p className="text-sm text-muted-foreground">
                  {t('packages.valid_for', { days: pkg.validityDays })}
                </p>

                {/* Value per credit */}
                <div className="bg-muted/50 rounded-lg p-2">
                  <p className="text-xs text-muted-foreground">
                    {(pkg.price / pkg.credits).toFixed(2)} {t('common:sar')} / {t('balance.credits')}
                  </p>
                </div>

                {/* Features */}
                <ul className="text-sm space-y-2 text-right">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{t('packages.features.ocr', { count: pkg.credits })}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{t('packages.features.groups', { count: Math.floor(pkg.credits / 5) })}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{t('packages.features.settlements', { count: Math.floor(pkg.credits / 3) })}</span>
                  </li>
                </ul>

                {/* Purchase Button */}
                <Button 
                  className="w-full"
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() => handlePurchase(pkg)}
                >
                  {t('packages.buy_now')}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
