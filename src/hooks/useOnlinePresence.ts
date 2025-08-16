import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface OnlineUser {
  user_id: string;
  last_seen: string;
}

export const useOnlinePresence = (groupId: string | null) => {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!groupId) {
      setOnlineUsers(new Set());
      return;
    }

    const roomChannel = supabase.channel(`group_${groupId}_presence`);

    roomChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = roomChannel.presenceState();
        const onlineUserIds = new Set<string>();
        
        Object.keys(newState).forEach(presenceKey => {
          const presences = newState[presenceKey];
          if (presences && presences.length > 0) {
            const userData = presences[0] as any;
            if (userData.user_id) {
              onlineUserIds.add(userData.user_id);
            }
          }
        });
        
        setOnlineUsers(onlineUserIds);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        setOnlineUsers(prev => {
          const updated = new Set(prev);
          newPresences.forEach((presence: any) => {
            if (presence.user_id) {
              updated.add(presence.user_id);
            }
          });
          return updated;
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        setOnlineUsers(prev => {
          const updated = new Set(prev);
          leftPresences.forEach((presence: any) => {
            if (presence.user_id) {
              updated.delete(presence.user_id);
            }
          });
          return updated;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Track current user presence
            await roomChannel.track({
              user_id: user.id,
              last_seen: new Date().toISOString(),
            });
          }
        }
      });

    setChannel(roomChannel);

    // Cleanup function
    return () => {
      if (roomChannel) {
        supabase.removeChannel(roomChannel);
      }
    };
  }, [groupId]);

  const isUserOnline = (userId: string): boolean => {
    return onlineUsers.has(userId);
  };

  return {
    onlineUsers: Array.from(onlineUsers),
    isUserOnline,
    onlineCount: onlineUsers.size
  };
};