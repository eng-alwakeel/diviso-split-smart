import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Coins, Star, Check } from "lucide-react";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import { FoundingBadge } from "@/components/ui/founding-badge";

const Welcome = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('auth');
  const { trackEvent } = useGoogleAnalytics();
  const [userNumber, setUserNumber] = useState<number | null>(null);
  const [isFoundingUser, setIsFoundingUser] = useState(false);
  const [welcomeCredits, setWelcomeCredits] = useState(50);
  const [validityDays, setValidityDays] = useState(7);
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      
      // Fetch user profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_number, is_founding_user')
        .eq('id', session.user.id)
        .single();
      
      if (profile) {
        setUserNumber(profile.user_number);
        setIsFoundingUser(profile.is_founding_user || false);
        
        // Set credits based on founding status
        if (profile.is_founding_user) {
          setWelcomeCredits(100);
          setValidityDays(30);
        }
      }
      
      // Track welcome credits granted
      trackEvent('welcome_credits_granted', {
        user_id: session.user.id,
        credits: profile?.is_founding_user ? 100 : 50,
        is_founding_user: profile?.is_founding_user || false,
        user_number: profile?.user_number,
      });
      
      if (profile?.is_founding_user) {
        trackEvent('founding_user_granted', {
          user_id: session.user.id,
          user_number: profile.user_number,
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
          
          {/* User Number Display */}
          {userNumber && (
            <div className="flex flex-col items-center gap-2 mt-4">
              <p className="text-sm text-muted-foreground">
                {t('founding_program.you_are_user')}
              </p>
              <span className="text-3xl font-bold text-primary">#{userNumber}</span>
              {isFoundingUser && (
                <FoundingBadge userNumber={userNumber} size="lg" />
              )}
            </div>
          )}
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
            <p className="text-4xl font-bold text-primary">{welcomeCredits}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t('welcome.points_unit')}
            </p>
            <p className="text-xs text-muted-foreground mt-3 opacity-75">
              {isFoundingUser ? t('welcome.validity_founding') : t('welcome.validity')}
            </p>
          </div>
          
          {/* Founding User Benefits */}
          {isFoundingUser && (
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-orange-500/10 border border-amber-400/30 rounded-xl p-4 text-start">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                <span className="font-semibold text-sm">{t('founding_program.founding_benefits_title')}</span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>{t('founding_program.founding_monthly')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>{t('founding_program.founding_badge_permanent')} #{userNumber}</span>
                </li>
              </ul>
            </div>
          )}
          
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
