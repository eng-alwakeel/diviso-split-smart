import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BRAND_CONFIG } from '@/lib/brandConfig';
import { trackAnalyticsEvent } from '@/hooks/useAnalyticsEvents';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface WaitingScreenProps {
  groupId: string;
}

export const WaitingScreen: React.FC<WaitingScreenProps> = ({ groupId }) => {
  const navigate = useNavigate();
  const [inviteLink, setInviteLink] = useState('');

  // Fetch existing invite link
  useEffect(() => {
    const fetchLink = async () => {
      const { data } = await supabase
        .from('group_join_tokens')
        .select('token')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data?.token) {
        setInviteLink(`${BRAND_CONFIG.url}/i/${data.token}`);
      }
    };
    fetchLink();
  }, [groupId]);

  // Listen for new members joining
  useEffect(() => {
    const channel = supabase
      .channel(`onboarding-wait-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${groupId}`,
        },
        async () => {
          // Check if we now have >= 2 members
          const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', groupId);

          if (count && count >= 2) {
            trackAnalyticsEvent('second_member_joined', { group_id: groupId });
            trackAnalyticsEvent('onboarding_completed', { group_id: groupId });
            localStorage.removeItem('onboarding_v2_step');
            localStorage.removeItem('onboarding_v2_group_id');
            localStorage.removeItem('onboarding_v2_member_count');
            navigate('/dashboard', { replace: true });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, navigate]);

  const handleReShare = async () => {
    const message = `دفعت عنكم 200 ريال 😅\nشوفوا كم عليكم في Diviso 👇\n${inviteLink}`;
    try {
      if (navigator.share) {
        await navigator.share({ text: message });
      } else {
        await navigator.clipboard.writeText(message);
        toast.success('تم نسخ الرابط');
      }
    } catch {
      // Cancelled
    }
  };

  const handleSkip = () => {
    localStorage.removeItem('onboarding_v2_step');
    localStorage.removeItem('onboarding_v2_group_id');
    localStorage.removeItem('onboarding_v2_member_count');
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="w-full max-w-sm text-center space-y-8">
      <div className="space-y-4">
        <div className="flex justify-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-foreground leading-relaxed">
          بانتظار انضمام شخص واحد
          <br />
          عشان تبدأ القسمة الفعلية 👇
        </h2>
        <p className="text-muted-foreground">
          بمجرد ما ينضم أحد، راح ينفتح لك كل شي
        </p>
      </div>

      <Button
        size="lg"
        className="w-full text-lg h-14"
        onClick={handleReShare}
        disabled={!inviteLink}
      >
        <Share2 className="w-5 h-5 ml-2" />
        📲 شارك الرابط مرة ثانية
      </Button>

      <Button
        variant="ghost"
        className="text-muted-foreground"
        onClick={handleSkip}
      >
        تخطي والدخول للتطبيق
      </Button>
    </div>
  );
};
