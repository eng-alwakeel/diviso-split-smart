import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ActivityEvent {
  id: string;
  group_id: string;
  event_type: string;
  actor_user_id: string;
  event_data: Record<string, any>;
  smart_message_ar: string | null;
  smart_message_en: string | null;
  created_at: string;
}

async function fetchActivityFeed(groupId: string): Promise<ActivityEvent[]> {
  const { data, error } = await supabase
    .from('group_activity_feed')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('fetchActivityFeed error:', error);
    return [];
  }

  return (data ?? []) as ActivityEvent[];
}

export function useActivityFeed(groupId: string | undefined) {
  const { data, isLoading } = useQuery({
    queryKey: ['activity-feed', groupId],
    queryFn: () => fetchActivityFeed(groupId!),
    enabled: !!groupId,
    staleTime: 60 * 1000, // 1 min
    gcTime: 5 * 60 * 1000,
  });

  return {
    events: data ?? [],
    isLoading,
  };
}
