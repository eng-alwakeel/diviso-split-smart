import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface BalanceDetails {
  id: string;
  amount_due: number;
  currency: string;
  status: string;
  expense_description: string | null;
  expense_amount: number;
  expense_date: string;
  group_name: string;
  group_id: string;
  payer_name: string;
  payer_avatar_url: string | null;
  created_at: string;
}

export function useBalanceNotification() {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<BalanceDetails | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation('notifications');

  const getDetails = async (balanceNotificationId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_balance_notification_details', {
        p_balance_notification_id: balanceNotificationId,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setDetails(data[0] as BalanceDetails);
      }
    } catch (error) {
      console.error('Error fetching balance details:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (balanceNotificationId: string) => {
    try {
      const { data, error } = await supabase.rpc('mark_balance_as_paid', {
        p_balance_notification_id: balanceNotificationId,
      });

      if (error) throw error;

      toast({
        title: t('balance_details.paid_success'),
        description: t('balance_details.paid_success_desc'),
      });

      return true;
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast({
        title: t('toasts.error'),
        description: t('balance_details.mark_paid'),
        variant: 'destructive',
      });
      return false;
    }
  };

  /**
   * Send balance notifications after expense splits are saved.
   * For each split where member_id !== payer_id, creates a balance_notification + notification.
   */
  const sendBalanceNotifications = async (
    expense: { id: string; description: string | null; currency: string; amount: number },
    splits: Array<{ member_id: string; share_amount: number; expense_id: string }>,
    group: { id: string; name: string },
    payerId: string,
    payerName: string
  ) => {
    try {
      // Filter splits: only members who are NOT the payer
      const debtors = splits.filter(s => s.member_id !== payerId);
      if (debtors.length === 0) return;

      for (const split of debtors) {
        // 1. Insert balance_notification (ON CONFLICT DO NOTHING)
        const { data: balanceNotif, error: bnError } = await supabase
          .from('balance_notifications')
          .upsert(
            {
              user_id: split.member_id,
              group_id: group.id,
              expense_id: expense.id,
              payer_id: payerId,
              amount_due: split.share_amount,
              currency: expense.currency,
              status: 'unpaid',
            },
            { onConflict: 'user_id,expense_id', ignoreDuplicates: true }
          )
          .select('id')
          .single();

        if (bnError) {
          // If conflict (duplicate), just skip
          if (bnError.code === '23505' || bnError.message?.includes('duplicate')) {
            continue;
          }
          console.error('Error creating balance notification:', bnError);
          continue;
        }

        // 2. Insert notification
        const { data: notif, error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: split.member_id,
            type: 'balance_due',
            payload: {
              amount_due: split.share_amount,
              currency: expense.currency,
              group_name: group.name,
              group_id: group.id,
              expense_id: expense.id,
              expense_description: expense.description,
              payer_name: payerName,
              balance_notification_id: balanceNotif?.id,
            },
          })
          .select('id')
          .single();

        if (notifError) {
          console.error('Error creating notification:', notifError);
          continue;
        }

        // 3. Link notification_id back to balance_notification
        if (notif && balanceNotif) {
          await supabase
            .from('balance_notifications')
            .update({ notification_id: notif.id })
            .eq('id', balanceNotif.id);
        }
      }
    } catch (error) {
      console.error('Error sending balance notifications:', error);
    }
  };

  return {
    details,
    loading,
    getDetails,
    markAsPaid,
    sendBalanceNotifications,
  };
}
