import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Phone, Users } from 'lucide-react';

const PhoneInviteRoute = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPhoneConfirm, setShowPhoneConfirm] = useState(false);

  useEffect(() => {
    const loadInviteData = async () => {
      if (!token) {
        navigate('/');
        return;
      }

      try {
        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // Store token and redirect to auth
          localStorage.setItem('phoneInviteToken', token);
          navigate('/auth?redirectTo=' + encodeURIComponent(`/invite-phone/${token}`));
          return;
        }

        // Fetch invite details
        const { data: invite, error } = await supabase
          .from('invites')
          .select(`
            *,
            groups!inner(name),
            profiles!created_by(display_name, name)
          `)
          .eq('invite_token', token)
          .eq('status', 'sent')
          .single();

        if (error || !invite) {
          toast.error('رابط الدعوة غير صالح أو منتهي الصلاحية');
          navigate('/dashboard');
          return;
        }

        setInviteData(invite);
        setPhoneNumber(invite.phone_or_email);

        // Check if user's current phone matches the invite
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', user.id)
          .single();

        if (profile?.phone === invite.phone_or_email) {
          // Phone matches, auto-accept
          await acceptInvite(invite.phone_or_email);
        } else {
          // Need phone confirmation
          setShowPhoneConfirm(true);
        }
      } catch (error) {
        console.error('Error loading invite:', error);
        toast.error('حدث خطأ في تحميل الدعوة');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadInviteData();
  }, [token, navigate]);

  const acceptInvite = async (confirmedPhone: string) => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc('accept_phone_invite', {
        p_token: token,
        p_phone: confirmedPhone
      });

      if (error) throw error;

      const result = data[0];
      if (result.success) {
        toast.success(result.message);
        navigate(`/group/${result.group_id}`);
      } else {
        toast.error(result.message);
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error accepting invite:', error);
      toast.error('حدث خطأ في قبول الدعوة');
    } finally {
      setProcessing(false);
    }
  };

  const handlePhoneConfirm = async () => {
    if (!phoneNumber.trim()) {
      toast.error('يرجى إدخال رقم الجوال');
      return;
    }

    await acceptInvite(phoneNumber);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>جارٍ تحميل الدعوة...</span>
        </div>
      </div>
    );
  }

  if (!showPhoneConfirm || !inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>جارٍ المعالجة...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Users className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">دعوة للانضمام</CardTitle>
          <CardDescription>
            تمت دعوتك للانضمام لمجموعة "{inviteData.groups?.name}"
            {inviteData.profiles && (
              <> من قبل {inviteData.profiles.display_name || inviteData.profiles.name}</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">تأكيد رقم الجوال</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="أدخل رقم الجوال"
                className="pl-10"
                dir="ltr"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              تأكد من أن رقم الجوال صحيح لربطه بحسابك واستلام الإشعارات
            </p>
          </div>

          <div className="space-y-2">
            <Button 
              onClick={handlePhoneConfirm} 
              className="w-full"
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جارٍ الانضمام...
                </>
              ) : (
                'تأكيد والانضمام للمجموعة'
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="w-full"
              disabled={processing}
            >
              إلغاء
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PhoneInviteRoute;