import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { SEO } from '@/components/SEO';

type PaymentStatus = 'loading' | 'success' | 'failed' | 'pending';

const PaymentCallback: React.FC = () => {
  const { t, i18n } = useTranslation(['credits', 'common']);
  const isRTL = i18n.language === 'ar';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [creditsAdded, setCreditsAdded] = useState<number>(0);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      const purchaseId = searchParams.get('purchase_id');
      const paymentStatus = searchParams.get('status');
      const paymentId = searchParams.get('id');

      console.log('Payment callback params:', { purchaseId, paymentStatus, paymentId });

      if (!purchaseId) {
        setStatus('failed');
        return;
      }

      // If Moyasar indicates failed payment
      if (paymentStatus === 'failed') {
        await supabase
          .from('credit_purchases')
          .update({ status: 'failed' })
          .eq('id', purchaseId);
        setStatus('failed');
        return;
      }

      // First, try to verify payment directly via edge function (fallback for webhook)
      if (paymentId) {
        console.log('Attempting direct payment verification...');
        try {
          const { data: verifyResult, error: verifyError } = await supabase.functions.invoke('verify-payment', {
            body: { purchaseId, paymentId }
          });

          console.log('Verify payment result:', verifyResult, verifyError);

          if (verifyResult?.success && verifyResult?.status === 'completed') {
            // Get the credits from the purchase
            const { data: purchase } = await supabase
              .from('credit_purchases')
              .select('credits_purchased')
              .eq('id', purchaseId)
              .single();
            
            setCreditsAdded(purchase?.credits_purchased || 0);
            setStatus('success');
            return;
          } else if (verifyResult?.status === 'failed') {
            setStatus('failed');
            return;
          }
        } catch (err) {
          console.error('Error calling verify-payment:', err);
          // Continue to polling as fallback
        }
      }

      // Poll for purchase completion (webhook might take a moment)
      let attempts = 0;
      const maxAttempts = 10;
      
      const checkPurchase = async (): Promise<boolean> => {
        const { data: purchase, error } = await supabase
          .from('credit_purchases')
          .select('status, credits_purchased')
          .eq('id', purchaseId)
          .single();

        if (error) {
          console.error('Error checking purchase:', error);
          return false;
        }

        console.log('Purchase status:', purchase?.status);

        if (purchase?.status === 'completed') {
          setCreditsAdded(purchase.credits_purchased);
          setStatus('success');
          return true;
        }

        if (purchase?.status === 'failed') {
          setStatus('failed');
          return true;
        }

        return false;
      };

      // Initial check
      if (await checkPurchase()) return;

      // Poll every 2 seconds
      const interval = setInterval(async () => {
        attempts++;
        if (await checkPurchase() || attempts >= maxAttempts) {
          clearInterval(interval);
          if (attempts >= maxAttempts) {
            setStatus('pending');
          }
        }
      }, 2000);

      return () => clearInterval(interval);
    };

    checkPaymentStatus();
  }, [searchParams]);

  const handleContinue = () => {
    navigate('/credit-store');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <SEO title={t('payment.callback_title')} noIndex={true} />
      
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-6">
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin" />
              <h2 className="text-xl font-semibold">{t('payment.processing')}</h2>
              <p className="text-muted-foreground">{t('payment.please_wait')}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-green-600">{t('payment.success')}</h2>
              <p className="text-muted-foreground">
                {t('payment.credits_added', { count: creditsAdded })}
              </p>
              <Button onClick={handleContinue} className="w-full gap-2">
                {t('payment.continue_to_store')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="w-20 h-20 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-red-600">{t('payment.failed')}</h2>
              <p className="text-muted-foreground">{t('payment.failed_description')}</p>
              <Button onClick={handleContinue} variant="outline" className="w-full">
                {t('payment.try_again')}
              </Button>
            </>
          )}

          {status === 'pending' && (
            <>
              <div className="w-20 h-20 mx-auto rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Loader2 className="h-12 w-12 text-yellow-600" />
              </div>
              <h2 className="text-xl font-semibold text-yellow-600">{t('payment.pending')}</h2>
              <p className="text-muted-foreground">{t('payment.pending_description')}</p>
              <Button onClick={handleContinue} variant="outline" className="w-full">
                {t('payment.back_to_store')}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCallback;