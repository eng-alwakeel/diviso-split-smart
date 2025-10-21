import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { UserTierInfo } from "@/hooks/useReferralTiers";
interface ReferralTierCardProps {
  userTier: UserTierInfo;
  progress: number;
}
export function ReferralTierCard({
  userTier,
  progress
}: ReferralTierCardProps) {
  return <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 py-[24px]">
      <div className="flex items-center gap-4 mb-4">
        <div className="text-4xl p-3 rounded-full" style={{
        backgroundColor: `${userTier.tier_color}20`
      }}>
          {userTier.tier_icon}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-primary mb-1">
            المستوى: {userTier.tier_name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {userTier.current_referrals} إحالة ناجحة
          </p>
        </div>
        <Badge variant="outline" style={{
        borderColor: userTier.tier_color,
        color: userTier.tier_color
      }}>
          {userTier.total_reward_days} يوم مجاني
        </Badge>
      </div>

      {userTier.next_tier_name && <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              للوصول إلى مستوى "{userTier.next_tier_name}"
            </span>
            <span className="font-medium">
              {userTier.referrals_needed} إحالات متبقية
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {Math.round(progress)}% مكتمل
          </p>
        </div>}

      {!userTier.next_tier_name && <div className="text-center py-4">
          <div className="text-2xl mb-2">🏆</div>
          <p className="text-sm font-medium text-primary">
            تهانينا! وصلت إلى أعلى مستوى
          </p>
        </div>}
    </Card>;
}