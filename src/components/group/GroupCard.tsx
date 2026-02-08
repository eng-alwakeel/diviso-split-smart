import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Users,
  TrendingUp,
  CreditCard,
  Settings,
  Archive,
  MoreVertical,
  Trash2,
  LogOut,
  Plus,
  FileText,
  Lock,
  Crown,
  Shield,
  User,
} from "lucide-react";
import type { Group } from "@/hooks/useGroups";

// ─── Helper: determine user role ───────────────────────────────
function getUserRole(
  group: Pick<Group, "owner_id" | "member_role">,
  currentUserId: string | null
): "owner" | "admin" | "member" {
  if (currentUserId && currentUserId === group.owner_id) return "owner";
  if (group.member_role === "admin") return "admin";
  return "member";
}

// ─── Role Badge ────────────────────────────────────────────────
function RoleBadge({ role }: { role: "owner" | "admin" | "member" }) {
  const { t } = useTranslation(["groups"]);
  switch (role) {
    case "owner":
      return (
        <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/30 text-[10px] gap-1" variant="outline">
          <Crown className="w-3 h-3" />
          {t("groups:card.role_owner")}
        </Badge>
      );
    case "admin":
      return (
        <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-[10px] gap-1" variant="outline">
          <Shield className="w-3 h-3" />
          {t("groups:card.role_admin")}
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[10px] gap-1">
          <User className="w-3 h-3" />
          {t("groups:card.role_member")}
        </Badge>
      );
  }
}

// ─── Status Badge ──────────────────────────────────────────────
function StatusBadge({ status }: { status: string | null | undefined }) {
  const { t } = useTranslation(["groups"]);
  const isClosed = status === "closed";
  if (isClosed) {
    return (
      <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] gap-1" variant="outline">
        <Lock className="w-3 h-3" />
        {t("groups:card.status_closed")}
      </Badge>
    );
  }
  return (
    <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-[10px] gap-1" variant="outline">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
      {t("groups:card.status_active")}
    </Badge>
  );
}

// ─── Props ─────────────────────────────────────────────────────
interface GroupCardProps {
  group: Group;
  variant: "compact" | "expanded";
  currentUserId: string | null;
  // Compact-specific
  onNavigate?: (path: string) => void;
  onArchive?: (groupId: string) => void;
  onDelete?: (groupId: string, name: string, ownerId: string) => void;
  onLeave?: (groupId: string, name: string, ownerId: string) => void;
  isArchived?: boolean;
  // Expanded-specific
  onAddExpense?: () => void;
  onOpenReport?: () => void;
  onOpenSettings?: () => void;
  onCloseGroup?: () => void;
  onDeleteGroup?: () => void;
  onLeaveGroup?: () => void;
  memberCount?: number;
  totalExpenses?: number;
  currencyLabel?: string;
  groupTypeLabel?: string;
  isLoading?: boolean;
}

