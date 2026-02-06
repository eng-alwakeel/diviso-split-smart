import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Star, Trophy, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserReputation } from '@/hooks/useUserReputation';

interface MemberProfile {
  id: string;
  display_name: string | null;
  name: string | null;
  avatar_url: string | null;
  city: string | null;
  bio: string | null;
}

interface MemberMiniProfileProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  groupId?: string;
}

export const MemberMiniProfile = ({
  open,
  onOpenChange,
  memberId,
  groupId
}: MemberMiniProfileProps) => {
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { reputation, fetchReputation, getRatingDisplay } = useUserReputation(memberId);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!open || !memberId) return;
      
      setLoading(true);
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, display_name, name, avatar_url, city, bio')
          .eq('id', memberId)
          .single();

        if (data) {
          setProfile(data as MemberProfile);
        }

        // Fetch reputation
        await fetchReputation(memberId);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [open, memberId, fetchReputation]);

  const displayName = profile?.display_name || profile?.name || 'مستخدم';
  const initials = displayName.slice(0, 2).toUpperCase();
  const ratingInfo = reputation ? getRatingDisplay(Number(reputation.average_rating)) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="sr-only">معلومات العضو</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex flex-col items-center text-center space-y-3">
              <Avatar className="w-20 h-20">
                {profile.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={displayName} />
                ) : (
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>
              
              <div>
                <h3 className="text-lg font-semibold">{displayName}</h3>
                {profile.city && (
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {profile.city}
                  </p>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">نبذة</p>
                  <p className="text-sm">{profile.bio}</p>
                </div>
              </>
            )}

            {/* Reputation */}
            <Separator />
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">السمعة</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">التقييم</span>
                </div>
                {reputation && reputation.total_ratings > 0 ? (
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < (ratingInfo?.stars || 0)
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({reputation.total_ratings})
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">لا يوجد تقييم</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">الأنشطة المكتملة</span>
                </div>
                <Badge variant="secondary">
                  {reputation?.completed_activities || 0}
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-8 text-center">
            <User className="w-12 h-12 text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">لم يتم العثور على البروفايل</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
