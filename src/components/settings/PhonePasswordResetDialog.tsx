import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Eye, EyeOff, Smartphone, Loader2, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PasswordRequirements, isPasswordValid } from "@/components/auth/PasswordRequirements";

interface PhonePasswordResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phone: string;
  maskedPhone: string;
  onSubmit: (otp: string, newPassword: string) => Promise<boolean>;
  onResend: () => Promise<boolean>;
  resendCountdown: number;
  loading?: boolean;
}

export function PhonePasswordResetDialog({
  open,
  onOpenChange,
  phone,
  maskedPhone,
  onSubmit,
  onResend,
  resendCountdown,
  loading = false
}: PhonePasswordResetDialogProps) {
  const { t } = useTranslation(['settings', 'common']);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);

  const passwordsMatch = newPassword === confirmPassword;
  const canSubmit = otp.length === 6 && isPasswordValid(newPassword) && passwordsMatch && confirmPassword.length > 0;

  const handleSubmit = async () => {
    setError("");
    
    if (otp.length !== 6) {
      setError(t('settings:security.enter_complete_otp'));
      return;
    }

    if (!passwordsMatch) {
      setError(t('settings:security.passwords_dont_match'));
      return;
    }

    if (!isPasswordValid(newPassword)) {
      setError(t('settings:security.password_requirements_not_met'));
      return;
    }

    const success = await onSubmit(otp, newPassword);
    if (success) {
      resetForm();
      onOpenChange(false);
    } else {
      setError(t('settings:security.verification_failed'));
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0) return;
    setResending(true);
    await onResend();
    setResending(false);
    setOtp("");
  };

  const resetForm = () => {
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            {t('settings:security.verify_phone')}
          </DialogTitle>
          <DialogDescription>
            {t('settings:security.otp_sent_to', { phone: maskedPhone })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* OTP Input */}
          <div className="space-y-2">
            <Label>{t('settings:security.verification_code')}</Label>
            <div className="flex justify-center" dir="ltr">
              <InputOTP value={otp} onChange={setOtp} maxLength={6}>
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

          {/* Resend Button */}
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResend}
              disabled={resendCountdown > 0 || resending}
            >
              {resending ? (
                <Loader2 className="h-4 w-4 animate-spin me-2" />
              ) : (
                <RefreshCw className="h-4 w-4 me-2" />
              )}
              {resendCountdown > 0 
                ? t('settings:security.resend_in', { seconds: resendCountdown })
                : t('settings:security.resend_code')
              }
            </Button>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t('settings:security.new_password')}</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('settings:security.enter_new_password')}
                className="pe-10"
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute end-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <PasswordRequirements password={newPassword} />

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('settings:security.confirm_password')}</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('settings:security.confirm_new_password')}
                className={`pe-10 ${confirmPassword && !passwordsMatch ? 'border-destructive' : ''}`}
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute end-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="text-xs text-destructive">{t('settings:security.passwords_dont_match')}</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            {t('common:cancel')}
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!canSubmit || loading}
            className="flex-1"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin me-2" />}
            {t('settings:security.verify_and_update')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
