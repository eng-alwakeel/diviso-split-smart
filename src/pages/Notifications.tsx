import { SEO } from "@/components/SEO";
import { AppHeader } from '@/components/AppHeader';
import { BottomNav } from '@/components/BottomNav';
import { useNotifications } from '@/hooks/useNotifications';
import { GroupInviteCard } from '@/components/GroupInviteCard';
import { UnifiedAdLayout } from '@/components/ads/UnifiedAdLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Archive, Trash2, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Notifications() {
  const { t } = useTranslation('common');
  const { isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState('active');
  const { 
    notifications, 
    archivedNotifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    archiveNotification,
    archiveOldNotifications,
    deleteNotification,
    loading, 
    refetch 
  } = useNotifications(activeTab === 'archived');
  const navigate = useNavigate();

  const handleNotificationClick = (notification: any) => {
    if (!notification.read_at) {
      markAsRead(notification.id);
    }

    if (notification.type === 'group_invite') {
      return;
    } else if (notification.type === 'referral_joined' || notification.type === 'referral_completed') {
      navigate('/referral-center');
    } else if (notification.type.includes('expense') && notification.payload.group_id) {
      navigate(`/group/${notification.payload.group_id}`);
    } else if (notification.type === 'new_message' && notification.payload.group_id) {
      navigate(`/group/${notification.payload.group_id}?tab=chat`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'expense_created':
        return '💰';
      case 'expense_approved':
        return '✅';
      case 'expense_rejected':
        return '❌';
      case 'new_message':
        return '💬';
      case 'group_invite':
        return '👥';
      case 'referral_joined':
      case 'referral_completed':
        return '🎉';
      default:
        return '🔔';
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
        return `${payload.sender_name}: ${payload.content}`;
      case 'group_invite':
        return `دعوة انضمام لمجموعة "${payload.group_name}"`;
      case 'referral_joined':
      case 'referral_completed':
        return `${payload.invitee_name} انضم عبر إحالتك! حصلت على ${payload.reward_days} أيام مجانية`;
      default:
        return 'إشعار جديد';
    }
  };

  const dateLocale = isRTL ? ar : enUS;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="page-container">
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-muted-foreground">{t('loading')}</p>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO title={t('notifications_page.title')} noIndex={true} />
      <AppHeader />
      
      <UnifiedAdLayout 
        placement="notifications"
        showTopBanner={true}
        showBottomBanner={false}
      >
        <main className="page-container space-y-6">
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t('notifications_page.title')}</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  {t('notifications_page.unread_count', { count: unreadCount })}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            {activeTab === 'active' && unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                {t('notifications_page.mark_all_read')}
              </Button>
            )}
            
            {activeTab === 'active' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Archive className="w-4 h-4" />
                    {t('notifications_page.archive_old')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('notifications_page.archive_dialog_title')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('notifications_page.archive_dialog_desc')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => archiveOldNotifications()}>
                      {t('notifications_page.archive_button')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="active" className="gap-2">
              <Bell className="w-4 h-4" />
              {t('notifications_page.tabs.active')} ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="archived" className="gap-2">
              <Archive className="w-4 h-4" />
              {t('notifications_page.tabs.archived')} ({archivedNotifications.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {notifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="p-4 bg-muted rounded-full mb-4">
                    <Bell className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{t('notifications_page.empty.active_title')}</h3>
                  <p className="text-muted-foreground text-center">
                    {t('notifications_page.empty.active_desc')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  notification.type === 'group_invite' ? (
                    <GroupInviteCard
                      key={notification.id}
                      notification={notification}
                      onUpdate={refetch}
                    />
                  ) : (
                    <Card
                      key={notification.id}
                      className={`transition-colors hover:bg-muted/50 ${
                        !notification.read_at ? 'bg-primary/5 border-primary/20 shadow-primary/10' : 'border-border'
                      }`}
                    >
                      <CardContent className="flex items-start gap-4 p-4">
                        <div 
                          className="text-2xl cursor-pointer flex-shrink-0"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div 
                          className="flex-1 space-y-1 cursor-pointer" 
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium leading-tight">
                              {getNotificationText(notification)}
                            </p>
                            {!notification.read_at && (
                              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0 animate-pulse shadow-primary" />
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-xs">
                              {notification.payload.group_name}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                                locale: dateLocale,
                              })}
                            </span>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => archiveNotification(notification.id)}
                              className="gap-2"
                            >
                              <Archive className="w-4 h-4" />
                              {t('notifications_page.actions.archive')}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => deleteNotification(notification.id)}
                              className="gap-2 text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                              {t('notifications_page.actions.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardContent>
                    </Card>
                  )
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="archived">
            {archivedNotifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="p-4 bg-muted rounded-full mb-4">
                    <Archive className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{t('notifications_page.empty.archived_title')}</h3>
                  <p className="text-muted-foreground text-center">
                    {t('notifications_page.empty.archived_desc')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {archivedNotifications.map((notification) => (
                  <Card key={notification.id} className="opacity-75">
                    <CardContent className="flex items-start gap-4 p-4">
                      <div className="text-2xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <p className="font-medium leading-tight">
                          {getNotificationText(notification)}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            {notification.payload.group_name}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {t('notifications_page.archived_time', { 
                              time: formatDistanceToNow(new Date(notification.archived_at!), {
                                addSuffix: true,
                                locale: dateLocale,
                              })
                            })}
                          </span>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => deleteNotification(notification.id)}
                            className="gap-2 text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                            {t('notifications_page.actions.delete_permanent')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        </main>
      </UnifiedAdLayout>

      <div className="h-32 lg:hidden" />
      <BottomNav />
    </div>
  );
}
