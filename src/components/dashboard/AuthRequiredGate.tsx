import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, UserPlus, Users, Link2, CheckCircle2 } from "lucide-react";
import type { AuthGateReason } from "@/hooks/useAuthGate";
import { trackRegistrationStarted } from "@/services/guestSession/conversionEvents";

interface AuthRequiredGateProps {
  open: boolean;
  reason: AuthGateReason;
  onDismiss: () => void;
  redirectAfterAuth?: string | null;
}

const REASON_ICONS: Record<AuthGateReason, React.ComponentType<{ className?: string }>> = {
  add_members: UserPlus,
  invite_members: UserPlus,
  share_group: Users,
  join_group: Link2,
  accept_invite: Link2,
  permanent_sync: Shield,
  collaborative_action: Users,
  general: Shield,
};

export const AuthRequiredGate = memo(({ open, reason, onDismiss, redirectAfterAuth }: AuthRequiredGateProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');

  const Icon = REASON_ICONS[reason] || Shield;

  const reasonKey = `guest_modes.auth_reason_${reason}` as const;
  const reasonText = t(reasonKey, { defaultValue: t('guest_modes.auth_gate_title') });

  const handleCreateAccount = () => {
    // Track that registration was started from this gate
    trackRegistrationStarted(reason).catch(() => {});

    onDismiss();

    // Pass redirect as query param so Auth.tsx can use it
    const redirect = redirectAfterAuth || '/dashboard';
    navigate(`/auth?mode=signup&redirectTo=${encodeURIComponent(redirect)}`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-lg">
            {t('guest_modes.auth_gate_title')}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {reasonText}
          </DialogDescription>
        </DialogHeader>

        {/* Value proposition */}
        <div className="space-y-2 my-2">
          {['gate_value_free', 'gate_value_preserve', 'gate_value_instant'].map((key) => (
            <div key={key} className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>{t(`guest_modes.${key}`)}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 mt-2">
          <Button onClick={handleCreateAccount} className="w-full">
            {t('guest_modes.auth_gate_create_account')}
          </Button>
          <Button variant="ghost" onClick={onDismiss} className="w-full">
            {t('guest_modes.auth_gate_later')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

AuthRequiredGate.displayName = 'AuthRequiredGate';
