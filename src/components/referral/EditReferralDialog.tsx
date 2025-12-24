import { useState } from "react";
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
import { ReferralData } from "@/hooks/useReferrals";

interface EditReferralDialogProps {
  referral: ReferralData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (referralId: string, data: { invitee_name?: string }) => Promise<{ success: boolean }>;
}

export function EditReferralDialog({ 
  referral, 
  open, 
  onOpenChange, 
  onSave 
}: EditReferralDialogProps) {
  const [name, setName] = useState(referral?.invitee_name || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!referral) return;
    
    setLoading(true);
    const result = await onSave(referral.id, { invitee_name: name.trim() || null });
    setLoading(false);
    
    if (result.success) {
      onOpenChange(false);
    }
  };

  // Reset name when referral changes
  if (referral && name !== (referral.invitee_name || "")) {
    setName(referral.invitee_name || "");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل الإحالة</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input
              id="phone"
              value={referral?.invitee_phone || ""}
              disabled
              className="text-muted-foreground"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">اسم الشخص</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسم الشخص (اختياري)"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "جاري الحفظ..." : "حفظ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
