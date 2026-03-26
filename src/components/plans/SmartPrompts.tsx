import { useTranslation } from "react-i18next";
import { Lightbulb } from "lucide-react";

interface SmartPromptsProps {
  status: string;
  hasActivities: boolean;
  hasDates: boolean;
  hasGroupId: boolean;
}

export function SmartPrompts({ status, hasActivities, hasDates, hasGroupId }: SmartPromptsProps) {
  const { t } = useTranslation('plans');

  if (hasGroupId || status === 'done' || status === 'canceled') return null;

  let message: string | null = null;

  if (status === 'planning' && !hasActivities) {
    message = t('prompts.add_activities');
  } else if (status === 'planning' && hasActivities && !hasDates) {
    message = t('prompts.add_dates');
  } else if (status === 'planning' && hasActivities && hasDates) {
    message = t('prompts.ready_to_convert');
  }

  if (!message) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-xs">
      <Lightbulb className="w-4 h-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
