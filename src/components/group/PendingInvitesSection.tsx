import { useTranslation } from "react-i18next";
import { usePendingGroupInvites } from "@/hooks/usePendingGroupInvites";
import { useGroupInviteActions } from "@/hooks/useGroupInviteActions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, X, UserPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PendingInvitesSectionProps {
  groupId: string | undefined;
  isAdmin: boolean;
}

export const PendingInvitesSection = ({ groupId, isAdmin }: PendingInvitesSectionProps) => {
  const { t } = useTranslation("groups");
  const { isRTL } = useLanguage();
  const { pendingInvites, isLoading, invalidate } = usePendingGroupInvites(groupId);
  const { cancelInvite, loading: cancelLoading } = useGroupInviteActions();

  const dateLocale = isRTL ? ar : enUS;

  const handleCancel = async (inviteId: string) => {
    const result = await cancelInvite(inviteId);
    if (result.success) {
      invalidate();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-24 flex-1" />
                <Skeleton className="h-7 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingInvites.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="w-4 h-4 text-muted-foreground" />
          {t("known_people.pending_invites")}
          <span className="text-xs text-muted-foreground font-normal">
            ({pendingInvites.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {pendingInvites.map((invite) => (
            <div
              key={invite.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={invite.invited_user_avatar || undefined} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {invite.invited_user_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {invite.invited_user_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("known_people.invited_by", { name: invite.invited_by_name })} •{" "}
                  {formatDistanceToNow(new Date(invite.created_at), {
                    addSuffix: true,
                    locale: dateLocale,
                  })}
                </p>
              </div>

              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0 h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      disabled={cancelLoading}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t("known_people.cancel_invite_title")}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("known_people.cancel_invite_desc", {
                          name: invite.invited_user_name,
                        })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("back")}</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleCancel(invite.id)}>
                        {t("known_people.cancel_invite_confirm")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
