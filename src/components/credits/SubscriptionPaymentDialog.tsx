import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, CreditCard, Shield, Coins, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BRAND_CONFIG } from '@/lib/brandConfig';
import { loadMoyasar } from '@/lib/moyasarLoader';

interface SubscriptionPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planDetails: {
    id: string;
    name: string;
    price: number;
    credits: number;
    billingCycle: 'monthly' | 'yearly';
  } | null;
  purchaseId: string | null;
  userId: string | null;
}

declare global {
  interface Window {
    Moyasar: {
      init: (config: {
        element: string;
        amount: number;
        currency: string;
        description: string;
        publishable_api_key: string;
        callback_url: string;
        metadata: Record<string, string>;
        methods: string[];
        apple_pay?: {
          country: string;
          label: string;
          validate_merchant_url: string;
        };
        on_completed?: (payment: unknown) => void;
        on_failed?: (error: unknown) => void;
      }) => void;
    };
  }
}

export function SubscriptionPaymentDialog({
  open,
  onOpenChange,
  planDetails,
  purchaseId,
  userId,
}: SubscriptionPaymentDialogProps) {
  const { t, i18n } = useTranslation(['credits', 'common']);
  const isRTL = i18n.language === 'ar';
  const formRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !planDetails || !purchaseId || !userId) return;

    setLoading(true);
    setError(null);

    const initPayment = async () => {
      try {
        // Load Moyasar SDK dynamically
        await loadMoyasar();

        // Clear previous form
        if (formRef.current) {
          formRef.current.innerHTML = '';
        }

        // Get publishable key from environment variable
        const publishableKey = import.meta.env.VITE_MOYASAR_PUBLISHABLE_KEY;

        console.log('Moyasar init for subscription - publishable key exists:', !!publishableKey);

        if (!publishableKey) {
          console.error('Moyasar publishable key not configured');
          setError(t('payment.config_error'));
          setLoading(false);
          return;
        }

        // Use BRAND_CONFIG.url for production callback with type=subscription
        const callbackUrl = `${BRAND_CONFIG.url}/payment-callback?purchase_id=${purchaseId}&type=subscription`;
        console.log('Moyasar callback URL:', callbackUrl);

        const billingText = planDetails.billingCycle === 'yearly' 
          ? (isRTL ? 'سنوي' : 'Yearly')
          : (isRTL ? 'شهري' : 'Monthly');

        window.Moyasar.init({
          element: '.moyasar-subscription-form',
          amount: planDetails.price * 100, // Convert to halalas
          currency: 'SAR',
          description: `${planDetails.name} - ${billingText}`,
          publishable_api_key: publishableKey,
          callback_url: callbackUrl,
          metadata: {
            purchase_id: purchaseId,
            user_id: userId,
            plan_id: planDetails.id,
            type: 'subscription',
            billing_cycle: planDetails.billingCycle,
          },
          methods: ['creditcard', 'stcpay', 'applepay'],
          apple_pay: {
            country: 'SA',
            label: 'Diviso',
            validate_merchant_url: 'https://api.moyasar.com/v1/applepay/initiate',
          },
        });

        console.log('Moyasar initialized successfully for subscription');
        setLoading(false);
      } catch (err) {
        console.error('Error initializing Moyasar:', err);
        setError(t('payment.init_error'));
        setLoading(false);
      }
    };

    // Small delay to ensure DOM is ready
    setTimeout(initPayment, 100);
  }, [open, planDetails, purchaseId, userId, t, isRTL]);

  if (!planDetails) return null;

  const billingText = planDetails.billingCycle === 'yearly' 
    ? (isRTL ? 'سنوياً' : 'Yearly')
    : (isRTL ? 'شهرياً' : 'Monthly');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md" 
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t('payment.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Plan Summary */}
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-semibold text-lg">{planDetails.name}</p>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{billingText}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <Coins className="h-3.5 w-3.5 text-primary" />
                  <span className="text-primary font-medium">{planDetails.credits}</span>
                  <span className="text-muted-foreground">{t('plans.credits_per_month')}</span>
                </div>
              </div>
              <div className="text-end">
                <p className="text-2xl font-bold text-primary">
                  {planDetails.price}
                </p>
                <p className="text-sm text-muted-foreground">{t('common:sar')}</p>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="min-h-[300px] relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <div className="text-center space-y-2">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">{t('payment.loading')}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <div className="text-center space-y-2 p-4">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              </div>
            )}

            <div ref={formRef} className="moyasar-subscription-form" />
          </div>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>{t('payment.secure')}</span>
            <Badge variant="outline" className="text-xs">
              SSL
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
