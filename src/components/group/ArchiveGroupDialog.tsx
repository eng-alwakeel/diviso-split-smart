import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Archive, ArchiveRestore } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ArchiveGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupName: string;
  isArchived: boolean;
  isLoading: boolean;
  onConfirm: () => void;
}

export const ArchiveGroupDialog = ({
  open,
  onOpenChange,
  groupName,
  isArchived,
  isLoading,
  onConfirm,
}: ArchiveGroupDialogProps) => {
  const { t } = useTranslation(["groups"]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isArchived ? (
              <ArchiveRestore className="w-5 h-5 text-primary" />
            ) : (
              <Archive className="w-5 h-5 text-amber-500" />
            )}
            {isArchived
              ? t("archive.restore_title", "استعادة المجموعة؟")
              : t("archive.confirm_title", "أرشفة المجموعة؟")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isArchived ? (
              <>
                {t("archive.restore_description", "سيتم استعادة مجموعة")} <strong>"{groupName}"</strong>{" "}
                {t("archive.restore_description_cont", "وإعادتها للمجموعات النشطة.")}
              </>
            ) : (
              <>
                {t("archive.confirm_description", "سيتم نقل مجموعة")} <strong>"{groupName}"</strong>{" "}
                {t("archive.confirm_description_cont", "للأرشيف. يمكنك استعادتها لاحقاً من تبويب المجموعات المؤرشفة.")}
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common:cancel", "إلغاء")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={isArchived ? "" : "bg-amber-500 hover:bg-amber-600"}
          >
            {isLoading
              ? t("common:loading", "جاري...")
              : isArchived
              ? t("archive.restore", "استعادة")
              : t("archive.confirm", "أرشفة")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
