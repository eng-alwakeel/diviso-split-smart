import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Star, ChevronLeft } from 'lucide-react';
import { useMemberRatings } from '@/hooks/useMemberRatings';

interface Member {
  user_id: string;
  display_name?: string | null;
  name?: string | null;
}

interface PendingRatingsNotificationProps {
  groupId: string;
  members: Member[];
  onStartRating: () => void;
}

export const PendingRatingsNotification = ({
  groupId,
  members,
  onStartRating
}: PendingRatingsNotificationProps) => {
  const { getPendingRatings } = useMemberRatings(groupId);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPending = async () => {
      setLoading(true);
      try {
        const memberIds = members.map(m => m.user_id);
        const pending = await getPendingRatings(memberIds);
        setPendingCount(pending.length);
      } finally {
        setLoading(false);
      }
    };

    if (members.length > 0) {
      checkPending();
    }
  }, [members, getPendingRatings]);

  if (loading || pendingCount === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">تقييم الأعضاء</p>
              <p className="text-sm text-muted-foreground">
                {pendingCount === 1 
                  ? 'عضو واحد لم تقيّمه بعد'
                  : pendingCount === 2
                    ? 'عضوان لم تقيّمهم بعد'
                    : `${pendingCount} أعضاء لم تقيّمهم بعد`
                }
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={onStartRating}
          >
            ابدأ التقييم
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
