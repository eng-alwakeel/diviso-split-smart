import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Search, Users, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface GroupOption {
  id: string;
  name: string;
  currency: string;
}

interface LinkToGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (groupId: string) => void;
  isLinking: boolean;
}

export function LinkToGroupDialog({ open, onOpenChange, onConfirm, isLinking }: LinkToGroupDialogProps) {
  const { t } = useTranslation('plans');
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchGroups = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: memberships } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id);

        if (!memberships?.length) {
          setGroups([]);
          return;
        }

        const groupIds = memberships.map(m => m.group_id);
        const { data } = await supabase
          .from('groups')
          .select('id, name, currency')
          .in('id', groupIds)
          .is('archived_at', null)
          .order('name');

        setGroups(data || []);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, [open]);

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('link_dialog.title')}</DialogTitle>
          <DialogDescription>{t('link_dialog.description')}</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('link_dialog.search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>

        <div className="max-h-60 overflow-y-auto space-y-1">
          {loading ? (
            <div className="text-center py-4 text-muted-foreground text-sm">...</div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              {t('link_dialog.no_groups')}
            </div>
          ) : (
            filteredGroups.map(group => (
              <button
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg text-start transition-colors",
                  selectedGroupId === group.id
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-muted border border-transparent"
                )}
              >
                <div className="p-1.5 rounded-md bg-muted">
                  <Users className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium flex-1">{group.name}</span>
                {selectedGroupId === group.id && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>
            ))
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={() => selectedGroupId && onConfirm(selectedGroupId)}
            disabled={!selectedGroupId || isLinking}
          >
            {isLinking ? t('link_dialog.linking') : t('link_dialog.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
