import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, AlertTriangle, Users, Receipt, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface DeleteGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export const DeleteGroupDialog = ({
  open,
  onOpenChange,
  groupId,
  groupName,
  onConfirm,
  isDeleting,
}: DeleteGroupDialogProps) => {
  const { t } = useTranslation(["groups"]);
  const [checking, setChecking] = useState(false);
  const [expenseCount, setExpenseCount] = useState<number>(0);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [canDelete, setCanDelete] = useState(false);

  useEffect(() => {
    if (open && groupId) {
      checkDeletability();
    }
  }, [open, groupId]);

  const checkDeletability = async () => {
    setChecking(true);
    try {
      const [expensesRes, membersRes] = await Promise.all([
        supabase
          .from("expenses")
          .select("*", { count: "exact", head: true })
          .eq("group_id", groupId),
        supabase
          .from("group_members")
          .select("*", { count: "exact", head: true })
          .eq("group_id", groupId),
      ]);

      const expenses = expensesRes.count ?? 0;
      const members = membersRes.count ?? 0;

      setExpenseCount(expenses);
      setMemberCount(members);
      setCanDelete(expenses === 0 && members <= 1);
    } catch (error) {
      console.error("[DeleteGroupDialog] check error:", error);
    } finally {
      setChecking(false);
    }
  };

  const handleConfirm = async () => {
    if (!canDelete) return;
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            {t("delete.title", "حذف المجموعة")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("delete.description", "هل أنت متأكد من حذف مجموعة")} <strong>"{groupName}"</strong>؟
            <br />
            {t("delete.warning", "هذا الإجراء لا يمكن التراجع عنه.")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4 space-y-3">
          {checking ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !canDelete ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="space-y-2">
                <p className="font-medium">
                  {t("delete.cannot_delete", "لا يمكن حذف المجموعة للأسباب التالية:")}
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {expenseCount > 0 && (
                    <li className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 inline" />
                      {t("delete.has_expenses", "يوجد {{count}} مصاريف يجب حذفها أولاً", {
                        count: expenseCount,
                      })}
                    </li>
                  )}
                  {memberCount > 1 && (
                    <li className="flex items-center gap-2">
                      <Users className="w-4 h-4 inline" />
                      {t("delete.has_members", "يوجد {{count}} أعضاء يجب إزالتهم أولاً", {
                        count: memberCount - 1,
                      })}
                    </li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {t("delete.final_warning", "سيتم حذف المجموعة نهائياً بما فيها جميع البيانات المرتبطة.")}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>{t("common:cancel", "إلغاء")}</AlertDialogCancel>
          <Button
            onClick={handleConfirm}
            disabled={!canDelete || isDeleting || checking}
            variant="destructive"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                {t("delete.deleting", "جاري الحذف...")}
              </>
            ) : (
              t("delete.confirm", "حذف نهائياً")
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
