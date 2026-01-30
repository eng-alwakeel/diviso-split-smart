import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BRAND_CONFIG } from '@/lib/brandConfig';
import { supabase } from '@/integrations/supabase/client';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';
import { SEO } from '@/components/SEO';
import { ExperienceCard } from '@/components/launch/ExperienceCard';
import { DemoExperience } from '@/components/launch/DemoExperience';
import { StickySignupBar } from '@/components/launch/StickySignupBar';
import { 
  DEMO_SCENARIOS, 
  getScenarioById,
  type ScenarioType 
} from '@/data/demoScenarios';

const LaunchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { trackWithUTM, trackEvent } = useGoogleAnalytics();

  // State
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [experienceCompleted, setExperienceCompleted] = useState(false);
  const [completedScenarios, setCompletedScenarios] = useState<Set<ScenarioType>>(new Set());

  // Track page view on mount
  useEffect(() => {
    const demoParam = searchParams.get('demo');
    trackWithUTM('launch_page_view', {
      page_path: '/launch',
      demo: demoParam || undefined,
    });
  }, [trackWithUTM, searchParams]);

  // Auto-open demo if ?demo= parameter exists
  useEffect(() => {
    const demoParam = searchParams.get('demo') as ScenarioType | null;
    
    if (demoParam && ['travel', 'friends', 'housing'].includes(demoParam)) {
      const scenario = getScenarioById(demoParam);
      if (scenario) {
        setSelectedScenario(demoParam);
        setShowDemo(true);
        trackEvent('experience_selected', { type: demoParam, auto_opened: true });
        trackEvent('experience_opened', { type: demoParam });
      }
    }
  }, [searchParams, trackEvent]);

  // Handle scenario selection
  const handleSelectScenario = useCallback((type: ScenarioType) => {
    setSelectedScenario(type);
    setShowDemo(true);
    trackEvent('experience_selected', { type, auto_opened: false });
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

  // Handle signup CTA
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

  // Get the selected scenario object
  const activeScenario = selectedScenario ? getScenarioById(selectedScenario) : null;

  return (
    <div 
      className="min-h-screen flex flex-col bg-background"
      dir="rtl"
    >
      <SEO 
        title="القسمة دايمًا تلخبط؟ خلّها واضحة"
        description="جرّب المثال وشوف القسمة قدامك بدون إحراج"
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
          دايم واحد يدفع أكثر؟
        </h1>

        {/* Description */}
        <p className="text-lg text-muted-foreground text-center max-w-md mb-10 leading-relaxed">
          اختر سيناريو وجرب بنفسك<br />
          وشوف كيف تنحسب القسمة بدون إحراج
        </p>

        {/* Experience Cards */}
        <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-3 gap-4">
          {DEMO_SCENARIOS.map((scenario) => (
            <ExperienceCard
              key={scenario.id}
              scenario={scenario}
              onSelect={() => handleSelectScenario(scenario.id)}
            />
          ))}
        </div>
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
