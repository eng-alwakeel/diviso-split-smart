import { Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface StreakDisplayProps {
  count: number;
}

export function StreakDisplay({ count }: StreakDisplayProps) {
  const { t } = useTranslation('dashboard');

  if (count <= 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 w-fit">
      <Flame className="w-5 h-5 text-orange-500" />
      <span className="text-sm font-bold text-orange-600">
        {t('daily_hub.streak', { count })}
      </span>
    </div>
  );
}
