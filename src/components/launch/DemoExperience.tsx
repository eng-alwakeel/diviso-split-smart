import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Link2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DemoModeToggle, type DemoMode } from './DemoModeToggle';
import { DemoNavigation } from './DemoNavigation';
import { QuickDemoView } from './QuickDemoView';
import { FullDemoView } from './FullDemoView';
import { shareExperience } from '@/lib/share';
import { useToast } from '@/hooks/use-toast';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';
import type { DemoScenario } from '@/data/demoScenarios';

interface DemoExperienceProps {
  scenario: DemoScenario;
  onClose: () => void;
  onCompleted: (durationSeconds: number, completionMode: 'balances_view' | 'timer' | 'interaction') => void;
  onSignup: () => void;
}

export const DemoExperience: React.FC<DemoExperienceProps> = ({
  scenario,
  onClose,
  onCompleted,
  onSignup,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackEvent } = useGoogleAnalytics();
  
  const [copied, setCopied] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [demoMode, setDemoMode] = useState<DemoMode>('quick');
  
  // Track session start time for demo_abandoned event
  const startTimeRef = useRef<number>(Date.now());

  // Handle mode change
  const handleModeChange = useCallback((mode: DemoMode) => {
    setDemoMode(mode);
    setIsCompleted(false); // Reset completion when switching modes
    trackEvent('demo_mode_selected', { mode, scenario: scenario.id });
  }, [trackEvent, scenario.id]);

  // Handle quick demo completion
  const handleQuickDemoCompleted = useCallback((
    durationSeconds: number, 
    completionMode: 'balances_view' | 'timer' | 'interaction'
  ) => {
    setIsCompleted(true);
    onCompleted(durationSeconds, completionMode);
  }, [onCompleted]);

  // Handle full demo completion
  const handleFullDemoCompleted = useCallback((
    durationSeconds: number,
    membersCount: number,
    expensesCount: number
  ) => {
    setIsCompleted(true);
    trackEvent('full_demo_completed', {
      scenario: scenario.id,
      duration_seconds: durationSeconds,
      members_count: membersCount,
      expenses_count: expensesCount,
    });
    // Use 'interaction' as the completion mode for full demo
    onCompleted(durationSeconds, 'interaction');
  }, [trackEvent, scenario.id, onCompleted]);

  // Handle close with demo_abandoned tracking
  const handleClose = useCallback(() => {
    if (!isCompleted) {
      trackEvent('demo_abandoned', {
        scenario: scenario.id,
        mode: demoMode,
        duration_seconds: Math.round((Date.now() - startTimeRef.current) / 1000),
      });
    }
    onClose();
  }, [isCompleted, scenario.id, demoMode, trackEvent, onClose]);

  // Handle signup with tracking
  const handleSignupWithTracking = useCallback(() => {
    trackEvent('signup_cta_clicked', {
      scenario: scenario.id,
      mode: demoMode,
      source: 'demo_experience',
    });
    onSignup();
  }, [trackEvent, scenario.id, demoMode, onSignup]);

  // Handle navigation back to launch
  const handleBackToLaunch = useCallback(() => {
    trackEvent('back_to_launch_clicked', { from_mode: demoMode, scenario: scenario.id });
    handleClose();       // Use handleClose for proper tracking
    navigate('/launch'); // ثم التنقل للـ Hub
  }, [navigate, trackEvent, demoMode, scenario.id, handleClose]);

  // Handle navigation to features
  const handleViewFeatures = useCallback(() => {
    trackEvent('view_features_clicked', { from_mode: demoMode, scenario: scenario.id });
    navigate('/');
  }, [navigate, trackEvent, demoMode, scenario.id]);

  // Handle share
  const handleShare = async () => {
    const result = await shareExperience(scenario.id);
    
    if (result.success) {
      if (result.method === 'clipboard') {
        setCopied(true);
        toast({ title: 'تم نسخ الرسالة!' });
        setTimeout(() => setCopied(false), 2000);
      }
    } else if (result.error !== 'cancelled') {
      toast({ 
        title: 'حدث خطأ',
        description: 'لم نتمكن من مشاركة الرابط',
        variant: 'destructive'
      });
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-background overflow-y-auto"
      dir="rtl"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4 max-w-lg mx-auto">
          <button
            onClick={handleClose}
            className="p-2 hover:bg-accent rounded-full transition-colors"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
          
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <span>{scenario.icon}</span>
            <span>{scenario.groupName}</span>
          </h1>
          
          <div className="w-9" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Navigation Links */}
      <DemoNavigation
        onBackToLaunch={handleBackToLaunch}
        onViewFeatures={handleViewFeatures}
      />

      {/* Content */}
      <div className="max-w-lg mx-auto p-4 pb-32 space-y-6">
        {/* Mode Toggle */}
        <DemoModeToggle
          mode={demoMode}
          onModeChange={handleModeChange}
        />

        {/* Demo Content */}
        {demoMode === 'quick' ? (
          <QuickDemoView
            scenario={scenario}
            onCompleted={handleQuickDemoCompleted}
          />
        ) : (
          <FullDemoView
            scenarioId={scenario.id}
            currency={scenario.currency}
            onCompleted={handleFullDemoCompleted}
          />
        )}

        {/* CTA Section - Loss Aversion + Social Proof - Only shows after completion */}
        {isCompleted && (
          <section className="space-y-4 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Loss Aversion Alert */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                ⚠️ هذه القسمة مؤقتة
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                سجّل الآن مجانًا حتى لا تضيع واحصل على 50 نقطة 🎁
              </p>
            </div>
            
            {/* Social Proof - Context Aware */}
            <p className="text-xs text-center text-muted-foreground">
              {scenario.socialProofText || 'أكثر من 1,000 مستخدم حقيقي يثقون بـ Diviso'}
            </p>
            
            {/* Signup CTA */}
            <Button 
              onClick={handleSignupWithTracking}
              size="lg"
              className="w-full text-lg py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
            >
              ابدأ مجموعتك الحين
            </Button>
            
            {/* Share Button */}
            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 py-3 text-muted-foreground hover:text-primary transition-colors"
            >
              {copied ? <Check className="h-5 w-5" /> : <Link2 className="h-5 w-5" />}
              <span>🔗 شارك التجربة</span>
            </button>
          </section>
        )}
      </div>
    </div>
  );
};
