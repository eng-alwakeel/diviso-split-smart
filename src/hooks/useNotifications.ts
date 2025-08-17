import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  type: string;
  payload: Record<string, any>;
  read_at: string | null;
  created_at: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const typedNotifications = data as Notification[];
      setNotifications(typedNotifications);
      setUnreadCount(typedNotifications.filter(n => !n.read_at).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل الإشعارات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter(n => !n.read_at)
        .map(n => n.id);

      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n =>
          !n.read_at
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${supabase.auth.getUser().then(u => u.data.user?.id)}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show toast notification
          toast({
            title: getNotificationTitle(newNotification.type),
            description: getNotificationDescription(newNotification),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
};

const getNotificationTitle = (type: string): string => {
  switch (type) {
    case 'expense_created':
      return 'مصروف جديد';
    case 'expense_approved':
      return 'تم اعتماد المصروف';
    case 'expense_rejected':
      return 'تم رفض المصروف';
    case 'new_message':
      return 'رسالة جديدة';
    case 'group_invite':
      return 'دعوة انضمام لمجموعة';
    default:
      return 'إشعار جديد';
  }
};

const getNotificationDescription = (notification: Notification): string => {
  const { type, payload } = notification;

  switch (type) {
    case 'expense_created':
      return `${payload.creator_name} أضاف مصروف بقيمة ${payload.amount} ${payload.currency} في ${payload.group_name}`;
    case 'expense_approved':
      return `تم اعتماد مصروفك بقيمة ${payload.amount} ${payload.currency} في ${payload.group_name}`;
    case 'expense_rejected':
      return `تم رفض مصروفك بقيمة ${payload.amount} ${payload.currency} في ${payload.group_name}`;
    case 'new_message':
      return `${payload.sender_name}: ${payload.content} في ${payload.group_name}`;
    case 'group_invite':
      return `${payload.inviter_name} دعاك للانضمام إلى مجموعة "${payload.group_name}"`;
    default:
      return 'إشعار جديد';
  }
};