import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, CreditCard, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MoyasarPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageDetails: {
    id: string;
    name: string;
    price: number;
    credits: number;
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

export function MoyasarPaymentDialog({
  open,
  onOpenChange,
  packageDetails,
  purchaseId,
  userId,
}: MoyasarPaymentDialogProps) {
  const { t, i18n } = useTranslation(['credits', 'common']);
  const isRTL = i18n.language === 'ar';
  const formRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !packageDetails || !purchaseId || !userId) return;

    setLoading(true);
    setError(null);

    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait

    // Wait for Moyasar script to load
    const initMoyasar = () => {
      attempts++;
      
      if (typeof window.Moyasar === 'undefined') {
        if (attempts >= maxAttempts) {
          console.error('Moyasar script failed to load after timeout');
          setError(t('payment.init_error'));
          setLoading(false);
          return;
        }
        setTimeout(initMoyasar, 100);
        return;
      }

      try {
        // Clear previous form
        if (formRef.current) {
          formRef.current.innerHTML = '';
        }

        // Get publishable key from environment variable
        const publishableKey = import.meta.env.VITE_MOYASAR_PUBLISHABLE_KEY;

        console.log('Moyasar init - publishable key exists:', !!publishableKey);

        if (!publishableKey) {
          console.error('Moyasar publishable key not configured');
          setError(t('payment.config_error'));
          setLoading(false);
          return;
        }

        const callbackUrl = `${window.location.origin}/payment-callback?purchase_id=${purchaseId}`;
        console.log('Moyasar callback URL:', callbackUrl);

        window.Moyasar.init({
          element: '.moyasar-form',
          amount: packageDetails.price * 100, // Convert to halalas
          currency: 'SAR',
          description: `${t('payment.purchase_description')} - ${packageDetails.credits} ${t('balance.credits')}`,
          publishable_api_key: publishableKey,
          callback_url: callbackUrl,
          metadata: {
            purchase_id: purchaseId,
            user_id: userId,
            package_id: packageDetails.id,
          },
          methods: ['creditcard', 'applepay'],
          apple_pay: {
            country: 'SA',
            label: 'Diviso',
            validate_merchant_url: 'https://api.moyasar.com/v1/applepay/initiate',
          },
        });

        console.log('Moyasar initialized successfully');
        setLoading(false);
      } catch (err) {
        console.error('Error initializing Moyasar:', err);
        setError(t('payment.init_error'));
        setLoading(false);
      }
    };

    // Small delay to ensure DOM is ready
    setTimeout(initMoyasar, 200);
  }, [open, packageDetails, purchaseId, userId, t]);

  if (!packageDetails) return null;

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
          {/* Package Summary */}
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{packageDetails.name}</p>
                <p className="text-sm text-muted-foreground">
                  {packageDetails.credits} {t('balance.credits')}
                </p>
              </div>
              <div className="text-end">
                <p className="text-2xl font-bold text-primary">
                  {packageDetails.price}
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

            <div ref={formRef} className="moyasar-form" />
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