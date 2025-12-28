import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CompactAlert } from "@/components/ui/compact-alert";

interface QuotaWarningBannerProps {
  type: 'warning' | 'critical';
  quotaType: string;
  currentUsage: number;
  limit: number;
  percentage: number;
}

export const QuotaWarningBanner = ({ 
  type, 
  quotaType, 
  currentUsage, 
  limit, 
  percentage 
}: QuotaWarningBannerProps) => {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation('quota');

  if (dismissed) return null;

  const quotaName = t(`items.${quotaType}`, quotaType);

  const message = type === 'critical' 
    ? t('warnings.reached_limit', { item: quotaName }) + ` (${currentUsage}/${limit})`
    : t('warnings.near_limit', { item: quotaName, percentage }) + ` (${currentUsage}/${limit})`;

  return (
    <CompactAlert
      variant={type === 'critical' ? 'destructive' : 'warning'}
      message={message}
      actionLabel={t('upgrade.button')}
      onAction={() => navigate('/pricing-protected')}
      onDismiss={() => setDismissed(true)}
    />
  );
};
