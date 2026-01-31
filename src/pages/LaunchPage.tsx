import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown, Link2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BRAND_CONFIG } from '@/lib/brandConfig';
import { supabase } from '@/integrations/supabase/client';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';
import { useFoundingProgram } from '@/hooks/useFoundingProgram';
import { SEO } from '@/components/SEO';
import { ExperienceCard } from '@/components/launch/ExperienceCard';
import { DemoExperience } from '@/components/launch/DemoExperience';
import { StickySignupBar } from '@/components/launch/StickySignupBar';
import { Button } from '@/components/ui/button';
import { 
  PRIMARY_SCENARIOS,
  SECONDARY_SCENARIOS,
  getScenarioById,
  type ScenarioType 
} from '@/data/demoScenarios';

const VALID_SCENARIOS: ScenarioType[] = [
  'travel', 'friends', 'housing',
  'activities', 'desert', 'groups', 'family', 'carpool', 'events', 'friday'
];

// Campaign-specific page titles for GA4 tracking
const CAMPAIGN_TITLES: Record<ScenarioType | 'main', string> = {
  main: 'Diviso | قسّم المصاريف بذكاء',
  travel: 'Diviso | حملة السفر ✈️',
  friends: 'Diviso | حملة طلعة أصدقاء 🧑‍🤝‍🧑',
  housing: 'Diviso | حملة السكن المشترك 🏠',
  activities: 'Diviso | حملة الأنشطة 🎯',
  desert: 'Diviso | حملة رحلة البر 🏕️',
  groups: 'Diviso | حملة المجموعات 👥',
  family: 'Diviso | حملة العائلة 👨‍👩‍👧',
  carpool: 'Diviso | حملة المشوار المشترك 🚗',
  events: 'Diviso | حملة المناسبات 🎉',
  friday: 'Diviso | حملة شلة الجمعة 👬',
};

const LaunchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { trackWithUTM, trackEvent } = useGoogleAnalytics();
  const { toast } = useToast();
  const { remaining, isClosed } = useFoundingProgram();

  // State
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [experienceCompleted, setExperienceCompleted] = useState(false);
  const [completedScenarios, setCompletedScenarios] = useState<Set<ScenarioType>>(new Set());
  const [showSecondary, setShowSecondary] = useState(false);

  // Track page view and set dynamic title for GA4 campaign tracking
  useEffect(() => {
    const demoParam = searchParams.get('demo') as ScenarioType | null;
    const scenarioKey: ScenarioType | 'main' = (demoParam && VALID_SCENARIOS.includes(demoParam)) 
      ? demoParam 
      : 'main';
    
    // 1. Set dynamic page title for GA4 Pages & Screens report
    const pageTitle = CAMPAIGN_TITLES[scenarioKey];
    document.title = pageTitle;
    
    // 2. Track page view with UTM parameters
    trackWithUTM('launch_page_view', {
      page_path: '/launch',
      page_title: pageTitle,
      demo: demoParam || undefined,
    });
    
    // 3. Send campaign_page_view event for custom reporting
    trackEvent('campaign_page_view', {
      campaign_type: 'launch',
      scenario: scenarioKey,
      page_title: pageTitle,
    });
    
  }, [searchParams, trackWithUTM, trackEvent]);

  // Auto-open demo if ?demo= parameter exists
  useEffect(() => {
    const demoParam = searchParams.get('demo') as ScenarioType | null;
    
    if (demoParam && VALID_SCENARIOS.includes(demoParam)) {
      const scenario = getScenarioById(demoParam);
      if (scenario) {
        // If it's a secondary scenario, show the secondary section
        if (scenario.tier === 'secondary') {
          setShowSecondary(true);
        }
        setSelectedScenario(demoParam);
        setShowDemo(true);
        trackEvent('experience_selected', { 
          type: demoParam, 
          tier: scenario.tier,
          auto_opened: true 
        });
        trackEvent('experience_opened', { type: demoParam });
      }
    }
  }, [searchParams, trackEvent]);

  // Handle scenario selection
  const handleSelectScenario = useCallback((type: ScenarioType) => {
    const scenario = getScenarioById(type);
    const tier = scenario?.tier || 'primary';
    
    setSelectedScenario(type);
    setShowDemo(true);
    trackEvent('experience_selected', { type, tier, auto_opened: false });
    trackEvent('experience_opened', { type });
  }, [trackEvent]);

  // Handle demo close
  const handleCloseDemo = useCallback(() => {
    setShowDemo(false);
    setSelectedScenario(null);
  }, []);

  // Handle experience completed
  const handleExperienceCompleted = useCallback((durationSeconds: number, completionMode: 'balances_view' | 'timer' | 'interaction') => {
    if (selectedScenario && !completedScenarios.has(selectedScenario)) {
      setExperienceCompleted(true);
      setCompletedScenarios(prev => new Set(prev).add(selectedScenario));
      
      trackEvent('experience_completed', {
        type: selectedScenario,
        duration_seconds: durationSeconds,
        completion_mode: completionMode,
      });
    }
  }, [selectedScenario, completedScenarios, trackEvent]);

  // Handle signup CTA (from demo experience)
  const handleSignup = useCallback(async () => {
    trackEvent('signup_started', {
      source: 'launch',
      experience_type: selectedScenario || 'none',
    });
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      navigate('/create-group');
    } else {
      navigate('/auth?mode=signup&redirect=/create-group');
    }
  }, [navigate, selectedScenario, trackEvent]);

  // Handle signup click from bottom section
  const handleSignupClick = useCallback(() => {
    trackEvent('launch_signup_clicked');
    navigate('/auth?mode=signup&redirect=/launch');
  }, [navigate, trackEvent]);

  // Handle features click
  const handleFeaturesClick = useCallback(() => {
    trackEvent('launch_features_clicked');
    navigate('/');
  }, [navigate, trackEvent]);

  // Handle show more click
  const handleShowMore = useCallback(() => {
    setShowSecondary(true);
    trackEvent('show_more_clicked');
  }, [trackEvent]);

  // Handle share page
  const handleSharePage = useCallback(async () => {
    const shareUrl = `${window.location.origin}/launch`;
    const shareText = 'دايم القسمة تلخبط؟ خلّها واضحة 👇\nجرّب Diviso بدون تسجيل:';

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Diviso – القسمة بدون إحراج',
          text: shareText,
          url: shareUrl,
        });
        trackEvent('launch_share_clicked', { method: 'native' });
        return;
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return; // User cancelled
        }
        // Fall through to clipboard
      }
    }
    
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast({ title: 'تم نسخ الرابط!' });
      trackEvent('launch_share_clicked', { method: 'clipboard' });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [trackEvent, toast]);

  // Get the selected scenario object
  const activeScenario = selectedScenario ? getScenarioById(selectedScenario) : null;

  return (
    <div 
      className="min-h-screen flex flex-col bg-background"
      dir="rtl"
    >
      <SEO 
        title={(() => {
          const demoParam = searchParams.get('demo') as ScenarioType | null;
          const scenarioKey: ScenarioType | 'main' = (demoParam && VALID_SCENARIOS.includes(demoParam)) 
            ? demoParam 
            : 'main';
          return CAMPAIGN_TITLES[scenarioKey].replace('Diviso | ', '');
        })()}
        description="قسّم مصاريف السفر، الطلعات، والسكن مع أصحابك بسهولة وبدون إحراج."
        ogImage="https://diviso.app/og/launch-1200x630.png"
        noIndex={false}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <img 
          src={BRAND_CONFIG.logo} 
          alt="Diviso" 
          className="h-12 w-auto mb-10" 
        />

        {/* H1 Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4 leading-tight">
          👋 أهلًا بك في Diviso
        </h1>

        {/* Description */}
        <p className="text-lg text-muted-foreground text-center max-w-md mb-6 leading-relaxed">
          قسّم مصاريفك مع الناس اللي معك<br />
          بدون لخبطة ولا إحراج.<br />
          اختر مثال وجرب بنفسك 👇
        </p>


        {/* Primary Experience Cards */}
        <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-3 gap-4">
          {PRIMARY_SCENARIOS.map((scenario) => (
            <ExperienceCard
              key={scenario.id}
              scenario={scenario}
              variant="primary"
              onSelect={() => handleSelectScenario(scenario.id)}
            />
          ))}
        </div>

        {/* Show More Button */}
        {!showSecondary && (
          <Button
            variant="ghost"
            onClick={handleShowMore}
            className="mt-8 text-muted-foreground hover:text-primary transition-colors"
          >
            عرض المزيد من التجارب
            <ChevronDown className="h-4 w-4 mr-2" />
          </Button>
        )}

        {/* Secondary Experiences - Expandable */}
        {showSecondary && (
          <div className="w-full max-w-3xl mt-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <h2 className="text-sm font-medium text-muted-foreground mb-4 text-center">
              تجارب إضافية
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SECONDARY_SCENARIOS.map((scenario) => (
                <ExperienceCard
                  key={scenario.id}
                  scenario={scenario}
                  variant="secondary"
                  onSelect={() => handleSelectScenario(scenario.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Bottom Actions Section */}
        <section className="w-full max-w-md mt-16 text-center space-y-6">
          {/* Founding Program Banner */}
          {!isClosed && (
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-orange-500/10 border border-amber-400/30 rounded-xl p-4 text-center">
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                ⭐ انضم لبرنامج المستخدمين المؤسسين
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ⏳ متبقي {remaining} من 1000 مقعد
              </p>
            </div>
          )}
          
          {/* Guidance Text */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            خلصت التجربة؟<br />
            تقدر تسجّل، تشوف المميزات، أو تشارك الصفحة مع شلتك
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            {/* Primary: Signup */}
            <Button onClick={handleSignupClick}>
              سجّل حساب جديد
            </Button>
            
            {/* Secondary: Features */}
            <Button variant="outline" onClick={handleFeaturesClick}>
              شوف مميزات التطبيق
            </Button>
            
            {/* Ghost: Share */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSharePage}
              aria-label="مشاركة"
            >
              <Link2 className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </main>

      {/* Demo Experience Overlay */}
      {showDemo && activeScenario && (
        <DemoExperience
          scenario={activeScenario}
          onClose={handleCloseDemo}
          onCompleted={handleExperienceCompleted}
          onSignup={handleSignup}
        />
      )}

      {/* Sticky Signup Bar - shows only when demo is closed but experience was completed */}
      <StickySignupBar 
        visible={experienceCompleted && !showDemo}
        onSignup={handleSignup}
      />
    </div>
  );
};

export default LaunchPage;
