import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  type: string;
  payload: Record<string, any>;
  read_at: string | null;
  created_at: string;
  archived_at: string | null;
}

export const useNotifications = (includeArchived = false) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [archivedNotifications, setArchivedNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchNotifications = async () => {
    try {
      // جلب الإشعارات النشطة
      const { data: activeData, error: activeError } = await supabase
        .from('notifications')
        .select('*')
        .is('archived_at', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (activeError) throw activeError;

      const activeNotifications = activeData as Notification[];
      setNotifications(activeNotifications);
      setUnreadCount(activeNotifications.filter(n => !n.read_at).length);

      // جلب الإشعارات المؤرشفة إذا طُلب ذلك
      if (includeArchived) {
        const { data: archivedData, error: archivedError } = await supabase
          .from('notifications')
          .select('*')
          .not('archived_at', 'is', null)
          .order('archived_at', { ascending: false })
          .limit(100);

        if (archivedError) throw archivedError;
        setArchivedNotifications(archivedData as Notification[]);
      }
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

  const archiveNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      toast({
        title: 'تم الأرشفة',
        description: 'تم أرشفة الإشعار بنجاح',
      });
    } catch (error) {
      console.error('Error archiving notification:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في أرشفة الإشعار',
        variant: 'destructive',
      });
    }
  };

  const archiveOldNotifications = async (daysOld = 30) => {
    try {
      const { data, error } = await supabase.rpc('archive_old_notifications', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_days_old: daysOld
      });

      if (error) throw error;

      await fetchNotifications();
      
      toast({
        title: 'تم الأرشفة',
        description: `تم أرشفة ${data || 0} إشعار`,
      });
      
      return data || 0;
    } catch (error) {
      console.error('Error archiving old notifications:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في أرشفة الإشعارات القديمة',
        variant: 'destructive',
      });
      return 0;
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setArchivedNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الإشعار نهائياً',
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حذف الإشعار',
        variant: 'destructive',
      });
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
    archivedNotifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    archiveOldNotifications,
    deleteNotification,
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
    case 'referral_joined':
      return 'إحالة ناجحة 🎉';
    case 'referral_completed':
      return 'إحالة ناجحة 🎉';
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
    case 'referral_joined':
    case 'referral_completed':
      return `${payload.invitee_name} انضم عبر إحالتك! حصلت على ${payload.reward_days} أيام مجانية`;
    default:
      return 'إشعار جديد';
  }
};