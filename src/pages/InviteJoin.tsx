import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent } from "@/components/ui/card";

const InviteJoin = () => {
  const { code } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!code) { navigate('/'); return; }
      if (!user) {
        // Store code and redirect to login
        sessionStorage.setItem('pending_invite_code', code);
        navigate('/auth');
        return;
      }
      // Call edge function to join by code
      const { data, error } = await supabase.functions.invoke('join_by_code', { body: { code } });
      if (error) {
        console.error('join error', error);
        navigate('/dashboard');
        return;
      }
      navigate(`/group/${data?.group_id || ''}`);
    };
    run();
  }, [code, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto px-4 py-10 max-w-lg">
        <Card>
          <CardContent className="p-6 text-center">
            <p>جاري معالجة الدعوة...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InviteJoin;
