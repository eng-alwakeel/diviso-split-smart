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
import { Eye, EyeOff, Check, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PasswordRequirements, isPasswordValid } from "@/components/auth/PasswordRequirements";

interface NewPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (password: string) => Promise<boolean>;
  loading?: boolean;
}

export function NewPasswordDialog({
  open,
  onOpenChange,
  onSubmit,
  loading = false
}: NewPasswordDialogProps) {
  const { t } = useTranslation(['settings', 'common']);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const passwordsMatch = newPassword === confirmPassword;
  const canSubmit = isPasswordValid(newPassword) && passwordsMatch && confirmPassword.length > 0;

  const handleSubmit = async () => {
    setError("");
    
    if (!passwordsMatch) {
      setError(t('settings:security.passwords_dont_match'));
      return;
    }

    if (!isPasswordValid(newPassword)) {
      setError(t('settings:security.password_requirements_not_met'));
      return;
    }

    const success = await onSubmit(newPassword);
    if (success) {
      setNewPassword("");
      setConfirmPassword("");
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-primary" />
            {t('settings:security.set_new_password')}
          </DialogTitle>
          <DialogDescription>
            {t('settings:security.enter_new_password_desc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
            <p className="text-sm text-destructive">{error}</p>
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
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin me-2" />
            ) : (
              <Check className="h-4 w-4 me-2" />
            )}
            {t('settings:security.update_password')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
