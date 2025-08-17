import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Shield, Crown, UserMinus } from "lucide-react";
import { useMemberActions } from "@/hooks/useMemberActions";
import { UserDisplayWithBadges } from "@/components/ui/user-display-with-badges";

interface Profile {
  id: string;
  display_name: string | null;
  name: string | null;
  avatar_url: string | null;
  phone: string | null;
}

interface GroupMember {
  id?: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  can_approve_expenses?: boolean;
  joined_at?: string;
  profile?: Profile | null;
}

interface MemberCardProps {
  member: GroupMember;
  currentUserId: string | null;
  isOwner: boolean;
  canAdmin: boolean;
  groupId: string;
  onMemberRemoved?: () => void;
  planConfig?: any;
}

export const MemberCard = ({ 
  member, 
  currentUserId, 
  isOwner, 
  canAdmin, 
  groupId, 
  onMemberRemoved,
  planConfig
}: MemberCardProps) => {
  const { removeMember, removing } = useMemberActions();
  
  const memberName = member.profile?.display_name || member.profile?.name || 'مستخدم';
  const isCurrentUser = member.user_id === currentUserId;
  const canRemove = canAdmin && !isCurrentUser && member.role !== 'owner';

  const handleRemove = async () => {
    const success = await removeMember(groupId, member.user_id, memberName);
    if (success && onMemberRemoved) {
      onMemberRemoved();
    }
  };

  const getRoleBadge = () => {
    switch (member.role) {
      case 'owner':
        return (
          <Badge variant="default" className="text-xs">
            <Crown className="w-3 h-3 mr-1" />
            مالك
          </Badge>
        );
      case 'admin':
        return (
          <Badge variant="secondary" className="text-xs">
            <Shield className="w-3 h-3 mr-1" />
            مدير
          </Badge>
        );
      default:
        return member.can_approve_expenses ? (
          <Badge variant="outline" className="text-xs">
            <Shield className="w-3 h-3 mr-1" />
            موافق
          </Badge>
        ) : null;
    }
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
      <div className="flex items-center gap-3">
        <UserDisplayWithBadges
          user={{
            id: member.user_id,
            display_name: member.profile?.display_name,
            name: member.profile?.name,
            avatar_url: member.profile?.avatar_url,
            phone: member.profile?.phone,
            is_admin: (member.profile as any)?.is_admin
          }}
          isCurrentUser={isCurrentUser}
          avatarSize="md"
          badgeSize="sm"
          showAvatar={true}
          showPlanBadge={true}
          className="flex-1"
          planConfig={planConfig}
        />
        
        <div className="flex items-center gap-2">
          {isCurrentUser && (
            <Badge variant="outline" className="text-xs">أنت</Badge>
          )}
          {getRoleBadge()}
        </div>
      </div>

      {canRemove && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
              disabled={removing}
            >
              <UserMinus className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>إزالة العضو</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من إزالة <strong>{memberName}</strong> من المجموعة؟
                <br /><br />
                سيتم التحقق من عدم وجود أرصدة مستحقة أو مدينة قبل الإزالة.
                إذا كان هناك رصيد، يجب تسويته أولاً.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemove}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={removing}
              >
                {removing ? "جاري الإزالة..." : "إزالة"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};