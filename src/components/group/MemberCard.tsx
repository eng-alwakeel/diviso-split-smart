import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Shield, Crown, UserMinus, TrendingUp, TrendingDown, ArrowRight, Settings, Star } from "lucide-react";
import { useMemberActions } from "@/hooks/useMemberActions";
import { UserDisplayWithBadges } from "@/components/ui/user-display-with-badges";
import { MemberRoleDialog } from "./MemberRoleDialog";
import { MemberMiniProfile } from "./MemberMiniProfile";

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

interface Balance {
  user_id: string;
  net_balance: number;
  amount_paid: number;
  amount_owed: number;
}

interface MemberCardProps {
  member: GroupMember;
  currentUserId: string | null;
  isOwner: boolean;
  canAdmin: boolean;
  groupId: string;
  onMemberRemoved?: () => void;
  planConfig?: any;
  balance?: Balance;
  pendingAmount?: {
    user_id: string;
    pending_paid: number;
    pending_owed: number;
    pending_net: number;
  };
  currency?: string;
  allBalances?: Balance[];
  profiles?: Record<string, { display_name?: string | null; name?: string | null }>;
  showReputation?: boolean;
}

export const MemberCard = ({ 
  member, 
  currentUserId, 
  isOwner, 
  canAdmin, 
  groupId, 
  onMemberRemoved,
  planConfig,
  balance,
  pendingAmount,
  currency = "ر.س",
  allBalances = [],
  profiles = {},
  showReputation = false
}: MemberCardProps) => {
  const { removeMember, removing } = useMemberActions();
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [miniProfileOpen, setMiniProfileOpen] = useState(false);
  
  const memberName = member.profile?.display_name || member.profile?.name || 'مستخدم';
  const isCurrentUser = member.user_id === currentUserId;
  const canRemove = canAdmin && !isCurrentUser && member.role !== 'owner';
  const canEditRole = canAdmin && !isCurrentUser && member.role !== 'owner';

  const handleRemove = async () => {
    const success = await removeMember(groupId, member.user_id, memberName);
    if (success && onMemberRemoved) {
      onMemberRemoved();
    }
  };

  const formatName = (userId: string) => {
    const profile = profiles[userId];
    return profile?.display_name || profile?.name || `${userId.slice(0, 4)}...`;
  };

  // Calculate who this member owes or is owed by
  const getSettlementInfo = () => {
    if (!balance) return null;
    
    const netBalance = balance.net_balance;
    if (Math.abs(netBalance) < 0.01) return null;
    
    if (netBalance < 0) {
      // Member owes money - find creditors
      const creditors = allBalances.filter(b => b.user_id !== member.user_id && b.net_balance > 0);
      if (creditors.length > 0) {
        const topCreditor = creditors.sort((a, b) => b.net_balance - a.net_balance)[0];
        return {
          type: 'owes' as const,
          toUserId: topCreditor.user_id,
          toName: formatName(topCreditor.user_id),
          amount: Math.min(Math.abs(netBalance), topCreditor.net_balance)
        };
      }
    } else {
      // Member is owed money - find debtors
      const debtors = allBalances.filter(b => b.user_id !== member.user_id && b.net_balance < 0);
      if (debtors.length > 0) {
        const topDebtor = debtors.sort((a, b) => a.net_balance - b.net_balance)[0];
        return {
          type: 'owed' as const,
          fromUserId: topDebtor.user_id,
          fromName: formatName(topDebtor.user_id),
          amount: Math.min(netBalance, Math.abs(topDebtor.net_balance))
        };
      }
    }
    
    return null;
  };

  const settlementInfo = getSettlementInfo();

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

  const netBalance = balance?.net_balance ?? 0;
  const isCreditor = netBalance > 0.01;
  const isDebtor = netBalance < -0.01;

  return (
    <>
      <div className="flex flex-col gap-3 p-4 rounded-lg bg-card border border-border">
        <div className="flex items-center justify-between">
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

          <div className="flex items-center gap-1">
            {/* Role Edit Button */}
            {canEditRole && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
                onClick={() => setRoleDialogOpen(true)}
                title="تعديل الصلاحيات"
              >
                <Settings className="w-4 h-4" />
              </Button>
            )}

            {/* Remove Button */}
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
        </div>

        {/* Balance Display */}
        {balance && (
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              {isCreditor && (
                <>
                  <TrendingUp className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium text-accent">
                    له {Math.abs(netBalance).toLocaleString()} {currency}
                  </span>
                </>
              )}
              {isDebtor && (
                <>
                  <TrendingDown className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">
                    عليه {Math.abs(netBalance).toLocaleString()} {currency}
                  </span>
                </>
              )}
              {!isCreditor && !isDebtor && (
                <span className="text-sm text-muted-foreground">متوازن</span>
              )}
            </div>
            
            {settlementInfo && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {settlementInfo.type === 'owes' ? (
                  <>
                    <ArrowRight className="w-3 h-3" />
                    <span>يدفع لـ {settlementInfo.toName}</span>
                  </>
                ) : (
                  <>
                    <span>يستلم من {settlementInfo.fromName}</span>
                    <ArrowRight className="w-3 h-3 rotate-180" />
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Pending amounts */}
        {pendingAmount && Math.abs(pendingAmount.pending_net) > 0.01 && (
          <div className="text-xs text-amber-600 bg-amber-500/10 rounded px-2 py-1">
            معلق: {pendingAmount.pending_net > 0 ? '+' : ''}{pendingAmount.pending_net.toLocaleString()} {currency}
          </div>
        )}
      </div>

      {/* Role Dialog */}
      <MemberRoleDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        groupId={groupId}
        member={member}
        onUpdated={onMemberRemoved}
      />
    </>
  );
};
