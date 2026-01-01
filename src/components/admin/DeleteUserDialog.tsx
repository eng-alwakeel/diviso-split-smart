import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminUserActions } from "@/hooks/useAdminUserActions";
import { Loader2 } from "lucide-react";

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

export function DeleteUserDialog({ open, onOpenChange, userId, userName }: DeleteUserDialogProps) {
  const [confirmation, setConfirmation] = useState("");
  const [reason, setReason] = useState("");
  const { deleteUser } = useAdminUserActions();

  const canDelete = confirmation === "حذف" && reason.trim().length > 0;

  const handleDelete = async () => {
    if (!canDelete) return;
    
    await deleteUser.mutateAsync({
      userId,
      reason: reason.trim()
    });
    
    setConfirmation("");
    setReason("");
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">حذف المستخدم نهائياً</AlertDialogTitle>
          <AlertDialogDescription>
            أنت على وشك حذف حساب <strong>{userName}</strong> نهائياً. هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع بيانات المستخدم.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">سبب الحذف</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="أدخل سبب حذف الحساب (مطلوب)"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmation">
              اكتب <strong className="text-destructive">"حذف"</strong> للتأكيد
            </Label>
            <Input
              id="confirmation"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="اكتب حذف"
            />
          </div>
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!canDelete || deleteUser.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteUser.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            حذف نهائياً
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
