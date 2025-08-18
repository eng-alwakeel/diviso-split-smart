import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useQuotaHandler } from '@/hooks/useQuotaHandler';

const InviteRoute = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { handleQuotaError } = useQuotaHandler();

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
          toast({ title: 'تم الانضمام بنجاح', description: 'تمت إضافتك إلى المجموعة.' });
          navigate(`/group/${data}`);
        } else {
          toast({ 
            variant: 'destructive', 
            title: 'رابط دعوة غير صالح', 
            description: 'هذا الرابط غير صحيح أو منتهي الصلاحية. تأكد من أنه رابط دعوة مجموعة وليس رابط إحالة.' 
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
              title: 'رابط الدعوة منتهي الصلاحية', 
              description: 'هذا الرابط انتهت صلاحيته أو غير صحيح. اطلب رابط جديد من مدير المجموعة.' 
            });
          } else if (e.message === 'link_usage_exceeded') {
            toast({ 
              variant: 'destructive', 
              title: 'تم استنفاد عدد المستخدمين المسموح', 
              description: 'وصل هذا الرابط للحد الأقصى من المستخدمين. اطلب رابط جديد من مدير المجموعة.' 
            });
          } else {
            toast({ 
              variant: 'destructive', 
              title: 'رابط دعوة غير صالح', 
              description: 'هذا الرابط غير صحيح أو منتهي الصلاحية. تأكد من أنه رابط دعوة مجموعة وليس رابط إحالة.' 
            });
          }
        } else if (!handleQuotaError(e)) {
          toast({ 
            variant: 'destructive', 
            title: 'خطأ في الانضمام للمجموعة', 
            description: 'تحقق من صلاحية رابط الدعوة. إذا كان لديك رابط إحالة (/join/...)، فهو مخصص للأشخاص الجدد فقط.' 
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