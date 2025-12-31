import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift, Copy, Check, Sparkles, X, Coins, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { SocialShareButtons } from '@/components/referral/SocialShareButtons';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface OnboardingShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rewardDetails?: {
    trialDays?: number;
    bonusCoins?: number;
  };
}

export const OnboardingShareDialog = ({
  open,
  onOpenChange,
  rewardDetails = { trialDays: 7, bonusCoins: 50 }
}: OnboardingShareDialogProps) => {
  const { t } = useTranslation(['dashboard', 'referral']);
  const { isRTL } = useLanguage();
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralLink, setReferralLink] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Fetch referral code
  useEffect(() => {
    const fetchReferralCode = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('referrals')
          .select('referral_code')
          .eq('inviter_id', user.id)
          .limit(1)
          .maybeSingle();

        if (data?.referral_code) {
          setReferralCode(data.referral_code);
          setReferralLink(`https://diviso.app/r/${data.referral_code}`);
        } else {
          // Generate a new code if none exists
          const newCode = `${user.id.slice(0, 8).toUpperCase()}`;
          setReferralCode(newCode);
          setReferralLink(`https://diviso.app/r/${newCode}`);
        }
      } catch (error) {
        console.error('Error fetching referral code:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchReferralCode();
    }
  }, [open]);

  // Trigger confetti when dialog opens
  useEffect(() => {
    if (open && !loading) {
      const timer = setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#FF6347', '#4CAF50', '#2196F3']
        });
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [open, loading]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: t('referral:toast.copied'),
        description: t('referral:toast.copied_desc')
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [referralLink, t]);

  const handleSkip = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-w-md p-0 overflow-hidden",
        isRTL && "rtl"
      )}>
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-primary via-primary/90 to-accent p-6 text-primary-foreground text-center relative">
          <button
            onClick={handleSkip}
            className="absolute top-3 end-3 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white animate-pulse" />
          </div>
          
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white text-center">
              {t('dashboard:onboarding.share_dialog.title', 'تهانينا! 🎉')}
            </DialogTitle>
          </DialogHeader>
          
          <p className="mt-2 text-white/90">
            {t('dashboard:onboarding.share_dialog.subtitle', 'أكملت جميع المهام بنجاح!')}
          </p>
        </div>

        {/* Rewards display */}
        <div className="p-6 space-y-6">
          <div className="flex justify-center gap-6">
            <div className="flex flex-col items-center gap-2 p-4 bg-primary/10 rounded-xl">
              <Calendar className="w-6 h-6 text-primary" />
              <span className="text-2xl font-bold text-primary">{rewardDetails.trialDays}</span>
              <span className="text-xs text-muted-foreground">
                {t('dashboard:onboarding.share_dialog.free_days', 'أيام مجانية')}
              </span>
            </div>
            
            <div className="flex flex-col items-center gap-2 p-4 bg-accent/10 rounded-xl">
              <Coins className="w-6 h-6 text-accent" />
              <span className="text-2xl font-bold text-accent">{rewardDetails.bonusCoins}</span>
              <span className="text-xs text-muted-foreground">
                {t('dashboard:onboarding.share_dialog.coins', 'عملة')}
              </span>
            </div>
          </div>

          {/* Share section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Gift className="w-4 h-4" />
              <span>{t('dashboard:onboarding.share_dialog.share_for_more', 'شارك واحصل على مكافآت إضافية!')}</span>
            </div>

            {!loading && referralCode && (
              <>
                <SocialShareButtons
                  referralLink={referralLink}
                  referralCode={referralCode}
                  layout="grid"
                  platforms={['whatsapp', 'telegram', 'twitter', 'snapchat']}
                  showLabels={true}
                />

                {/* Copy link section */}
                <div className="flex gap-2">
                  <Input
                    value={referralLink}
                    readOnly
                    className="text-sm bg-muted"
                    dir="ltr"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="flex-1"
            >
              {t('dashboard:onboarding.share_dialog.skip', 'تخطي')}
            </Button>
            <Button
              onClick={handleSkip}
              className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              {t('dashboard:onboarding.share_dialog.continue', 'متابعة')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
