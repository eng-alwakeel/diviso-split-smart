import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

  if (dismissed) return null;

  const quotaNames = {
    groups: 'المجموعات',
    members: 'الأعضاء',
    expenses: 'المصاريف',
    invites: 'الدعوات',
    ocr: 'مسح الإيصالات'
  };

  const message = type === 'critical' 
    ? `وصلت للحد الأقصى من ${quotaNames[quotaType]} (${currentUsage}/${limit})`
    : `اقتراب من الحد: ${quotaNames[quotaType]} (${currentUsage}/${limit})`;

  return (
    <CompactAlert
      variant={type === 'critical' ? 'destructive' : 'warning'}
      message={message}
      actionLabel="ترقية"
      onAction={() => navigate('/pricing-protected')}
      onDismiss={() => setDismissed(true)}
    />
  );
};