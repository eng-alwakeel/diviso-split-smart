import React, { memo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Gift, 
  Check, 
  User, 
  Users, 
  Receipt, 
  UserPlus, 
  Share2,
  ChevronLeft,
  Coins
} from 'lucide-react';
import { useOnboarding, OnboardingTask } from '@/hooks/useOnboarding';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { OnboardingShareDialog } from '@/components/onboarding/OnboardingShareDialog';
import { useUnifiedRealtimeListener } from '@/hooks/useUnifiedRealtimeListener';

const iconMap: Record<string, React.ReactNode> = {
  User: <User className="w-4 h-4" />,
  Users: <Users className="w-4 h-4" />,
  Receipt: <Receipt className="w-4 h-4" />,
  UserPlus: <UserPlus className="w-4 h-4" />,
  Share2: <Share2 className="w-4 h-4" />
};

const TaskItem = memo(({ task, onGo }: { task: OnboardingTask; onGo: () => void }) => {
  const { t } = useTranslation('dashboard');
  const { isRTL } = useLanguage();
  
  return (
    <div className={cn(
      "flex items-center gap-3 p-2 rounded-lg transition-colors",
      task.completed ? "bg-primary/10" : "bg-muted/50 hover:bg-muted"
    )}>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
        task.completed ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"
      )}>
        {task.completed ? <Check className="w-4 h-4" /> : iconMap[task.icon]}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          task.completed && "line-through text-muted-foreground"
        )}>
          {t(task.titleKey)}
        </p>
      </div>
      
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-accent font-medium flex items-center gap-1">
          <Coins className="w-3 h-3" />
          +{task.coinsReward}
        </span>
        
        {!task.completed && task.route && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={onGo}
          >
            {t('onboarding.go_to_task')}
            <ChevronLeft className={cn("w-3 h-3", isRTL ? "mr-1" : "ml-1 rotate-180")} />
          </Button>
        )}
      </div>
    </div>
  );
});
TaskItem.displayName = 'TaskItem';

export const OnboardingProgress = memo(() => {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const {
    tasks,
    completedCount,
    totalTasks,
    progressPercent,
    allCompleted,
    rewardClaimed,
    loading,
    showShareDialog,
    setShowShareDialog,
    rewardDetails
  } = useOnboarding();

  // Get user ID for realtime subscription
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  // Use unified real-time listener (uses React Query invalidation automatically)
  useUnifiedRealtimeListener({
    userId,
    tables: ['onboarding_tasks']
  });

  const handleGoToTask = (route?: string) => {
    if (route) navigate(route);
  };

  // Hide if loading, reward claimed, or all tasks completed
  if (loading || rewardClaimed || allCompleted) {
    return (
      <OnboardingShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        rewardDetails={rewardDetails}
      />
    );
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-primary/10 via-accent/5 to-background border-primary/20 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="w-5 h-5 text-primary" />
            {t('onboarding.title')}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t('onboarding.progress', { completed: completedCount, total: totalTasks })}
              </span>
              <span className="font-medium text-primary">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Tasks List */}
          <div className="space-y-2">
            {tasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onGo={() => handleGoToTask(task.route)}
              />
            ))}
          </div>

          {/* Final reward hint */}
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Gift className="w-4 h-4 text-accent" />
              <span>{t('onboarding.final_reward')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <OnboardingShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        rewardDetails={rewardDetails}
      />
    </>
  );
});

OnboardingProgress.displayName = 'OnboardingProgress';
