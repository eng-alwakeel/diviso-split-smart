import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { PlanMember } from "@/hooks/usePlanDetails";
import { Crown, Shield, User } from "lucide-react";

const roleIcons: Record<string, React.ElementType> = {
  owner: Crown,
  admin: Shield,
  member: User,
};

const roleColors: Record<string, string> = {
  owner: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  member: "bg-muted text-muted-foreground",
};

export function PlanMembersList({ members }: { members: PlanMember[] }) {
  const { t } = useTranslation('plans');

  const sortedMembers = [...members].sort((a, b) => {
    const order = { owner: 0, admin: 1, member: 2 };
    return (order[a.role as keyof typeof order] ?? 2) - (order[b.role as keyof typeof order] ?? 2);
  });

  return (
    <div className="space-y-2">
      {sortedMembers.map(member => {
        const RoleIcon = roleIcons[member.role] || User;
        const initials = member.display_name
          ? member.display_name.substring(0, 2).toUpperCase()
          : '??';

        return (
          <div key={member.user_id} className="flex items-center gap-3 p-2 rounded-lg">
            <Avatar className="w-9 h-9">
              <AvatarImage src={member.avatar_url || undefined} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {member.display_name || t('details.member')}
              </p>
            </div>
            <Badge variant="secondary" className={`text-xs ${roleColors[member.role] || ''}`}>
              <RoleIcon className="w-3 h-3 ltr:mr-1 rtl:ml-1" />
              {t(`details.${member.role}`)}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
