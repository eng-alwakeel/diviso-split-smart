import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Phone, Trash2, UserX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
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

interface PendingMemberCardProps {
  member: {
    id: string;
    user_id: string | null;
    role: string;
    status: string;
    phone_e164: string | null;
    profile: {
      display_name: string | null;
      name: string | null;
      avatar_url: string | null;
    } | null;
  };
  isAdmin: boolean;
  groupId: string;
  onRemoved: () => void;
}

export const PendingMemberCard = ({ member, isAdmin, groupId, onRemoved }: PendingMemberCardProps) => {
  const { toast } = useToast();
  const [removing, setRemoving] = useState(false);

  const displayName = member.profile?.display_name || member.profile?.name || member.phone_e164 || 'عضو معلق';
  const initials = displayName.substring(0, 2).toUpperCase();

  const handleArchive = async () => {
    setRemoving(true);
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', member.id)
        .eq('group_id', groupId);

      if (error) throw error;

      toast({ title: "تم إزالة العضو المعلق" });
      onRemoved();
    } catch (err: any) {
      toast({ title: "تعذر إزالة العضو", description: err.message, variant: "destructive" });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/50">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-muted text-muted-foreground text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-medium text-sm">{displayName}</span>
          {member.phone_e164 && (
            <span className="text-xs text-muted-foreground flex items-center gap-1" dir="ltr">
              <Phone className="w-3 h-3" />
              {member.phone_e164}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
          <Clock className="w-3 h-3 ltr:mr-1 rtl:ml-1" />
          {member.status === 'pending' ? 'بانتظار التسجيل' : 'بانتظار الموافقة'}
        </Badge>

        {isAdmin && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                disabled={removing}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>إزالة العضو المعلق</AlertDialogTitle>
                <AlertDialogDescription>
                  هل تريد إزالة {displayName} من المجموعة؟ يمكنك دعوته مرة أخرى لاحقاً.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={handleArchive}>إزالة</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
};
