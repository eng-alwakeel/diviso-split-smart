import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { SEO } from '@/components/SEO';

type PaymentStatus = 'loading' | 'success' | 'failed' | 'pending';
type PaymentType = 'credits' | 'subscription';

const PaymentCallback: React.FC = () => {
  const { t, i18n } = useTranslation(['credits', 'common']);
  const isRTL = i18n.language === 'ar';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [creditsAdded, setCreditsAdded] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<PaymentType>('credits');

  useEffect(() => {
    const checkPaymentStatus = async () => {
      const purchaseId = searchParams.get('purchase_id');
      const paymentStatus = searchParams.get('status');
      const paymentId = searchParams.get('id');
      const type = searchParams.get('type') as PaymentType || 'credits';
      
      setPaymentType(type);

      console.log('Payment callback params:', { purchaseId, paymentStatus, paymentId, type });

      if (!purchaseId) {
        setStatus('failed');
        return;
      }

      const tableName = type === 'subscription' ? 'subscription_purchases' : 'credit_purchases';

      // If Moyasar indicates failed payment
      if (paymentStatus === 'failed') {
        await supabase
          .from(tableName)
          .update({ status: 'failed' })
          .eq('id', purchaseId);
        setStatus('failed');
        return;
      }

      // For subscriptions, handle differently
      if (type === 'subscription') {
        await handleSubscriptionPayment(purchaseId, paymentId);
        return;
      }

      // For credits, use existing logic
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

    const handleSubscriptionPayment = async (purchaseId: string, paymentId: string | null) => {
      try {
        // Use the complete_subscription_purchase function for consistent handling
        if (paymentId) {
          const { data: result, error: rpcError } = await supabase.rpc('complete_subscription_purchase', {
            p_purchase_id: purchaseId,
            p_payment_reference: paymentId
          });

          console.log('complete_subscription_purchase result:', result, rpcError);

          if (rpcError) {
            console.error('Error completing subscription purchase:', rpcError);
            // Fallback to manual handling if function doesn't exist
            await handleSubscriptionPaymentManual(purchaseId, paymentId);
            return;
          }

          // Type-safe access to result
          const resultObj = result as { success?: boolean; credits_granted?: { credits_granted?: number } } | null;
          if (resultObj?.success) {
            setCreditsAdded(resultObj.credits_granted?.credits_granted || 0);
            setStatus('success');
            return;
          }
        }

        // Fallback for pending verification
        await handleSubscriptionPaymentManual(purchaseId, paymentId);
      } catch (err) {
        console.error('Error handling subscription payment:', err);
        setStatus('failed');
      }
    };

    const handleSubscriptionPaymentManual = async (purchaseId: string, paymentId: string | null) => {
      try {
        // Update subscription purchase with payment ID
        if (paymentId) {
          await supabase
            .from('subscription_purchases')
            .update({ 
              status: 'completed', 
              payment_id: paymentId,
              completed_at: new Date().toISOString()
            })
            .eq('id', purchaseId);
        }

        // Get the subscription purchase details
        const { data: purchase, error } = await supabase
          .from('subscription_purchases')
          .select('*, subscription_plans(*)')
          .eq('id', purchaseId)
          .single();

        if (error || !purchase) {
          console.error('Error fetching subscription purchase:', error);
          setStatus('failed');
          return;
        }

        // Calculate subscription dates
        const now = new Date();
        const expiresAt = new Date(now);
        if (purchase.billing_cycle === 'yearly') {
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        } else {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        }

        // Check if user already has a subscription
        const { data: existingSub } = await supabase
          .from('user_subscriptions')
          .select('id')
          .eq('user_id', purchase.user_id)
          .single();

        // استخدام اسم الخطة الفعلي من subscription_plans
        const rawPlanName = purchase.subscription_plans?.name || 'starter_monthly';
        // تحويل الاسم للشكل المناسب (starter_monthly, pro_yearly, etc.)
        const planName = rawPlanName.toLowerCase().includes('_') 
          ? rawPlanName.toLowerCase()
          : `${rawPlanName.toLowerCase()}_${purchase.billing_cycle || 'monthly'}`;

        if (existingSub) {
          // Update existing subscription
          const { error: updateError } = await supabase
            .from('user_subscriptions')
            .update({
              plan: planName as any, // استخدام any للتوافق مع الأنواع الجديدة
              status: 'active' as const,
              started_at: now.toISOString(),
              expires_at: expiresAt.toISOString(),
              last_credits_granted_at: now.toISOString(),
              updated_at: now.toISOString()
            })
            .eq('user_id', purchase.user_id);

          if (updateError) {
            console.error('Error updating subscription:', updateError);
            setStatus('failed');
            return;
          }
        } else {
          // Create new subscription
          const { error: insertError } = await supabase
            .from('user_subscriptions')
            .insert([{
              user_id: purchase.user_id,
              plan: planName as any, // استخدام any للتوافق مع الأنواع الجديدة
              status: 'active' as const,
              started_at: now.toISOString(),
              expires_at: expiresAt.toISOString(),
              last_credits_granted_at: now.toISOString()
            }]);

          if (insertError) {
            console.error('Error creating subscription:', insertError);
            setStatus('failed');
            return;
          }
        }

        // Grant subscription credits
        const originalPlanName = purchase.subscription_plans?.name || 'Pro';
        const { data: grantResult, error: grantError } = await supabase.rpc('grant_subscription_credits', {
          p_user_id: purchase.user_id,
          p_plan_name: originalPlanName
        });

        if (grantError) {
          console.error('Error granting subscription credits:', grantError);
        } else {
          console.log('Granted subscription credits:', grantResult);
        }

        // Create invoice for the subscription purchase
        const billingCycleAr = purchase.billing_cycle === 'yearly' ? 'سنوي' : 'شهري';
        const { error: invoiceError } = await supabase.rpc('create_invoice_for_purchase', {
          p_user_id: purchase.user_id,
          p_purchase_type: 'subscription',
          p_purchase_id: purchaseId,
          p_amount: purchase.price_paid,
          p_description: `${purchase.subscription_plans?.name || 'Subscription'} (${purchase.billing_cycle})`,
          p_description_ar: `اشتراك ${purchase.subscription_plans?.name || ''} (${billingCycleAr})`,
          p_payment_reference: paymentId || null,
          p_billing_cycle: purchase.billing_cycle
        });

        if (invoiceError) {
          console.error('Error creating invoice:', invoiceError);
        } else {
          console.log('Invoice created successfully for subscription:', purchaseId);
        }

        setCreditsAdded(purchase.subscription_plans?.credits_per_month || 0);
        setStatus('success');
      } catch (err) {
        console.error('Error handling subscription payment manually:', err);
        setStatus('failed');
      }
    };

    checkPaymentStatus();
  }, [searchParams]);

  const handleContinue = () => {
    navigate(paymentType === 'subscription' ? '/dashboard' : '/credit-store');
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