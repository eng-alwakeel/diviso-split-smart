import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = (notification: any) => {
    if (!notification.read_at) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === 'group_invite') {
      navigate('/notifications');
    } else if (notification.type === 'referral_joined' || notification.type === 'referral_completed') {
      navigate('/referral-center');
    } else if (notification.type.includes('expense') && notification.payload.group_id) {
      navigate(`/group/${notification.payload.group_id}`);
    } else if (notification.type === 'new_message' && notification.payload.group_id) {
      navigate(`/group/${notification.payload.group_id}?tab=chat`);
    }
  };

  const getNotificationText = (notification: any) => {
    const { type, payload } = notification;
    
    switch (type) {
      case 'expense_created':
        return `${payload.creator_name} أضاف مصروف بقيمة ${payload.amount} ${payload.currency}`;
      case 'expense_approved':
        return `تم اعتماد مصروفك بقيمة ${payload.amount} ${payload.currency}`;
      case 'expense_rejected':
        return `تم رفض مصروفك بقيمة ${payload.amount} ${payload.currency}`;
      case 'new_message':
        return `${payload.sender_name}: ${payload.content.substring(0, 50)}${payload.content.length > 50 ? '...' : ''}`;
      case 'group_invite':
        return `دعوة انضمام لمجموعة "${payload.group_name}"`;
      case 'referral_joined':
      case 'referral_completed':
        return `🎉 ${payload.invitee_name} انضم عبر إحالتك! +${payload.reward_days} أيام`;
      default:
        return 'إشعار جديد';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative" aria-label="الإشعارات">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-notification-badge text-notification-badge-foreground border-0"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>الإشعارات</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-auto p-1"
            >
              تعليم الكل كمقروء
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <DropdownMenuItem disabled>
            <div className="text-center py-4 text-muted-foreground">
              لا توجد إشعارات
            </div>
          </DropdownMenuItem>
        ) : (
          <>
            {notifications.slice(0, 10).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${
                  !notification.read_at ? 'bg-primary/5' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-tight">
                      {getNotificationText(notification)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.payload.group_name}
                    </p>
                  </div>
                  {!notification.read_at && (
                    <div className="w-2 h-2 bg-primary rounded-full mt-1 mr-2 flex-shrink-0" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.created_at), {
                    addSuffix: true,
                    locale: ar,
                  })}
                </span>
              </DropdownMenuItem>
            ))}
            
            {notifications.length > 10 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-center text-primary cursor-pointer"
                  onClick={() => navigate('/notifications')}
                >
                  عرض جميع الإشعارات
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};