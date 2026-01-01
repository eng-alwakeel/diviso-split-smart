import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminUserActions } from "@/hooks/useAdminUserActions";
import { Loader2 } from "lucide-react";

interface User {
  id: string;
  display_name: string | null;
  name: string | null;
  phone: string | null;
}

interface EditUserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
}

export function EditUserProfileDialog({ open, onOpenChange, user }: EditUserProfileDialogProps) {
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const { updateUserProfile } = useAdminUserActions();

  useEffect(() => {
    if (open) {
      setDisplayName(user.display_name || user.name || "");
      setPhone(user.phone || "");
    }
  }, [open, user]);

  const handleSave = async () => {
    await updateUserProfile.mutateAsync({
      userId: user.id,
      displayName: displayName || undefined,
      phone: phone || undefined
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تعديل بيانات المستخدم</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">الاسم</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="أدخل الاسم"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="أدخل رقم الهاتف"
              dir="ltr"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={updateUserProfile.isPending}>
            {updateUserProfile.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            حفظ التغييرات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
