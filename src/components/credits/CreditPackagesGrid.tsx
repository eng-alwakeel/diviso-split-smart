import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Coins, Sparkles, Crown, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { MoyasarPaymentDialog } from './MoyasarPaymentDialog';

interface CreditPackage {
  id: string;
  name: string;
  name_ar: string;
  price_sar: number;
  credits: number;
  bonus_credits: number | null;
  validity_days: number;
  sort_order: number | null;
  is_active: boolean | null;
}

interface CreditPackagesGridProps {
  onPurchase?: (packageId: string) => void;
}

export function CreditPackagesGrid({ onPurchase }: CreditPackagesGridProps) {
  const { t, i18n } = useTranslation('credits');
  const isRTL = i18n.language === 'ar';
  
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      const { data, error } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching packages:', error);
        toast.error(isRTL ? 'فشل في تحميل الباقات' : 'Failed to load packages');
      } else if (data) {
        setPackages(data);
      }
      setLoading(false);
    };

    fetchPackages();
  }, [isRTL]);

  const handlePurchase = async (pkg: CreditPackage) => {
    setProcessing(true);
    setSelectedPackage(pkg);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(isRTL ? 'يجب تسجيل الدخول أولاً' : 'Please login first');
        setProcessing(false);
        return;
      }

      setUserId(user.id);

      const totalCredits = pkg.credits + (pkg.bonus_credits || 0);
      const { data: purchase, error } = await supabase
        .from('credit_purchases')
        .insert({
          user_id: user.id,
          package_id: pkg.id,
          credits_purchased: totalCredits,
          price_paid: pkg.price_sar,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      setPurchaseId(purchase.id);
      setPaymentDialogOpen(true);
      onPurchase?.(pkg.id);
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error(isRTL ? 'حدث خطأ في عملية الشراء' : 'Purchase error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const getPackageIcon = (index: number) => {
    const icons = [Crown, Sparkles, Zap];
    return icons[index] || Coins;
  };

  const getPackageBadge = (index: number) => {
    if (index === 0) return { text: isRTL ? 'أفضل قيمة' : 'Best Value', variant: 'default' as const };
    if (index === 1) return { text: isRTL ? 'الأكثر شيوعاً' : 'Popular', variant: 'secondary' as const };
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Coins className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">
          {isRTL ? 'لا توجد باقات متاحة حالياً' : 'No packages available'}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {packages.map((pkg, index) => {
        const Icon = getPackageIcon(index);
        const badge = getPackageBadge(index);
        const totalCredits = pkg.credits + (pkg.bonus_credits || 0);
        const isSelected = selectedPackage?.id === pkg.id;

        return (
          <Card
            key={pkg.id}
            className={`relative overflow-hidden transition-all duration-200 ${
              isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
            }`}
          >
            {badge && (
              <Badge 
                variant={badge.variant}
                className="absolute top-3 end-3 text-xs"
              >
                {badge.text}
              </Badge>
            )}

            <div className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-6 w-6 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg">
                    {isRTL ? pkg.name_ar : pkg.name}
                  </h3>

                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-primary">
                      {pkg.price_sar}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {isRTL ? 'ر.س' : 'SAR'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Coins className="h-4 w-4" />
                      <span className="font-medium text-foreground">{totalCredits}</span>
                      <span>{isRTL ? 'نقطة' : 'credits'}</span>
                    </div>
                    
                    {pkg.bonus_credits && pkg.bonus_credits > 0 && (
                      <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                        +{pkg.bonus_credits} {isRTL ? 'مجاناً' : 'bonus'}
                      </Badge>
                    )}

                    <span className="text-xs">
                      {isRTL ? `صالح ${pkg.validity_days} يوم` : `Valid ${pkg.validity_days} days`}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handlePurchase(pkg)}
                disabled={processing && isSelected}
                className="w-full mt-4"
                size="lg"
              >
                {processing && isSelected ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {isRTL ? 'جاري المعالجة...' : 'Processing...'}
                  </span>
                ) : (
                  isRTL ? 'شراء الآن' : 'Buy Now'
                )}
              </Button>
            </div>
          </Card>
        );
      })}

      <MoyasarPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        packageDetails={selectedPackage ? {
          id: selectedPackage.id,
          name: isRTL ? selectedPackage.name_ar : selectedPackage.name,
          price: selectedPackage.price_sar,
          credits: selectedPackage.credits + (selectedPackage.bonus_credits || 0)
        } : null}
        purchaseId={purchaseId}
        userId={userId}
      />
    </div>
  );
}
