import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { showBrowserNotification, getNotificationPreference } from '@/lib/browserNotifications';

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
  const { t } = useTranslation('notifications');

  const getNotificationTitle = (type: string): string => {
    const key = `titles.${type}`;
    const translated = t(key);
    // If translation exists (not same as key), use it; otherwise use default
    return translated !== key ? translated : t('titles.default');
  };

  const getNotificationDescription = (notification: Notification): string => {
    const { type, payload } = notification;

    switch (type) {
      case 'expense_created':
        return t('descriptions.expense_created', { 
          name: payload.creator_name, 
          amount: payload.amount, 
          currency: payload.currency, 
          group: payload.group_name 
        });
      case 'expense_approved':
        return t('descriptions.expense_approved', { 
          amount: payload.amount, 
          currency: payload.currency, 
          group: payload.group_name 
        });
      case 'expense_rejected':
        return t('descriptions.expense_rejected', { 
          amount: payload.amount, 
          currency: payload.currency, 
          group: payload.group_name 
        });
      case 'new_message':
        return t('descriptions.new_message', { 
          name: payload.sender_name, 
          content: payload.content, 
          group: payload.group_name 
        });
      case 'group_invite':
        return t('descriptions.group_invite', { 
          inviter: payload.inviter_name, 
          group: payload.group_name 
        });
      case 'referral_joined':
      case 'referral_completed':
        return t('descriptions.referral_joined', { 
          name: payload.invitee_name, 
          days: payload.reward_days 
        });
      // إشعارات التسويات
      case 'settlement_received':
        return t('descriptions.settlement_received', {
          name: payload.sender_name,
          amount: payload.amount,
          currency: payload.currency,
          group: payload.group_name
        });
      case 'settlement_confirmed':
        return t('descriptions.settlement_confirmed', {
          name: payload.receiver_name,
          amount: payload.amount,
          currency: payload.currency,
          group: payload.group_name
        });
      case 'settlement_disputed':
        return t('descriptions.settlement_disputed', {
          name: payload.receiver_name,
          amount: payload.amount,
          currency: payload.currency,
          group: payload.group_name,
          reason: payload.reason
        });
      // إشعارات المجموعة
      case 'member_joined':
        return t('descriptions.member_joined', {
          name: payload.member_name,
          group: payload.group_name
        });
      case 'member_left':
        return t('descriptions.member_left', {
          name: payload.member_name,
          group: payload.group_name
        });
      case 'group_deleted':
        return t('descriptions.group_deleted', {
          name: payload.deleted_by_name,
          group: payload.group_name
        });
      case 'referral_milestone':
        return payload.message_ar || t('descriptions.referral_milestone', { 
          milestone: payload.milestone, 
          points: payload.points 
        });
      case 'referral_compensation':
        return payload.message_ar || t('descriptions.referral_compensation', { 
          points: payload.total_points 
        });
      case 'balance_due':
        return t('descriptions.balance_due', {
          amount: payload.amount_due,
          currency: payload.currency,
          group: payload.group_name
        });
      default:
        return t('descriptions.default');
    }
  };

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
        title: t('toasts.error'),
        description: t('toasts.loading_failed'),
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
      console.log('🗃️ Archiving notification:', notificationId);
      
      const { data, error } = await supabase
        .from('notifications')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', notificationId)
        .select();

      if (error) {
        console.error('❌ Archive error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error('❌ No rows updated - check RLS policies');
        throw new Error('Failed to archive - no rows affected');
      }

      console.log('✅ Archived successfully:', data);

      // نقل الإشعار للقائمة المؤرشفة
      const archivedNotif = notifications.find(n => n.id === notificationId);
      if (archivedNotif) {
        setArchivedNotifications(prev => [
          { ...archivedNotif, archived_at: new Date().toISOString() }, 
          ...prev
        ]);
      }
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      toast({
        title: t('toasts.archived'),
        description: t('toasts.archive_success'),
      });
    } catch (error: any) {
      console.error('Error archiving notification:', error);
      toast({
        title: t('toasts.error'),
        description: error.message || t('toasts.archive_failed'),
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
        title: t('toasts.archived'),
        description: t('toasts.archive_old_success', { count: data || 0 }),
      });
      
      return data || 0;
    } catch (error) {
      console.error('Error archiving old notifications:', error);
      toast({
        title: t('toasts.error'),
        description: t('toasts.archive_old_failed'),
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
        title: t('toasts.deleted'),
        description: t('toasts.delete_success'),
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: t('toasts.error'),
        description: t('toasts.delete_failed'),
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

          const title = getNotificationTitle(newNotification.type);
          const description = getNotificationDescription(newNotification);

          // Show toast notification
          toast({
            title,
            description,
          });

          // Show browser notification if enabled
          if (getNotificationPreference() && document.hidden) {
            showBrowserNotification(title, {
              body: description,
              tag: newNotification.id,
              data: newNotification.payload,
              onClick: () => {
                // Navigate to notification or group
                const groupId = newNotification.payload?.group_id;
                if (groupId) {
                  window.location.href = `/group/${groupId}`;
                } else {
                  window.location.href = '/notifications';
                }
              }
            });
          }
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
