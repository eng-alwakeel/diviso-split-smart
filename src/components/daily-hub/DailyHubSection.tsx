import { Skeleton } from '@/components/ui/skeleton';
import { useDailyHub } from '@/hooks/useDailyHub';
import { ActiveUserState } from './ActiveUserState';
import { LowActivityState } from './LowActivityState';
import { NewUserState } from './NewUserState';

interface DailyHubSectionProps {
  userId: string | undefined;
}

export function DailyHubSection({ userId }: DailyHubSectionProps) {
  const { hubData, userState, isLoading } = useDailyHub(userId);

  if (isLoading) {
    return <Skeleton className="h-24 w-full rounded-lg" />;
  }

  if (!hubData) {
    return <NewUserState />;
  }

  switch (userState) {
    case 'active':
      return <ActiveUserState data={hubData} />;
    case 'low_activity':
      return <LowActivityState data={hubData} />;
    case 'new':
    default:
      return <NewUserState />;
  }
}
