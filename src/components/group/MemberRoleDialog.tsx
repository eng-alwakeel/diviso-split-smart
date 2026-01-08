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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useMemberRoles, MemberRole } from "@/hooks/useMemberRoles";
import { Shield, User } from "lucide-react";
import { useTranslation } from "react-i18next";

interface MemberRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  member: {
    user_id: string;
    role: "owner" | "admin" | "member";
    can_approve_expenses?: boolean;
    profile?: {
      display_name?: string | null;
      name?: string | null;
    } | null;
  };
  onUpdated?: () => void;
}

export const MemberRoleDialog = ({
  open,
  onOpenChange,
  groupId,
  member,
  onUpdated,
}: MemberRoleDialogProps) => {
  const { t } = useTranslation(["groups"]);
  const { updateMemberRole, updating } = useMemberRoles();
  
  const [selectedRole, setSelectedRole] = useState<MemberRole>(
    member.role === "owner" ? "admin" : member.role
  );
  const [canApprove, setCanApprove] = useState(member.can_approve_expenses ?? false);

  const memberName = member.profile?.display_name || member.profile?.name || "العضو";

  useEffect(() => {
    if (open) {
      setSelectedRole(member.role === "owner" ? "admin" : member.role);
      setCanApprove(member.can_approve_expenses ?? false);
    }
  }, [open, member]);

  const handleSave = async () => {
    const success = await updateMemberRole(
      groupId,
      member.user_id,
      selectedRole,
      canApprove
    );
    
    if (success) {
      onOpenChange(false);
      onUpdated?.();
    }
  };

  const hasChanges =
    selectedRole !== (member.role === "owner" ? "admin" : member.role) ||
    canApprove !== (member.can_approve_expenses ?? false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("roles.dialog_title", { name: memberName })}</DialogTitle>
          <DialogDescription>
            {t("roles.dialog_description", "تعديل دور وصلاحيات العضو في المجموعة")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Role Selection */}
          <div className="space-y-3">
            <Label>{t("roles.role_label", "الدور")}</Label>
            <RadioGroup
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as MemberRole)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2 space-x-reverse p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="member" id="role-member" />
                <Label
                  htmlFor="role-member"
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{t("roles.member", "عضو عادي")}</div>
                    <div className="text-xs text-muted-foreground">
                      {t("roles.member_desc", "يمكنه إضافة المصاريف والمشاركة في المجموعة")}
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="admin" id="role-admin" />
                <Label
                  htmlFor="role-admin"
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <Shield className="w-4 h-4 text-primary" />
                  <div>
                    <div className="font-medium">{t("roles.admin", "مدير")}</div>
                    <div className="text-xs text-muted-foreground">
                      {t("roles.admin_desc", "يمكنه إدارة الأعضاء والإعدادات واعتماد المصاريف")}
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Additional Permissions */}
          <div className="space-y-3 pt-2 border-t">
            <Label>{t("roles.permissions_label", "صلاحيات إضافية")}</Label>
            <div className="flex items-center space-x-2 space-x-reverse p-3 rounded-lg border border-border">
              <Checkbox
                id="can-approve"
                checked={canApprove}
                onCheckedChange={(checked) => setCanApprove(checked === true)}
              />
              <Label
                htmlFor="can-approve"
                className="cursor-pointer flex-1"
              >
                <div className="font-medium">
                  {t("roles.can_approve", "يمكنه اعتماد المصاريف")}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t("roles.can_approve_desc", "السماح للعضو بالموافقة على مصاريف الأعضاء الآخرين")}
                </div>
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common:cancel", "إلغاء")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={updating || !hasChanges}
          >
            {updating ? t("common:saving", "جاري الحفظ...") : t("roles.save", "حفظ التغييرات")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
