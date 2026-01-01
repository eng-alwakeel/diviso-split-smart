import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { 
  useUserRoles, 
  useAssignRole, 
  useRemoveRole, 
  ROLE_LABELS, 
  ROLE_DESCRIPTIONS 
} from "@/hooks/useRBAC";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

// Only admin-relevant roles for assignment
const ASSIGNABLE_ROLES: AppRole[] = [
  "owner",
  "admin", 
  "finance_admin",
  "growth_admin",
  "ads_admin",
  "support_agent",
  "analyst",
  "developer",
];

interface UserRolesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

export function UserRolesDialog({ 
  open, 
  onOpenChange, 
  userId, 
  userName 
}: UserRolesDialogProps) {
  const { data: currentRoles, isLoading } = useUserRoles(userId);
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();
  
  const [selectedRoles, setSelectedRoles] = useState<Set<AppRole>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentRoles) {
      setSelectedRoles(new Set(currentRoles as AppRole[]));
    }
  }, [currentRoles]);

  const handleRoleToggle = (role: AppRole) => {
    setSelectedRoles(prev => {
      const next = new Set(prev);
      if (next.has(role)) {
        next.delete(role);
      } else {
        next.add(role);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const currentSet = new Set(currentRoles as AppRole[]);
      
      // Find roles to add
      const toAdd = [...selectedRoles].filter(r => !currentSet.has(r));
      // Find roles to remove
      const toRemove = [...currentSet].filter(r => !selectedRoles.has(r));

      // Execute changes
      for (const role of toAdd) {
        await assignRole.mutateAsync({ userId, role });
      }
      for (const role of toRemove) {
        await removeRole.mutateAsync({ userId, role });
      }

      toast.success("تم تحديث الأدوار بنجاح");
      onOpenChange(false);
    } catch (error: any) {
      toast.error("خطأ في تحديث الأدوار", {
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            إدارة أدوار: {userName}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {ASSIGNABLE_ROLES.map((role) => (
              <div
                key={role}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  id={role}
                  checked={selectedRoles.has(role)}
                  onCheckedChange={() => handleRoleToggle(role)}
                />
                <div className="flex-1 space-y-1">
                  <Label 
                    htmlFor={role} 
                    className="flex items-center gap-2 cursor-pointer font-medium"
                  >
                    {ROLE_LABELS[role]}
                    {role === "owner" && (
                      <Badge variant="destructive" className="text-xs">
                        خطير
                      </Badge>
                    )}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {ROLE_DESCRIPTIONS[role]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            حفظ التغييرات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
