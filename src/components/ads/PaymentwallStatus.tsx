import { usePaymentwallTokens } from '@/hooks/usePaymentwallTokens';
import { Badge } from '@/components/ui/badge';
import { Gift, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

export const PaymentwallStatus = () => {
  const { status, loading } = usePaymentwallTokens();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [countdown, setCountdown] = useState(status.cooldownSeconds);

  // Update countdown every second when cooldown is active
  useEffect(() => {
    setCountdown(status.cooldownSeconds);
    
    if (status.cooldownSeconds > 0) {
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [status.cooldownSeconds]);

  if (loading) return null;
  if (status.available === 0 && status.usedToday === 0) return null;

  const remaining = status.dailyLimit - status.usedToday;

  return (
    <div className={`flex items-center gap-2 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
      <Gift className="h-4 w-4 text-green-500" />
      <span>
        {isRTL 
          ? `متبقي اليوم: ${status.available} من ${status.dailyLimit} عمليات مجانية`
          : `Today: ${status.available} of ${status.dailyLimit} free operations left`
        }
      </span>
      
      {countdown > 0 && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {countdown}{isRTL ? 'ث' : 's'}
        </Badge>
      )}
    </div>
  );
};
