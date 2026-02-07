import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useKnownContacts } from "@/hooks/useKnownContacts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Search, Users2, Check } from "lucide-react";

interface KnownPeopleTabProps {
  groupId: string | undefined;
  existingMembers: string[];
  onMemberAdded?: () => void;
}

export const KnownPeopleTab = ({ groupId, existingMembers, onMemberAdded }: KnownPeopleTabProps) => {
  const { t } = useTranslation("groups");
  const [searchQuery, setSearchQuery] = useState("");
  const { contacts, isLoading, addMember, addingUserId, isAdding } = useKnownContacts(groupId, existingMembers);

  const filteredContacts = contacts.filter((contact) => {
    if (!searchQuery.trim()) return true;
    const name = (contact.display_name || contact.name || "").toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const getContactName = (contact: { display_name: string | null; name: string | null }) => {
    return contact.display_name || contact.name || "—";
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  const getSharedGroupsText = (count: number) => {
    if (count === 1) return t("known_people.shared_groups_one");
    return t("known_people.shared_groups_other", { count });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Users2 className="w-12 h-12 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">
          {t("known_people.empty_title")}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1 max-w-[250px]">
          {t("known_people.empty_desc")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      {contacts.length > 3 && (
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("known_people.search_placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9 h-9 text-sm"
          />
        </div>
      )}

      {/* Contact list */}
      <div className="space-y-1 max-h-[300px] overflow-y-auto">
        {filteredContacts.map((contact) => {
          const name = getContactName(contact);
          const isCurrentlyAdding = isAdding && addingUserId === contact.contact_user_id;

          return (
            <div
              key={contact.id}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={contact.avatar_url || undefined} alt={name} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{name}</p>
                <p className="text-xs text-muted-foreground">
                  {getSharedGroupsText(contact.shared_groups_count)}
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="shrink-0 h-8 gap-1 text-xs"
                disabled={isCurrentlyAdding}
                onClick={() => {
                  addMember(contact.contact_user_id);
                  onMemberAdded?.();
                }}
              >
                {isCurrentlyAdding ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    {t("known_people.adding")}
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    {t("known_people.add")}
                  </>
                )}
              </Button>
            </div>
          );
        })}

        {filteredContacts.length === 0 && searchQuery && (
          <p className="text-center text-sm text-muted-foreground py-4">
            {t("known_people.empty_title")}
          </p>
        )}
      </div>
    </div>
  );
};
