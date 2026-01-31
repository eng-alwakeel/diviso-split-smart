import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Coins } from "lucide-react";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";

const Welcome = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('auth');
  const { trackEvent } = useGoogleAnalytics();
  
  useEffect(() => {
    // Auto-redirect if user visits directly without authentication
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
      } else {
        // Track welcome credits granted
        trackEvent('welcome_credits_granted', {
          user_id: session.user.id,
          credits: 50,
        });
      }
    };
    checkAuth();
  }, [navigate, trackEvent]);
  
  const handleStart = () => {
    navigate('/create-group');
  };

  const handleTryDemo = () => {
    navigate('/launch');
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <SEO 
        title={t('welcome.title')}
        noIndex={true}
      />
      <Card className="max-w-md w-full text-center border border-border rounded-2xl">
        <CardHeader className="pb-2">
          <div className="text-6xl mb-4">🎉</div>
          <CardTitle className="text-2xl">{t('welcome.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          {/* Balance Card */}
          <div className="bg-primary/10 rounded-xl p-6 border border-primary/20">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Coins className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">
                {t('welcome.balance_label')}
              </p>
            </div>
            <p className="text-4xl font-bold text-primary">50</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t('welcome.points_unit')}
            </p>
            <p className="text-xs text-muted-foreground mt-3 opacity-75">
              {t('welcome.validity')}
            </p>
          </div>
          
          {/* Next Step Question */}
          <p className="text-muted-foreground text-sm">
            {t('welcome.next_step_question')}
          </p>
          
          {/* Two CTAs */}
          <div className="space-y-3">
            <Button onClick={handleStart} size="lg" className="w-full text-base">
              {t('welcome.cta_create_group')}
            </Button>
            <Button onClick={handleTryDemo} variant="outline" size="lg" className="w-full text-base">
              {t('welcome.cta_try_demo')}
            </Button>
            <Button onClick={handleSkip} variant="ghost" size="sm" className="w-full text-muted-foreground">
              {t('welcome.skip')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Welcome;
