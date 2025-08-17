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
}

export const MemberCard = ({ 
  member, 
  currentUserId, 
  isOwner, 
  canAdmin, 
  groupId, 
  onMemberRemoved 
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
        <Avatar className="w-10 h-10">
          <AvatarFallback className="bg-primary/10 text-primary">
            {memberName.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <UserDisplayWithBadges
              userId={member.user_id}
              displayName={memberName}
              isCurrentUser={isCurrentUser}
              badgeSize="sm"
              showPlanBadge={false}
            />
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            {getRoleBadge()}
            {member.profile?.phone && (
              <span className="text-xs text-muted-foreground">
                {member.profile.phone}
              </span>
            )}
          </div>
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