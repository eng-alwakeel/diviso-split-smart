import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  RefreshCw, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface RenewalStatusCardProps {
  subscription: {
    billing_cycle?: string;
    auto_renew?: boolean;
    next_renewal_date?: string;
    grace_period_ends_at?: string | null;
    last_payment_status?: string;
    plan?: string;
  } | null;
  onToggleAutoRenew?: (enabled: boolean) => Promise<void>;
  onManageSubscription?: () => void;
  loading?: boolean;
}

export function RenewalStatusCard({
  subscription,
  onToggleAutoRenew,
  onManageSubscription,
  loading = false
}: RenewalStatusCardProps) {
  const { t, i18n } = useTranslation(['settings', 'common']);
  const isRTL = i18n.language === 'ar';

  if (!subscription || !subscription.plan || subscription.plan === 'free') {
    return null;
  }

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "d MMMM yyyy", { 
      locale: i18n.language === 'ar' ? ar : enUS 
    });
  };

  const isInGracePeriod = subscription.grace_period_ends_at && 
    new Date(subscription.grace_period_ends_at) > new Date();

  const gracePeriodDaysLeft = subscription.grace_period_ends_at
    ? Math.ceil((new Date(subscription.grace_period_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const getPaymentStatusIcon = () => {
    switch (subscription.last_payment_status) {
      case 'succeeded':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getPaymentStatusText = () => {
    switch (subscription.last_payment_status) {
      case 'succeeded':
        return t('settings:renewal.payment_succeeded');
      case 'failed':
        return t('settings:renewal.payment_failed');
      case 'pending':
        return t('settings:renewal.payment_pending');
      default:
        return t('settings:renewal.payment_unknown');
    }
  };

  return (
    <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground text-base">
          <RefreshCw className="w-5 h-5 text-accent" />
          {t('settings:renewal.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Grace Period Warning */}
        {isInGracePeriod && (
          <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              {t('settings:renewal.grace_period_warning', { days: gracePeriodDaysLeft })}
            </AlertDescription>
          </Alert>
        )}

        {/* Renewal Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Billing Cycle */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              {t('settings:renewal.billing_cycle')}
            </label>
            <Badge variant="outline" className="font-medium">
              {subscription.billing_cycle === 'yearly' 
                ? t('settings:renewal.yearly') 
                : t('settings:renewal.monthly')}
            </Badge>
          </div>

          {/* Auto Renew Status */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              {t('settings:renewal.auto_renew')}
            </label>
            <div className="flex items-center gap-2">
              <Switch
                checked={subscription.auto_renew !== false}
                onCheckedChange={onToggleAutoRenew}
                disabled={loading}
                className="scale-90"
              />
              <span className="text-sm">
                {subscription.auto_renew !== false 
                  ? t('settings:renewal.auto_renew_on') 
                  : t('settings:renewal.auto_renew_off')}
              </span>
            </div>
          </div>

          {/* Next Renewal Date */}
          {subscription.next_renewal_date && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {t('settings:renewal.next_renewal')}
              </label>
              <p className="text-sm font-medium">
                {formatDate(subscription.next_renewal_date)}
              </p>
            </div>
          )}

          {/* Last Payment Status */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              {t('settings:renewal.payment_status')}
            </label>
            <div className="flex items-center gap-1.5">
              {getPaymentStatusIcon()}
              <span className="text-sm">{getPaymentStatusText()}</span>
            </div>
          </div>
        </div>

        {/* Manage Button */}
        {onManageSubscription && (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onManageSubscription}
          >
            {t('settings:renewal.manage_renewal')}
          </Button>
        )}

        {/* Transparency Note */}
        <p className="text-[10px] text-muted-foreground/70 text-center">
          {subscription.billing_cycle === 'yearly' 
            ? t('settings:renewal.yearly_reminder_note')
            : t('settings:renewal.monthly_reminder_note')}
        </p>
      </CardContent>
    </Card>
  );
}