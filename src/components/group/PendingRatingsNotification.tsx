import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Star, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useMemberRatings } from '@/hooks/useMemberRatings';

interface Member {
  user_id: string;
  display_name?: string | null;
  name?: string | null;
  avatar_url?: string | null;
}

interface PendingRatingsNotificationProps {
  groupId: string;
  members: Member[];
  onStartRating: (pendingMembers: Member[]) => void;
}

export const PendingRatingsNotification = ({
  groupId,
  members,
  onStartRating
}: PendingRatingsNotificationProps) => {
  const { getPendingRatings } = useMemberRatings(groupId);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPending = async () => {
      setLoading(true);
      try {
        const memberIds = members.map(m => m.user_id);
        const pending = await getPendingRatings(memberIds);
        setPendingIds(pending);
      } finally {
        setLoading(false);
      }
    };

    if (members.length > 0) {
      checkPending();
    }
  }, [members, getPendingRatings]);

  if (loading) return null;

  const totalOthers = members.length - 1; // exclude self
  const ratedCount = totalOthers > 0 ? totalOthers - pendingIds.length : 0;
  const allRated = pendingIds.length === 0;
  const progressPercent = totalOthers > 0 ? (ratedCount / totalOthers) * 100 : 100;

  if (allRated) {
    return (
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">تم تقييم جميع الأعضاء ✅</p>
              <p className="text-sm text-muted-foreground">
                تم تقييم {ratedCount} من {totalOthers}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingMembers = members.filter(m => pendingIds.includes(m.user_id));

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">تقييم الأعضاء</p>
              <p className="text-sm text-muted-foreground">
                تم تقييم {ratedCount} من {totalOthers}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => onStartRating(pendingMembers)}
          >
            ابدأ التقييم
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </CardContent>
    </Card>
  );
};
