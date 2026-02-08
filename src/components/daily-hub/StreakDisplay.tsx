import { Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface StreakDisplayProps {
  count: number;
}

export function StreakDisplay({ count }: StreakDisplayProps) {
  const { t } = useTranslation('dashboard');

  if (count <= 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 w-fit">
      <Flame className="w-5 h-5 text-primary" />
      <span className="text-sm font-bold text-primary">
        {t('daily_hub.streak', { count })}
      </span>
    </div>
  );
}
