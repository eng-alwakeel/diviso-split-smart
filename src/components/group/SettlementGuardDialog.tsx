import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface SettlementGuardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProceedActiveOnly: () => void;
}

export const SettlementGuardDialog = ({
  open,
  onOpenChange,
  onProceedActiveOnly,
}: SettlementGuardDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            أعضاء غير مكتملي الانضمام
          </AlertDialogTitle>
          <AlertDialogDescription>
            لا يمكن إغلاق الحساب مع وجود أعضاء لم يكتمل انضمامهم. يمكنك المتابعة مع الأعضاء المنضمين فقط.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction onClick={onProceedActiveOnly}>
            استبعاد غير المنضمين
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
