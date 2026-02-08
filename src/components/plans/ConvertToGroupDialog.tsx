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
import { useTranslation } from "react-i18next";
import { Users } from "lucide-react";

interface ConvertToGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isConverting: boolean;
}

export function ConvertToGroupDialog({ open, onOpenChange, onConfirm, isConverting }: ConvertToGroupDialogProps) {
  const { t } = useTranslation('plans');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <AlertDialogTitle>{t('convert_dialog.title')}</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            {t('convert_dialog.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isConverting}>
            {t('create.back')}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isConverting}>
            {isConverting ? t('convert_dialog.converting') : t('convert_dialog.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
