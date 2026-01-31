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
    minLength: password.length >= 6,
  };
};

export const isPasswordValid = (password: string): boolean => {
  return password.length >= 6;
};

export const PasswordRequirements = ({ password }: PasswordRequirementsProps) => {
  const { t } = useTranslation('auth');
  const validation = validatePasswordRequirements(password);

  const requirements: PasswordRequirement[] = [
    { key: 'minLength', label: t('password_requirements.min_length'), met: validation.minLength },
  ];

  return (
    <div className="space-y-1.5 p-3 rounded-lg bg-muted/50 border border-border">
      <p className="text-xs font-medium text-muted-foreground mb-2">
        {t('password_requirements.title')}
      </p>
      {requirements.map((req) => (
        <div key={req.key} className="flex items-center gap-2 text-xs">
          {req.met ? (
            <Check className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
          ) : (
            <Circle className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className={req.met ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
            {req.label}
          </span>
        </div>
      ))}
    </div>
  );
};
