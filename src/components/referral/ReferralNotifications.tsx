import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Bell, 
  Gift, 
  Users, 
  TrendingUp, 
  X,
  CheckCircle2
} from "lucide-react";

interface ReferralNotification {
  id: string;
  type: string;
  payload: any;
  created_at: string;
  read_at: string | null;
}

export function ReferralNotifications() {
  const [notifications, setNotifications] = useState<ReferralNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .in("type", [
          "referral_joined", 
          "reward_earned", 
          "tier_upgraded", 
          "referral_milestone"
        ])
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read_at: new Date().toISOString() }
            : notif
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const dismissNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ 
          read_at: new Date().toISOString(),
          archived_at: new Date().toISOString()
        })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.filter(notif => notif.id !== notificationId)
      );
    } catch (error) {
      console.error("Error dismissing notification:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'referral_joined':
        return <Users className="h-5 w-5 text-green-500" />;
      case 'reward_earned':
        return <Gift className="h-5 w-5 text-blue-500" />;
      case 'tier_upgraded':
        return <TrendingUp className="h-5 w-5 text-purple-500" />;
      case 'referral_milestone':
        return <CheckCircle2 className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationTitle = (type: string, payload: any) => {
    switch (type) {
      case 'referral_joined':
        return `${payload?.invitee_name || 'شخص ما'} انضم عبر إحالتك!`;
      case 'reward_earned':
        return `حصلت على ${payload?.days_earned || 0} أيام مجانية!`;
      case 'tier_upgraded':
        return `تم ترقيتك إلى مستوى ${payload?.new_tier || 'جديد'}!`;
      case 'referral_milestone':
        return `تهانينا! وصلت إلى ${payload?.milestone || 0} إحالة ناجحة!`;
      default:
        return 'إشعار جديد';
    }
  };

  const getNotificationMessage = (type: string, payload: any) => {
    switch (type) {
      case 'referral_joined':
        return `تم إضافة ${payload?.reward_days || 7} أيام مجانية لحسابك`;
      case 'reward_earned':
        return 'يمكنك الآن تطبيق المكافأة على اشتراكك';
      case 'tier_upgraded':
        return `الآن تحصل على ${payload?.bonus_multiplier || 1}× مضاعف المكافآت`;
      case 'referral_milestone':
        return `استمر في دعوة المزيد من الأصدقاء للحصول على مكافآت أكبر`;
      default:
        return '';
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.read_at).length;

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                  <div className="h-2 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h3 className="font-semibold">الإشعارات</h3>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => (
          <div 
            key={notification.id}
            className={`
              flex items-start gap-3 p-3 rounded-lg border transition-colors
              ${notification.read_at 
                ? 'bg-muted/30 opacity-75' 
                : 'bg-primary/5 border-primary/20'
              }
            `}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getNotificationIcon(notification.type)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm leading-5">
                {getNotificationTitle(notification.type, notification.payload)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {getNotificationMessage(notification.type, notification.payload)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(notification.created_at).toLocaleString('ar-SA')}
              </p>
            </div>

            <div className="flex items-center gap-1">
              {!notification.read_at && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAsRead(notification.id)}
                  className="h-7 w-7 p-0"
                >
                  <CheckCircle2 className="h-3 w-3" />
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissNotification(notification.id)}
                className="h-7 w-7 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {notifications.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchNotifications}
            className="w-full text-xs"
          >
            تحديث الإشعارات
          </Button>
        </div>
      )}
    </Card>
  );
}