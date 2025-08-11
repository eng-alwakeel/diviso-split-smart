import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

const InviteRoute = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

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
        navigate('/auth');
        return;
      }

      try {
        const { data, error } = await supabase.rpc('join_group_with_token', { p_token: code });
        if (error) throw error;
        if (data) {
          toast({ title: 'تم الانضمام بنجاح', description: 'تمت إضافتك إلى المجموعة.' });
          navigate(`/group/${data}`);
        } else {
          toast({ variant: 'destructive', title: 'رمز غير صالح', description: 'تعذر استخدام رابط الدعوة.' });
          navigate('/dashboard');
        }
      } catch (e) {
        toast({ variant: 'destructive', title: 'خطأ في الانضمام', description: 'تحقق من صلاحية الرابط أو أعد المحاولة.' });
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
