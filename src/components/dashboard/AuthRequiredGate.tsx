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
import { Shield, UserPlus, Users, Link2 } from "lucide-react";
import type { AuthGateReason } from "@/hooks/useAuthGate";

interface AuthRequiredGateProps {
  open: boolean;
  reason: AuthGateReason;
  onDismiss: () => void;
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

export const AuthRequiredGate = memo(({ open, reason, onDismiss }: AuthRequiredGateProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');

  const Icon = REASON_ICONS[reason] || Shield;

  const reasonKey = `guest_modes.auth_reason_${reason}` as const;
  const reasonText = t(reasonKey, { defaultValue: t('guest_modes.auth_gate_title') });

  const handleCreateAccount = () => {
    onDismiss();
    navigate('/auth');
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
        <div className="flex flex-col gap-3 mt-4">
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
