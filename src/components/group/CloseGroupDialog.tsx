import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Lock, MessageSquare, Receipt, UserMinus } from 'lucide-react';

interface CloseGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
  groupName?: string;
}

export const CloseGroupDialog = ({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
  groupName
}: CloseGroupDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            إنهاء نشاط المجموعة
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 text-right">
            <p>
              هل أنت متأكد من إنهاء نشاط مجموعة 
              <span className="font-semibold text-foreground"> "{groupName || 'المجموعة'}"</span>؟
            </p>
            
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-600 font-medium">
                <AlertTriangle className="w-4 h-4" />
                ما سيحدث بعد الإغلاق:
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-muted-foreground" />
                  <span>لن تتمكن من إضافة مصاريف جديدة</span>
                </li>
                <li className="flex items-center gap-2">
                  <UserMinus className="w-4 h-4 text-muted-foreground" />
                  <span>لن تتمكن من إضافة أو إزالة أعضاء</span>
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <span>سيُطلب من جميع الأعضاء تقييم بعضهم</span>
                </li>
              </ul>
            </div>
            
            <p className="text-xs text-muted-foreground">
              ملاحظة: لا يمكن التراجع عن هذا الإجراء.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-primary hover:bg-primary/90"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'تأكيد الإغلاق'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
