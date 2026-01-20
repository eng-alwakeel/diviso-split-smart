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
import { LogOut, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface LeaveGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupName: string;
  onConfirm: () => Promise<void>;
  isLeaving: boolean;
}

export const LeaveGroupDialog = ({
  open,
  onOpenChange,
  groupName,
  onConfirm,
  isLeaving,
}: LeaveGroupDialogProps) => {
  const { t } = useTranslation(["groups"]);

  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <LogOut className="w-5 h-5" />
            {t("leave.title", "مغادرة المجموعة")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("leave.description", "هل أنت متأكد من مغادرة مجموعة")}{" "}
            <strong>"{groupName}"</strong>؟
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLeaving}>
            {t("common:cancel", "إلغاء")}
          </AlertDialogCancel>
          <Button
            onClick={handleConfirm}
            disabled={isLeaving}
            variant="destructive"
          >
            {isLeaving ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                {t("leave.leaving", "جاري المغادرة...")}
              </>
            ) : (
              t("leave.confirm", "مغادرة")
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
