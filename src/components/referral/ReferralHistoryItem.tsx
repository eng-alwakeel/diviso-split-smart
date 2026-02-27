import { CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";
import type { InviteeProgress } from "@/hooks/useReferralStats";

interface ReferralHistoryItemProps {
  referral: InviteeProgress;
  formatDate: (date: string) => string;
}

export const ReferralHistoryItem = ({ referral, formatDate }: ReferralHistoryItemProps) => {
  const { t } = useTranslation('referral');

  const progressPercent = (referral.pointsEarned / 30) * 100;

  const getStatusText = () => {
    if (referral.stage !== 'joined') return t('history.pending');
    if (referral.firstUsageCompleted && referral.groupSettlementCompleted) return t('history.all_stages_complete');
    if (referral.firstUsageCompleted) return t('history.waiting_group');
    return t('history.waiting_first_usage');
  };

  return (
    <div className="p-3 bg-muted/30 rounded-lg space-y-2">
      {/* Top row: name + badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            referral.stage === 'joined'
              ? 'bg-green-100 text-green-600'
              : 'bg-orange-100 text-orange-600'
          }`}>
            {referral.stage === 'joined' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Clock className="w-4 h-4" />
            )}
          </div>
          <div>
            <p className="font-medium text-sm">{referral.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(referral.createdAt.toISOString())}
            </p>
          </div>
        </div>
        <Badge
          variant={referral.stage === 'joined' ? 'secondary' : 'outline'}
          className={referral.stage === 'joined'
            ? 'bg-green-100 text-green-700 border-green-200'
            : 'border-orange-300 text-orange-600'
          }
        >
          {referral.stage === 'joined' ? t('history.joined') : t('history.pending')}
        </Badge>
      </div>

      {/* Points progress (only for joined referrals) */}
      {referral.stage === 'joined' && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{getStatusText()}</span>
            <span className="font-semibold text-primary">
              {t('history.points_earned', { points: referral.pointsEarned })}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className={referral.firstUsageCompleted ? 'text-green-600 font-medium' : ''}>
              {referral.firstUsageCompleted ? '✓' : '○'} {t('history.first_usage_done')}
            </span>
            <span className={referral.groupSettlementCompleted ? 'text-green-600 font-medium' : ''}>
              {referral.groupSettlementCompleted ? '✓' : '○'} {t('history.group_settlement_done')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
