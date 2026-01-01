import { useState, useEffect } from 'react';
import { Check, Sparkles, Crown, Coins, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MoyasarPaymentDialog } from './MoyasarPaymentDialog';

interface CreditPackage {
  id: string;
  name: string;
  name_ar: string;
  price_sar: number;
  credits: number;
  validity_days: number;
  bonus_credits: number | null;
  sort_order: number | null;
}

interface CreditPackagesGridProps {
  onPurchase?: (packageId: string) => void;
}

export function CreditPackagesGrid({ onPurchase }: CreditPackagesGridProps) {
  const { t, i18n } = useTranslation('credits');
  const { toast } = useToast();
  const isRTL = i18n.language === 'ar';
  
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [processingPurchase, setProcessingPurchase] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [currentPurchase, setCurrentPurchase] = useState<{
    packageDetails: { id: string; name: string; price: number; credits: number } | null;
    purchaseId: string | null;
    userId: string | null;
  }>({ packageDetails: null, purchaseId: null, userId: null });

  // Fetch packages from database - ordered: L first (best value), then M, then S
  useEffect(() => {
    const fetchPackages = async () => {
      // Force fresh data - bypass any caching
      const { data, error } = await supabase
        .from('credit_packages')
        .select('id, name, name_ar, price_sar, credits, validity_days, bonus_credits, sort_order')
        .eq('is_active', true)
        .order('credits', { ascending: false }); // L (450) first, then M (200), then S (90)

      if (error) {
        console.error('Error fetching packages:', error);
        toast({
          title: t('common:error'),
          description: t('packages.load_error'),
          variant: 'destructive',
        });
      } else {
        // DEBUG: Log packages data to verify correct values from Supabase
        console.debug('[CreditPackagesGrid] Packages from Supabase:', data?.map(p => ({
          name: p.name,
          credits: p.credits,
          bonus: p.bonus_credits,
          total: p.credits + (p.bonus_credits || 0)
        })));
        
        setPackages(data || []);
        // Select the best value package by default (highest credits = first one = L)
        if (data && data.length > 0) {
          setSelectedPackage(data[0].id);
        }
      }
      setLoading(false);
    };

    fetchPackages();
  }, [t, toast]);

  const handlePurchase = async (pkg: CreditPackage) => {
    setSelectedPackage(pkg.id);
    setProcessingPurchase(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: t('common:error'),
          description: t('common:login_required'),
          variant: 'destructive',
        });
        setProcessingPurchase(false);
        return;
      }

      toast({
        title: t('payment.creating_order'),
      });

      // Create pending purchase record
      const { data: purchase, error: purchaseError } = await supabase
        .from('credit_purchases')
        .insert({
          user_id: user.id,
          package_id: pkg.id,
          credits_purchased: pkg.credits + (pkg.bonus_credits || 0),
          price_paid: pkg.price_sar,
          status: 'pending',
          payment_method: 'moyasar',
        })
        .select()
        .single();

      if (purchaseError) {
        console.error('Error creating purchase:', purchaseError);
        toast({
          title: t('common:error'),
          description: t('payment.order_error'),
          variant: 'destructive',
        });
        setProcessingPurchase(false);
        return;
      }

      // Open payment dialog
      setCurrentPurchase({
        packageDetails: {
          id: pkg.id,
          name: isRTL ? pkg.name_ar : pkg.name,
          price: pkg.price_sar,
          credits: pkg.credits + (pkg.bonus_credits || 0),
        },
        purchaseId: purchase.id,
        userId: user.id,
      });
      setPaymentDialogOpen(true);
      onPurchase?.(pkg.id);

    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: t('common:error'),
        description: t('payment.order_error'),
        variant: 'destructive',
      });
    } finally {
      setProcessingPurchase(false);
    }
  };

  const getPackageIcon = (index: number) => {
    const icons = [
      <Crown key="crown" className="h-6 w-6" />,
      <Sparkles key="sparkles" className="h-6 w-6" />,
      <Coins key="coins" className="h-6 w-6" />
    ];
    return icons[index % 3];
  };

  const getBadgeInfo = (pkg: CreditPackage, index: number, allPackages: CreditPackage[]) => {
    // L = first (index 0) = Best Value, M = second (index 1) = Most Popular
    if (index === 0) {
      return { text: t('packages.best_value'), color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', isBest: true };
    }
    if (index === 1) {
      return { text: t('packages.most_popular'), color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', isBest: false };
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-semibold">{t('packages.title')}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">{t('packages.subtitle')}</p>
          <p className="text-[10px] sm:text-xs text-primary/70 mt-1">{t('packages.section_subtitle')}</p>
        </div>

        {/* Vertical layout on mobile for better UX */}
        <div className="flex flex-col gap-4 sm:grid sm:grid-cols-3 sm:gap-4">
          {packages.map((pkg, index) => {
            const isSelected = selectedPackage === pkg.id;
            const badgeInfo = getBadgeInfo(pkg, index, packages);
            const isBestValue = badgeInfo?.isBest || false;
            const totalCredits = pkg.credits + (pkg.bonus_credits || 0);
            
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
                {badgeInfo && (
                  <Badge 
                    className={`absolute -top-2.5 sm:-top-3 left-1/2 -translate-x-1/2 ${badgeInfo.color} border-0 text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1`}
                  >
                    {badgeInfo.text}
                  </Badge>
                )}
                
                {isSelected && (
                  <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
                    </div>
                  </div>
                )}
                
                <CardHeader className="text-center pb-2 pt-5 sm:pt-6">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-full flex items-center justify-center mb-2 ${
                    isBestValue 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600' 
                      : index === 1
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {getPackageIcon(index)}
                  </div>
                  <CardTitle className="text-base sm:text-lg">
                    {isRTL ? pkg.name_ar : pkg.name}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="text-center space-y-3 sm:space-y-4">
                  {/* Price */}
                  <div>
                    <span className="text-2xl sm:text-3xl font-bold text-foreground">{pkg.price_sar}</span>
                    <span className="text-muted-foreground mr-1 text-sm"> {t('common:sar')}</span>
                  </div>

                  {/* Credits */}
                  <div className="space-y-0.5 sm:space-y-1">
                    <div className={`text-xl sm:text-2xl font-semibold ${
                      isBestValue ? 'text-green-600' : 'text-primary'
                    }`}>
                      {totalCredits}
                      {pkg.bonus_credits && pkg.bonus_credits > 0 && (
                        <span className="text-xs sm:text-sm text-green-500 mr-1">
                          (+{pkg.bonus_credits})
                        </span>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      {t('balance.credits')}
                    </div>
                  </div>

                  {/* Validity */}
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t('packages.valid_for', { days: pkg.validity_days })}
                  </p>

                  {/* Value per credit */}
                  <div className="bg-muted/50 rounded-lg p-1.5 sm:p-2">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {(pkg.price_sar / totalCredits).toFixed(2)} {t('common:sar')} / {t('balance.credits')}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="text-xs sm:text-sm space-y-1.5 sm:space-y-2 text-right">
                    <li className="flex items-center gap-1.5 sm:gap-2">
                      <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                      <span>{t('packages.features.ocr', { count: totalCredits })}</span>
                    </li>
                    <li className="flex items-center gap-1.5 sm:gap-2">
                      <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                      <span>{t('packages.features.groups', { count: Math.floor(totalCredits / 5) })}</span>
                    </li>
                    <li className="flex items-center gap-1.5 sm:gap-2">
                      <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                      <span>{t('packages.features.settlements', { count: Math.floor(totalCredits / 3) })}</span>
                    </li>
                  </ul>

                  {/* Purchase Button */}
                  <Button 
                    className="w-full"
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={() => handlePurchase(pkg)}
                    disabled={processingPurchase}
                  >
                    {processingPurchase && selectedPackage === pkg.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin ltr:mr-2 rtl:ml-2" />
                        {t('payment.creating_order')}
                      </>
                    ) : (
                      t('packages.buy_now')
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Payment Dialog */}
      <MoyasarPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        packageDetails={currentPurchase.packageDetails}
        purchaseId={currentPurchase.purchaseId}
        userId={currentPurchase.userId}
      />
    </>
  );
}
