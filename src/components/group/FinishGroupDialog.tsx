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
import { Flag } from "lucide-react";

interface FinishGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
  groupName?: string;
}

export const FinishGroupDialog = ({
  open,
  onOpenChange,
  onConfirm,
  loading,
  groupName,
}: FinishGroupDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-amber-600" />
            إنهاء الرحلة
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              هل تريد إنهاء رحلة <strong className="text-foreground">{groupName}</strong>؟
            </p>
            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
              <li>لن يمكن إضافة مصاريف جديدة</li>
              <li>يمكن تسوية المبالغ المعلقة فقط</li>
              <li>يمكنك إعادة فتح الرحلة لاحقاً</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-amber-600 text-white hover:bg-amber-700"
          >
            {loading ? "جاري الإنهاء..." : "🏁 إنهاء الرحلة"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