// ─── Compact Card ──────────────────────────────────────────────
function CompactCard({
  group,
  currentUserId,
  onNavigate,
  onArchive,
  onDelete,
  onLeave,
  isArchived,
}: GroupCardProps) {
  const { t } = useTranslation(["groups"]);
  const role = getUserRole(group, currentUserId);
  const isOwner = role === "owner";
  const isAdmin = role === "owner" || role === "admin";
  const isClosed = group.status === "closed";

  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <CardTitle
            className="text-base leading-tight cursor-pointer hover:text-primary transition-colors"
            onClick={() => onNavigate?.(`/group/${group.id}`)}
          >
            {group.name}
          </CardTitle>
          <div className="flex items-center gap-1.5 flex-wrap">
            <StatusBadge status={group.status} />
            <RoleBadge role={role} />
          </div>
          <CardDescription className="flex items-center gap-2 text-xs">
            <Users className="h-3 w-3" />
            {group.member_count || 0} {t("groups:stats.member")}
            <span className="text-muted-foreground">•</span>
            {group.currency}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigate?.(`/group/${group.id}`)}
            className="flex-1"
          >
            <TrendingUp className="h-3 w-3 me-1" />
            {t("groups:card.view")}
          </Button>

          {!isClosed && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigate?.(`/add-expense?group=${group.id}`)}
              className="flex-1"
            >
              <CreditCard className="h-3 w-3 me-1" />
              {t("groups:card.expense")}
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="hover:bg-muted/50">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="z-50 min-w-[8rem] bg-popover border border-border shadow-lg">
              <DropdownMenuItem
                onClick={() => onNavigate?.(`/group/${group.id}?tab=settings`)}
                className="cursor-pointer"
              >
                <Settings className="h-4 w-4 me-2" />
                {t("groups:card.settings")}
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem
                  onClick={() => onArchive?.(group.id)}
                  className="cursor-pointer"
                >
                  <Archive className="h-4 w-4 me-2" />
                  {isArchived ? t("groups:card.restore") : t("groups:card.archive")}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {isOwner ? (
                <DropdownMenuItem
                  onClick={() => onDelete?.(group.id, group.name, group.owner_id)}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 me-2" />
                  {t("groups:card.delete")}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => onLeave?.(group.id, group.name, group.owner_id)}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 me-2" />
                  {t("groups:card.leave")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Expanded Card ─────────────────────────────────────────────
function ExpandedCard({
  group,
  currentUserId,
  onAddExpense,
  onOpenReport,
  onOpenSettings,
  onCloseGroup,
  onDeleteGroup,
  onLeaveGroup,
  memberCount,
  totalExpenses,
  currencyLabel,
  groupTypeLabel,
  isLoading,
}: GroupCardProps) {
  const { t } = useTranslation(["groups"]);
  const role = getUserRole(group, currentUserId);
  const isOwner = role === "owner";
  const isAdmin = role === "owner" || role === "admin";
  const isClosed = group.status === "closed";

  return (
    <div className="relative rounded-3xl border border-border/50 bg-gradient-card shadow-elevated p-6 md:p-8 backdrop-blur overflow-visible md:overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Info section */}
        <div className="flex items-center gap-4 min-w-0">
          <Avatar className="w-10 h-10 md:w-14 md:h-14">
            <AvatarFallback className="bg-primary/10 text-primary text-xl md:text-2xl font-bold">
              {(group.name || "م").slice(0, 1)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg md:text-2xl font-extrabold break-words">
                {group.name ?? "..."}
              </h1>
              {groupTypeLabel && (
                <Badge variant="outline" className="text-xs">
                  {groupTypeLabel}
                </Badge>
              )}
              <StatusBadge status={group.status} />
              <RoleBadge role={role} />
            </div>
            <div className="flex items-center gap-2 mt-2 text-[11px] md:text-sm text-muted-foreground flex-wrap">
              <span>
                {memberCount ?? 0}{" "}
                {(memberCount ?? 0) === 1
                  ? t("groups:stats.member")
                  : t("groups:stats.members")}
              </span>
              <span className="opacity-40">•</span>
              <span>
                {(totalExpenses ?? 0).toLocaleString()} {currencyLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2 w-full md:w-auto md:flex">
          <Button
            className="w-full md:w-auto text-xs md:text-sm"
            variant="outline"
            size="sm"
            onClick={onOpenReport}
            disabled={isLoading || !group}
          >
            <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 ml-2" />
            {t("groups:card.report")}
          </Button>

          {!isClosed ? (
            <div className="w-full md:w-auto">
              <Button
                variant="hero"
                size="icon"
                className="w-10 h-10 md:hidden mx-auto"
                onClick={onAddExpense}
              >
                <Plus className="w-4 h-4" />
                <span className="sr-only">{t("groups:card.add_expense")}</span>
              </Button>
              <Button
                variant="hero"
                size="sm"
                className="hidden md:inline-flex text-xs md:text-sm"
                onClick={onAddExpense}
              >
                <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 ml-2" />
                {t("groups:card.add_expense")}
              </Button>
            </div>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-full md:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full md:w-auto text-xs md:text-sm opacity-50"
                      disabled
                    >
                      <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 ml-2" />
                      {t("groups:card.add_expense")}
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("groups:card.closed_no_expense")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Close group — admin/owner only, active groups */}
          {isAdmin && !isClosed && (
            <Button
              className="w-full md:w-auto text-xs md:text-sm"
              variant="outline"
              size="sm"
              onClick={onCloseGroup}
            >
              <Lock className="w-3.5 h-3.5 md:w-4 md:h-4 ml-2" />
              {t("groups:card.close_group")}
            </Button>
          )}

          <Button
            className="w-full md:w-auto text-xs md:text-sm"
            variant="outline"
            size="sm"
            onClick={onOpenSettings}
          >
            <Settings className="w-3.5 h-3.5 md:w-4 md:h-4 ml-2" />
            {t("groups:details.settings")}
          </Button>

          {/* Dangerous actions in dropdown only */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full md:w-auto text-xs md:text-sm"
              >
                <MoreVertical className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="z-50 min-w-[8rem] bg-popover border border-border shadow-lg">
              {isOwner ? (
                <DropdownMenuItem
                  onClick={onDeleteGroup}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 me-2" />
                  {t("groups:card.delete")}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={onLeaveGroup}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 me-2" />
                  {t("groups:card.leave")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

// ─── Main Export ────────────────────────────────────────────────
export function GroupCard(props: GroupCardProps) {
  if (props.variant === "expanded") return <ExpandedCard {...props} />;
  return <CompactCard {...props} />;
}
