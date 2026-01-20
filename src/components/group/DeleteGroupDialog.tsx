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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DeleteGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupName: string;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export const DeleteGroupDialog = ({
  open,
  onOpenChange,
  groupName,
  onConfirm,
  isDeleting,
}: DeleteGroupDialogProps) => {
  const { t } = useTranslation(["groups"]);
  const [confirmationText, setConfirmationText] = useState("");

  // Reset confirmation text when dialog closes
  useEffect(() => {
    if (!open) {
      setConfirmationText("");
    }
  }, [open]);

  const canDelete = confirmationText === groupName;

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
          <AlertDialogDescription className="space-y-2">
            <span>
              {t("delete.description", "هل أنت متأكد من حذف مجموعة")}{" "}
              <strong>"{groupName}"</strong>؟
            </span>
            <br />
            <span className="text-destructive font-medium">
              {t("delete.warning", "سيتم حذف جميع المصاريف والتسويات والأعضاء نهائياً. هذا الإجراء لا يمكن التراجع عنه.")}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-4">
          <Label htmlFor="delete-confirmation">
            {t("delete.type_name_label", "اكتب اسم المجموعة للتأكيد:")}{" "}
            <strong className="text-destructive">"{groupName}"</strong>
          </Label>
          <Input
            id="delete-confirmation"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder={t("delete.type_name_placeholder", "اكتب الاسم هنا...")}
            dir="auto"
            disabled={isDeleting}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {t("common:cancel", "إلغاء")}
          </AlertDialogCancel>
          <Button
            onClick={handleConfirm}
            disabled={isDeleting || !canDelete}
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
