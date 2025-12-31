import { Check, Sparkles, Zap, Crown } from 'lucide-react';
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
  bonusCredits: number;
  validityDays: number;
  icon: React.ReactNode;
  popular?: boolean;
}

const packages: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    nameKey: 'packages.starter',
    price: 25,
    credits: 100,
    bonusCredits: 0,
    validityDays: 30,
    icon: <Zap className="h-5 w-5" />
  },
  {
    id: 'popular',
    name: 'Popular',
    nameKey: 'packages.popular',
    price: 50,
    credits: 200,
    bonusCredits: 20,
    validityDays: 45,
    icon: <Sparkles className="h-5 w-5" />,
    popular: true
  },
  {
    id: 'pro',
    name: 'Pro',
    nameKey: 'packages.pro',
    price: 100,
    credits: 400,
    bonusCredits: 80,
    validityDays: 60,
    icon: <Crown className="h-5 w-5" />
  }
];

interface CreditPackagesGridProps {
  onPurchase?: (packageId: string) => void;
}

export function CreditPackagesGrid({ onPurchase }: CreditPackagesGridProps) {
  const { t } = useTranslation('credits');
  const { toast } = useToast();

  const handlePurchase = (pkg: CreditPackage) => {
    // TODO: Implement payment flow
    toast({
      title: 'قريباً!',
      description: 'سيتم تفعيل خاصية الشراء قريباً',
    });
    onPurchase?.(pkg.id);
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">{t('packages.title')}</h3>
        <p className="text-sm text-muted-foreground">{t('packages.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <Card 
            key={pkg.id}
            className={`relative transition-all hover:shadow-lg ${
              pkg.popular 
                ? 'border-primary shadow-primary/10 scale-105 z-10' 
                : 'border-border hover:border-primary/50'
            }`}
          >
            {pkg.popular && (
              <Badge 
                className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary"
              >
                {t(`${pkg.nameKey}.name`)}
              </Badge>
            )}
            
            <CardHeader className="text-center pb-2">
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                pkg.popular 
                  ? 'bg-primary/20 text-primary' 
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
                <span className="text-muted-foreground mr-1">ريال</span>
              </div>

              {/* Credits */}
              <div className="space-y-1">
                <div className="text-2xl font-semibold text-primary">
                  {pkg.credits + pkg.bonusCredits}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t(`${pkg.nameKey}.credits`)}
                </div>
                {pkg.bonusCredits > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {t(`${pkg.nameKey}.bonus`)}
                  </Badge>
                )}
              </div>

              {/* Validity */}
              <p className="text-sm text-muted-foreground">
                {t(`${pkg.nameKey}.validity`)}
              </p>

              {/* Features */}
              <ul className="text-sm space-y-2 text-right">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>مسح {Math.floor((pkg.credits + pkg.bonusCredits))} إيصال</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>إنشاء {Math.floor((pkg.credits + pkg.bonusCredits) / 5)} مجموعة</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>{Math.floor((pkg.credits + pkg.bonusCredits) / 3)} تسوية</span>
                </li>
              </ul>

              {/* Purchase Button */}
              <Button 
                className="w-full"
                variant={pkg.popular ? 'default' : 'outline'}
                onClick={() => handlePurchase(pkg)}
              >
                شراء الآن
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
