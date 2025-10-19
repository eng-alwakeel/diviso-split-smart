import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

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

  const isWarning = type === 'warning';
  const isCritical = type === 'critical';

  return (
    <Alert 
      variant={isCritical ? "destructive" : "warning"}
      className={`border-l-4 ${isWarning ? 'border-l-warning' : 'border-l-destructive'}`}
    >
      <AlertTriangle className="w-4 h-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1 ml-2">
          <div className="font-medium">
            {isCritical ? 'وصلت للحد الأقصى!' : 'تحذير: اقتراب من الحد الأقصى'}
          </div>
          <div className="text-sm mt-1">
            {quotaNames[quotaType] || quotaType}: {currentUsage} من {limit} ({Math.round(percentage)}%)
            {isCritical ? ' - لا يمكن إضافة المزيد' : ''}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant={isCritical ? "destructive" : "default"}
            onClick={() => navigate('/pricing-protected')}
          >
            ترقية الباقة
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setDismissed(true)}
            className="p-1 h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};