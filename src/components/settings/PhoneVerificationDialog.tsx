import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Phone, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { usePhoneVerification } from "@/hooks/usePhoneVerification";

interface PhoneVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneNumber: string;
  onSuccess: (verifiedPhone: string) => void;
  onCancel: () => void;
}

export function PhoneVerificationDialog({ 
  open, 
  onOpenChange, 
  phoneNumber, 
  onSuccess, 
  onCancel 
}: PhoneVerificationDialogProps) {
  const [otp, setOtp] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const { sendOTP, verifyOTP, loading, error } = usePhoneVerification();

  // إعداد العد التنازلي لإعادة الإرسال
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // إرسال OTP عند فتح النافذة
  useEffect(() => {
    if (open && phoneNumber) {
      handleSendOTP();
    }
  }, [open, phoneNumber]);

  const handleSendOTP = async () => {
    const success = await sendOTP(phoneNumber);
    if (success) {
      setResendCountdown(60); // دقيقة واحدة قبل السماح بالإعادة
      setOtp("");
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length === 6) {
      const success = await verifyOTP(phoneNumber, otp);
      if (success) {
        onSuccess(phoneNumber);
        setOtp("");
      }
    }
  };

  const handleCancel = () => {
    setOtp("");
    setResendCountdown(0);
    onCancel();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Phone className="w-5 h-5 text-accent" />
            تأكيد رقم الجوال
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            تم إرسال رمز التحقق إلى رقم الجوال
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">

          {/* عرض رقم الهاتف */}
          <div className="bg-muted/30 p-4 rounded-lg border border-border">
            <div className="flex items-center gap-2 justify-center">
              <Phone className="w-4 h-4 text-accent" />
              <span className="font-mono text-lg font-semibold text-foreground" dir="ltr">
                {phoneNumber}
              </span>
            </div>
          </div>

          {/* حقل إدخال OTP */}
          <div className="space-y-3">
            <Label className="text-foreground">أدخل رمز التحقق</Label>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
                onComplete={handleVerifyOTP}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          {/* رسائل الخطأ */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}

          {/* إعادة إرسال الرمز */}
          <div className="text-center">
            {resendCountdown > 0 ? (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                يمكنك إعادة الإرسال خلال {resendCountdown} ثانية
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSendOTP}
                disabled={loading}
                className="text-accent hover:text-accent/80"
              >
                إعادة إرسال الرمز
              </Button>
            )}
          </div>

          {/* أزرار التحكم */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleVerifyOTP}
              disabled={loading || otp.length !== 6}
              className="flex-1 gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              تأكيد الرقم
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            قد تستغرق الرسالة حتى دقيقتين للوصول
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}