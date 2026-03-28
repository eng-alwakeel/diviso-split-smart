import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Receipt, UserPlus, ArrowRight, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { MainSectionType } from "@/services/homeModeEngine/uiModeConfig";

interface ModeContentSectionProps {
  sectionType: MainSectionType;
}

/**
 * Renders the main content area based on the resolved home mode.
 * For 'managed_groups' (creator_active), the parent renders existing components instead.
 */
export const ModeContentSection = memo(({ sectionType }: ModeContentSectionProps) => {
  switch (sectionType) {
    case 'onboarding':
      return <OnboardingSection />;
    case 'continue_draft':
      return <ContinueDraftSection />;
    case 'prepared_group':
      return <PreparedGroupSection />;
    case 'joined_groups':
      return <JoinedGroupsSection />;
    case 'stale_recovery':
      return <StaleRecoverySection />;
    case 'managed_groups':
      // Handled by parent — renders existing dashboard components
      return null;
    default:
      return null;
  }
});

ModeContentSection.displayName = 'ModeContentSection';

// --- Sub-sections ---

const OnboardingSection = memo(() => {
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');

  const steps = [
    { icon: Users, label: t('home_modes.onboarding_step1'), desc: t('home_modes.onboarding_step1_desc') },
    { icon: Receipt, label: t('home_modes.onboarding_step2'), desc: t('home_modes.onboarding_step2_desc') },
    { icon: UserPlus, label: t('home_modes.onboarding_step3'), desc: t('home_modes.onboarding_step3_desc') },
  ];

  return (
    <Card className="border border-border">
      <CardContent className="p-6 space-y-4">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={i} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary">{i + 1}</span>
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground text-sm">{step.label}</p>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          );
        })}
        <Button className="w-full mt-4" onClick={() => navigate('/create-group')}>
          <Users className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
          {t('home_modes.create_group_cta')}
        </Button>
      </CardContent>
    </Card>
  );
});

const ContinueDraftSection = memo(() => {
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');

  return (
    <Card className="border border-border">
      <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
          <ArrowRight className="w-6 h-6 text-warning" />
        </div>
        <p className="font-medium text-foreground">{t('home_modes.in_progress_title')}</p>
        <p className="text-sm text-muted-foreground">{t('home_modes.draft_hint')}</p>
        <Button onClick={() => navigate('/my-groups')}>
          {t('home_modes.continue_cta')}
        </Button>
      </CardContent>
    </Card>
  );
});

const PreparedGroupSection = memo(() => {
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');

  return (
    <Card className="border border-border">
      <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <UserPlus className="w-6 h-6 text-primary" />
        </div>
        <p className="font-medium text-foreground">{t('home_modes.share_ready_title')}</p>
        <p className="text-sm text-muted-foreground">{t('home_modes.share_ready_hint')}</p>
        <Button onClick={() => navigate('/my-groups')}>
          {t('home_modes.add_members_cta')}
        </Button>
      </CardContent>
    </Card>
  );
});

const JoinedGroupsSection = memo(() => {
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');

  return (
    <Card className="border border-border">
      <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
          <Users className="w-6 h-6 text-accent" />
        </div>
        <p className="font-medium text-foreground">{t('home_modes.participant_title')}</p>
        <p className="text-sm text-muted-foreground">{t('home_modes.participant_hint')}</p>
        <div className="flex gap-3 w-full">
          <Button className="flex-1" onClick={() => navigate('/create-group')}>
            {t('home_modes.create_own_group_cta')}
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => navigate('/my-groups')}>
            {t('home_modes.view_joined_groups')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

const StaleRecoverySection = memo(() => {
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');

  return (
    <Card className="border border-border">
      <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <RotateCcw className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="font-medium text-foreground">{t('home_modes.re_engagement_title')}</p>
        <p className="text-sm text-muted-foreground">{t('home_modes.re_engagement_hint')}</p>
        <Button onClick={() => navigate('/my-groups')}>
          {t('home_modes.resume_cta')}
        </Button>
      </CardContent>
    </Card>
  );
});
