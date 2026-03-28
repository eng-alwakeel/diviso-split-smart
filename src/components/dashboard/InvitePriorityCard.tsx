import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PendingInvite {
  id: string;
  group_id: string;
  group_name: string;
  invited_by_name: string | null;
}

export const InvitePriorityCard = memo(({ userId }: { userId?: string }) => {
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');

  const { data: invites = [] } = useQuery({
    queryKey: ['home-pending-invites', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('group_invites')
        .select('id, group_id, groups(name), profiles!group_invites_invited_by_fkey(full_name)')
        .eq('invited_user_id', userId)
        .eq('status', 'pending')
        .limit(3);
      
      if (error || !data) return [];
      
      return data.map((inv: any) => ({
        id: inv.id,
        group_id: inv.group_id,
        group_name: inv.groups?.name ?? t('home_modes.invite_card_title'),
        invited_by_name: inv.profiles?.full_name ?? null,
      })) as PendingInvite[];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });

  if (invites.length === 0) return null;

  return (
    <div className="space-y-2">
      {invites.map((invite) => (
        <Card key={invite.id} className="border-2 border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground text-sm truncate">
                  {invite.group_name}
                </p>
                {invite.invited_by_name && (
                  <p className="text-xs text-muted-foreground truncate">
                    {invite.invited_by_name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => navigate(`/groups/${invite.group_id}`)}
              >
                {t('home_modes.invite_card_accept')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground"
              >
                <Clock className="w-3 h-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

InvitePriorityCard.displayName = 'InvitePriorityCard';
