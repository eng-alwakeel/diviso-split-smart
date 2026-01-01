import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminUserActions } from "@/hooks/useAdminUserActions";
import { Loader2, Ban, UserCheck } from "lucide-react";
import { addDays, addMonths, format } from "date-fns";

interface BanUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  isBanned: boolean;
}

export function BanUserDialog({ open, onOpenChange, userId, userName, isBanned }: BanUserDialogProps) {
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("permanent");
  const { banUser } = useAdminUserActions();

  const handleSubmit = async () => {
    if (!isBanned && !reason.trim()) return;

    let banUntil: string | undefined;
    if (!isBanned && duration !== "permanent") {
      const now = new Date();
      switch (duration) {
        case "1day":
          banUntil = addDays(now, 1).toISOString();
          break;
        case "7days":
          banUntil = addDays(now, 7).toISOString();
          break;
        case "30days":
          banUntil = addDays(now, 30).toISOString();
          break;
        case "3months":
          banUntil = addMonths(now, 3).toISOString();
          break;
      }
    }

    await banUser.mutateAsync({
      userId,
      isBanned: !isBanned,
      reason: reason.trim() || undefined,
      banUntil
    });
    
    setReason("");
    setDuration("permanent");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isBanned ? (
              <UserCheck className="h-5 w-5 text-green-600" />
            ) : (
              <Ban className="h-5 w-5 text-orange-600" />
            )}
            {isBanned ? "إلغاء حظر المستخدم" : "حظر المستخدم"}
          </DialogTitle>
          <DialogDescription>
            {isBanned 
              ? `هل تريد إلغاء حظر ${userName}؟`
              : `حظر ${userName} من استخدام التطبيق`
            }
          </DialogDescription>
        </DialogHeader>
        
        {!isBanned && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="duration">مدة الحظر</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1day">يوم واحد</SelectItem>
                  <SelectItem value="7days">أسبوع</SelectItem>
                  <SelectItem value="30days">شهر</SelectItem>
                  <SelectItem value="3months">3 أشهر</SelectItem>
                  <SelectItem value="permanent">دائم</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">سبب الحظر</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="أدخل سبب الحظر (مطلوب)"
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={banUser.isPending || (!isBanned && !reason.trim())}
            variant={isBanned ? "default" : "destructive"}
          >
            {banUser.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            {isBanned ? "إلغاء الحظر" : "حظر المستخدم"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
