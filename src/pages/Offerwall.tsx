import { useState, useEffect, useCallback } from 'react';
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Shield, CheckCircle, Loader2, ExternalLink, User } from 'lucide-react';
import { useLanguage } from "@/contexts/LanguageContext";

declare global {
  interface Window {
    PWLocal?: {
      init: (config: {
        project_key: string;
        widget: string;
        uid: string;
        onReward?: (reward: unknown) => void;
      }) => void;
    };
  }
}

const Offerwall = () => {
  const { currentLanguage } = useLanguage();
  const isRTL = currentLanguage === 'ar';
  
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [projectKey, setProjectKey] = useState<string | null>(null);
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const [widgetInitialized, setWidgetInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || null);
      }
    });
  }, []);

  // Fetch project key from Edge Function
  useEffect(() => {
    const fetchProjectKey = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('paymentwall-widget-key');
        
        if (fnError) throw fnError;
        
        if (data?.project_key) {
          setProjectKey(data.project_key);
        } else {
          throw new Error('Project key not found');
        }
      } catch (err) {
        console.error('Error fetching project key:', err);
        setError('Failed to load Paymentwall configuration');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectKey();
  }, []);

  // Load Paymentwall Widget Script
  useEffect(() => {
    if (!projectKey) return;

    const existingScript = document.querySelector('script[src*="paymentwall.com"]');
    if (existingScript) {
      setWidgetLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://api.paymentwall.com/api/pwlocal/';
    script.async = true;
    script.onload = () => setWidgetLoaded(true);
    script.onerror = () => setError('Failed to load Paymentwall widget');
    document.body.appendChild(script);

    return () => {
      // Don't remove script on cleanup as it may be needed
    };
  }, [projectKey]);

  const initWidget = useCallback(() => {
    if (!window.PWLocal || !projectKey) {
      setError('Widget not ready');
      return;
    }

    const uid = userId || `guest_${Date.now()}`;

    try {
      window.PWLocal.init({
        project_key: projectKey,
        widget: 'pw',
        uid: uid,
        onReward: (reward) => {
          console.log('Reward received:', reward);
        }
      });
      setWidgetInitialized(true);
    } catch (err) {
      console.error('Error initializing widget:', err);
      setError('Failed to initialize Paymentwall widget');
    }
  }, [projectKey, userId]);

  // Auto-initialize when widget is loaded
  useEffect(() => {
    if (widgetLoaded && projectKey && !widgetInitialized) {
      // Small delay to ensure PWLocal is fully ready
      const timer = setTimeout(initWidget, 500);
      return () => clearTimeout(timer);
    }
  }, [widgetLoaded, projectKey, widgetInitialized, initWidget]);

  return (
    <div className={`min-h-screen bg-background ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      <main className="container mx-auto px-4 py-20">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isRTL ? 'عروض Paymentwall' : 'Paymentwall Offerwall'}
          </h1>
          <p className="text-muted-foreground">
            {isRTL 
              ? 'أكمل العروض للحصول على عمليات مجانية'
              : 'Complete offers to earn free operations'
            }
          </p>
        </div>

        {/* Reviewer Information Card */}
        <Card className="mb-8 border-green-500/30 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <Shield className="h-5 w-5" />
              {isRTL ? 'معلومات للمراجعين' : 'Reviewer Information'}
            </CardTitle>
            <CardDescription>
              {isRTL 
                ? 'هذه الصفحة تعرض تكامل Paymentwall Offerwall للمراجعة'
                : 'This page demonstrates our Paymentwall Offerwall integration for review'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="text-green-600 dark:text-green-400">
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span>{isRTL ? 'المكافأة: عملية مجانية واحدة (صالحة 30 ثانية)' : 'Reward: 1 free operation (valid 30 seconds)'}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span>{isRTL ? 'الحد اليومي: 5 عمليات لكل مستخدم' : 'Daily limit: 5 operations per user'}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span>{isRTL ? 'Pingback URL مُعد ومُفعّل' : 'Pingback URL configured and active'}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span>{isRTL ? 'التحقق من التوقيع مُفعّل' : 'Signature verification enabled'}</span>
              </li>
            </ul>

            <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
              <p className="font-medium text-foreground mb-1">
                {isRTL ? 'رابط Pingback:' : 'Pingback URL:'}
              </p>
              <code className="text-xs break-all text-muted-foreground">
                https://rnuycjxlkkpovwxpxhme.supabase.co/functions/v1/paymentwall-pingback
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Offerwall Widget Container */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              {isRTL ? 'أكمل العروض للحصول على مكافآت' : 'Complete Offers for Rewards'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">
                  {isRTL ? 'جاري التحميل...' : 'Loading...'}
                </span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-destructive">
                <p className="mb-4">{error}</p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  {isRTL ? 'إعادة المحاولة' : 'Retry'}
                </Button>
              </div>
            ) : (
              <>
                <div 
                  id="paymentwall-widget" 
                  className="min-h-[400px] bg-muted/20 rounded-lg flex items-center justify-center"
                >
                  {!widgetInitialized && (
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {isRTL ? 'جاري تحميل العروض...' : 'Loading offers...'}
                      </p>
                    </div>
                  )}
                </div>
                
                {!widgetInitialized && widgetLoaded && (
                  <Button onClick={initWidget} className="mt-4 w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {isRTL ? 'تحميل العروض' : 'Load Offers'}
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* User Status Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${userId ? 'bg-green-500/10' : 'bg-muted'}`}>
                <User className={`h-5 w-5 ${userId ? 'text-green-500' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {userId 
                    ? (isRTL ? 'مسجل الدخول' : 'Logged In')
                    : (isRTL ? 'زائر (وضع العرض)' : 'Guest (Demo Mode)')
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  {userId 
                    ? (userEmail || `ID: ${userId.substring(0, 8)}...`)
                    : (isRTL ? 'سجّل الدخول للحصول على المكافآت' : 'Sign in to receive rewards')
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Details for Reviewers */}
        <Card className="mt-8 border-blue-500/30 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {isRTL ? 'التفاصيل التقنية' : 'Technical Details'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground">{isRTL ? 'نوع Widget:' : 'Widget Type:'}</p>
                <p className="font-mono">Offerwall (pw)</p>
              </div>
              <div>
                <p className="text-muted-foreground">{isRTL ? 'نوع التوقيع:' : 'Signature Type:'}</p>
                <p className="font-mono">MD5</p>
              </div>
              <div>
                <p className="text-muted-foreground">{isRTL ? 'نوع المكافأة:' : 'Reward Type:'}</p>
                <p className="font-mono">Virtual Currency (Operations)</p>
              </div>
              <div>
                <p className="text-muted-foreground">{isRTL ? 'معدل التحويل:' : 'Exchange Rate:'}</p>
                <p className="font-mono">1 credit = 1 operation</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Offerwall;
