import { Check, Circle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PasswordRequirement {
  key: string;
  label: string;
  met: boolean;
}

interface PasswordRequirementsProps {
  password: string;
}

export const validatePasswordRequirements = (password: string) => {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };
};

export const isPasswordValid = (password: string): boolean => {
  const reqs = validatePasswordRequirements(password);
  return reqs.minLength && reqs.hasUppercase && reqs.hasLowercase && reqs.hasNumber;
};

export const PasswordRequirements = ({ password }: PasswordRequirementsProps) => {
  const { t } = useTranslation('auth');
  const validation = validatePasswordRequirements(password);

  const requirements: PasswordRequirement[] = [
    { key: 'minLength', label: t('password_requirements.min_length'), met: validation.minLength },
    { key: 'uppercase', label: t('password_requirements.uppercase'), met: validation.hasUppercase },
    { key: 'lowercase', label: t('password_requirements.lowercase'), met: validation.hasLowercase },
    { key: 'number', label: t('password_requirements.number'), met: validation.hasNumber },
  ];

  return (
    <div className="space-y-1.5 p-3 rounded-lg bg-muted/50 border border-border">
      <p className="text-xs font-medium text-muted-foreground mb-2">
        {t('password_requirements.title')}
      </p>
      {requirements.map((req) => (
        <div key={req.key} className="flex items-center gap-2 text-xs">
          {req.met ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Circle className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className={req.met ? 'text-green-600' : 'text-muted-foreground'}>
            {req.label}
          </span>
        </div>
      ))}
    </div>
  );
};
