import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useQuotaHandler } from '@/hooks/useQuotaHandler';
import { useGroupNotifications } from '@/hooks/useGroupNotifications';

const InviteRoute = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { handleQuotaError } = useQuotaHandler();
  const { t } = useTranslation(['groups', 'errors']);
  const { notifyMemberJoined } = useGroupNotifications();

  useEffect(() => {
    const run = async () => {
      if (!code) {
        navigate('/');
        return;
      }

      // Ensure user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        localStorage.setItem('joinToken', code);
        navigate('/auth?redirectTo=' + encodeURIComponent(`/i/${code}`));
        return;
      }

      try {
        const { data, error } = await supabase.rpc('join_group_with_token', { p_token: code });
        if (error) throw error;
        if (data) {
          // Get group name and user name for notification
          const [groupRes, profileRes] = await Promise.all([
            supabase.from('groups').select('name').eq('id', data).single(),
            supabase.from('profiles').select('display_name, name').eq('id', user.id).single()
          ]);
          
          const groupName = groupRes.data?.name || 'مجموعة';
          const memberName = profileRes.data?.display_name || profileRes.data?.name || 'عضو جديد';
          
          // Notify other members about the new member
          console.log('🔔 Sending member_joined notification...', {
            groupId: data,
            groupName,
            userId: user.id,
            memberName
          });
          
          try {
            await notifyMemberJoined(data, groupName, user.id, memberName);
            console.log('✅ Member joined notification sent successfully');
          } catch (notifyError) {
            console.error('❌ Failed to send member joined notification:', notifyError);
          }
          
          toast({ 
            title: t('groups:messages.joined_success'), 
            description: t('groups:messages.added_to_group') 
          });
          navigate(`/group/${data}?showProfileCompletion=true`);
        } else {
          toast({ 
            variant: 'destructive', 
            title: t('groups:messages.invalid_invite_link'), 
            description: t('groups:messages.invalid_invite_link_desc') 
          });
          navigate('/dashboard');
        }
      } catch (e: any) {
        console.error('Join group error:', e);
        
        // Handle specific error cases
        if (e.code === '22023') {
          if (e.message === 'invalid_or_expired_token') {
            toast({ 
              variant: 'destructive', 
              title: t('groups:messages.invite_expired'), 
              description: t('groups:messages.invite_expired_desc') 
            });
          } else if (e.message === 'link_usage_exceeded') {
            toast({ 
              variant: 'destructive', 
              title: t('groups:messages.link_usage_exceeded'), 
              description: t('groups:messages.link_usage_exceeded_desc') 
            });
          } else {
            toast({ 
              variant: 'destructive', 
              title: t('groups:messages.invalid_invite_link'), 
              description: t('groups:messages.invalid_invite_link_desc') 
            });
          }
        } else if (!handleQuotaError(e)) {
          toast({ 
            variant: 'destructive', 
            title: t('groups:messages.join_error'), 
            description: t('groups:messages.join_error_desc') 
          });
        }
        navigate('/dashboard');
      } finally {
        // Cleanup any stored token
        localStorage.removeItem('joinToken');
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return null;
};

export default InviteRoute;
