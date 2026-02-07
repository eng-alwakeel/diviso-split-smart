import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useBalanceNotification } from '@/hooks/useBalanceNotification';

interface BalanceDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balanceNotificationId: string | null;
  onPaid?: () => void;
}

export function BalanceDetailsSheet({
  open,
  onOpenChange,
  balanceNotificationId,
  onPaid,
}: BalanceDetailsSheetProps) {
  const { t } = useTranslation('notifications');
  const { isRTL } = useLanguage();
  const { details, loading, getDetails, markAsPaid } = useBalanceNotification();

  useEffect(() => {
    if (open && balanceNotificationId) {
      getDetails(balanceNotificationId);
    }
  }, [open, balanceNotificationId]);

  const handleMarkPaid = async () => {
    if (!balanceNotificationId) return;
    const success = await markAsPaid(balanceNotificationId);
    if (success) {
      onOpenChange(false);
      onPaid?.();
    }
  };

  const dateLocale = isRTL ? ar : enUS;

  if (loading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side={isRTL ? 'right' : 'left'} className="w-full sm:max-w-md">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isRTL ? 'right' : 'left'} className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-lg">
            💸 {t('balance_details.title')}
          </SheetTitle>
        </SheetHeader>

        {details && (
          <div className="mt-6 space-y-6">
            {/* Amount Due */}
            <div className="text-center p-6 bg-primary/5 rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">
                {t('balance_details.amount_label')}
              </p>
              <p className="text-3xl font-bold text-primary">
                {new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(details.amount_due)}{' '}
                {details.currency}
              </p>
            </div>

            <Separator />

            {/* Payer Info */}
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={details.payer_avatar_url || undefined} />
                <AvatarFallback>
                  {details.payer_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t('balance_details.for_label')}
                </p>
                <p className="font-medium">{details.payer_name}</p>
              </div>
            </div>

            <Separator />

            {/* Expense Details */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  {t('balance_details.reason_label')}
                </span>
                <span className="text-sm font-medium">
                  {details.expense_description || '-'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  {t('balance_details.date_label')}
                </span>
                <span className="text-sm font-medium">
                  {format(new Date(details.expense_date), 'd MMMM yyyy', {
                    locale: dateLocale,
                  })}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  {t('balance_details.group_label')}
                </span>
                <span className="text-sm font-medium">{details.group_name}</span>
              </div>
            </div>

            <Separator />

            {/* Action */}
            {details.status === 'marked_as_paid' ? (
              <Badge
                variant="secondary"
                className="w-full justify-center py-3 text-base bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              >
                <CheckCircle className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                {t('balance_details.already_paid')}
              </Badge>
            ) : (
              <Button
                onClick={handleMarkPaid}
                className="w-full py-6 text-base"
                size="lg"
              >
                <CheckCircle className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                {t('balance_details.mark_paid')}
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
