import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGroupInviteActions } from '@/hooks/useGroupInviteActions';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Users, Check, X } from 'lucide-react';
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
  const { payload } = notification;

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
                دعوة انضمام لمجموعة
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {payload.inviter_name} دعاك للانضمام إلى مجموعة "{payload.group_name}"
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
              <Badge variant="outline" className="text-xs">
                {payload.invited_role === 'admin' ? 'مدير' : 'عضو'}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
                locale: ar,
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
              قبول الدعوة
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
                  رفض
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>رفض دعوة الانضمام؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    هل أنت متأكد من رفض دعوة الانضمام لمجموعة "{payload.group_name}"؟ لن تتمكن من التراجع عن هذا القرار.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReject}>
                    رفض الدعوة
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