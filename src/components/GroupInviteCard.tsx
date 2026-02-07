import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGroupInviteActions } from '@/hooks/useGroupInviteActions';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Users, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface GroupInviteCardProps {
  notification: {
    id: string;
    type: string;
    payload: Record<string, any>;
    read_at: string | null;
    created_at: string;
  };
  onUpdate: () => void;
}

export const GroupInviteCard = ({ notification, onUpdate }: GroupInviteCardProps) => {
  const { acceptInvite, rejectInvite, loading } = useGroupInviteActions();
  const { t } = useTranslation('groups');
  const { isRTL } = useLanguage();
  const { payload } = notification;
  const dateLocale = isRTL ? ar : enUS;

  const handleAccept = async () => {
    const result = await acceptInvite(notification.id, payload.invite_id);
    if (result.success) {
      onUpdate();
    }
  };

  const handleReject = async () => {
    const result = await rejectInvite(notification.id, payload.invite_id);
    if (result.success) {
      onUpdate();
    }
  };

  const isRead = !!notification.read_at;

  return (
    <Card
      className={`transition-colors ${
        !isRead ? 'bg-primary/5 border-primary/20' : ''
      }`}
    >
      <CardContent className="flex items-start gap-4 p-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Users className="w-5 h-5 text-primary" />
        </div>
        
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium leading-tight">
                {t('known_people.invite_notification_title')}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('known_people.invite_notification_desc', {
                  name: payload.inviter_name,
                  group: payload.group_name,
                })}
              </p>
            </div>
            {!isRead && (
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {payload.group_name}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
                locale: dateLocale,
              })}
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleAccept}
              disabled={loading}
              className="flex-1 gap-2"
              size="sm"
            >
              <Check className="w-4 h-4" />
              {t('known_people.accept_invite')}
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  disabled={loading}
                  className="flex-1 gap-2"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                  {t('known_people.decline_invite')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t('known_people.decline_confirm_title')}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('known_people.decline_confirm_desc', {
                      group: payload.group_name,
                    })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('back')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReject}>
                    {t('known_people.decline_confirm_action')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
