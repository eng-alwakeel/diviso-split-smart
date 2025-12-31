import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, CreditCard, Gift, Zap, Users, Sparkles } from 'lucide-react';
import { CREDIT_COSTS, CreditActionType } from '@/hooks/useUsageCredits';

interface InsufficientCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionType: CreditActionType;
  currentBalance: number;
  requiredCredits: number;
}

export function InsufficientCreditsDialog({
  open,
  onOpenChange,
  actionType,
  currentBalance,
  requiredCredits
}: InsufficientCreditsDialogProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('credits');
  const isRTL = i18n.language === 'ar';

  const shortfall = requiredCredits - currentBalance;
  const action = CREDIT_COSTS[actionType];
  const actionName = isRTL ? action.nameAr : action.nameEn;

  const handleSubscribe = () => {
    onOpenChange(false);
    navigate('/pricing-protected');
  };

  const handlePurchase = () => {
    onOpenChange(false);
    navigate('/credit-store');
  };

  const handleFreeCredits = () => {
    onOpenChange(false);
    navigate('/referral');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
            <Coins className="h-6 w-6 text-amber-600" />
          </div>
          <DialogTitle className="text-xl">{t('insufficient.title')}</DialogTitle>
          <DialogDescription className="whitespace-pre-line text-center">
            {t('insufficient.message')}
          </DialogDescription>
        </DialogHeader>

        {/* Current Status */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('insufficient.current_balance', { balance: currentBalance })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('insufficient.required', { required: requiredCredits })}</span>
            <Badge variant="secondary">{actionName}</Badge>
          </div>
          <div className="flex justify-between text-sm font-medium text-destructive">
            <span>{t('insufficient.shortfall', { shortfall })}</span>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3 mt-4">
          {/* Option 1: Subscribe */}
          <Card 
            className="p-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
            onClick={handleSubscribe}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground">{t('insufficient.subscribe')}</h4>
                <p className="text-sm text-muted-foreground">{t('insufficient.subscribe_desc')}</p>
              </div>
              <Badge className="bg-primary/10 text-primary border-0">Pro</Badge>
            </div>
          </Card>

          {/* Option 2: Purchase */}
          <Card 
            className="p-4 cursor-pointer hover:border-amber-500/50 hover:bg-amber-500/5 transition-all"
            onClick={handlePurchase}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <CreditCard className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground">{t('insufficient.purchase')}</h4>
                <p className="text-sm text-muted-foreground">{t('insufficient.purchase_desc')}</p>
              </div>
              <Coins className="h-5 w-5 text-amber-500" />
            </div>
          </Card>

          {/* Option 3: Free Credits */}
          <Card 
            className="p-4 cursor-pointer hover:border-green-500/50 hover:bg-green-500/5 transition-all"
            onClick={handleFreeCredits}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <Gift className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground">{t('insufficient.free')}</h4>
                <p className="text-sm text-muted-foreground">{t('insufficient.free_desc')}</p>
              </div>
              <div className="flex gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Sparkles className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </Card>
        </div>

        <Button variant="ghost" className="w-full mt-2" onClick={() => onOpenChange(false)}>
          {t('common:cancel')}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
