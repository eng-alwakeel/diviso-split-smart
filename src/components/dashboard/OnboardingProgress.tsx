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
  User: <User className="w-3 h-3" />,
  Users: <Users className="w-3 h-3" />,
  Receipt: <Receipt className="w-3 h-3" />,
  UserPlus: <UserPlus className="w-3 h-3" />,
  Share2: <Share2 className="w-3 h-3" />
};

const TaskItem = memo(({ task, onGo }: { task: OnboardingTask; onGo: () => void }) => {
  const { t } = useTranslation('dashboard');
  const { isRTL } = useLanguage();
  
  return (
    <div className={cn(
      "flex items-center gap-2 p-1.5 rounded-lg transition-colors",
      task.completed ? "bg-primary/10" : "bg-muted/30 hover:bg-muted/50"
    )}>
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
        task.completed ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      )}>
        {task.completed ? <Check className="w-3 h-3" /> : iconMap[task.icon]}
      </div>
      
      <p className={cn(
        "text-xs font-medium flex-1 truncate",
        task.completed && "line-through text-muted-foreground"
      )}>
        {t(task.titleKey)}
      </p>
      
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-[10px] text-primary font-medium flex items-center gap-0.5">
          <Coins className="w-2.5 h-2.5" />
          +{task.coinsReward}
        </span>
        
        {!task.completed && task.route && (
          <Button
            size="sm"
            variant="ghost"
            className="h-5 px-1.5 text-[10px]"
            onClick={onGo}
          >
            {t('onboarding.go_to_task')}
            <ChevronLeft className={cn("w-2.5 h-2.5", isRTL ? "mr-0.5" : "ml-0.5 rotate-180")} />
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  useUnifiedRealtimeListener({
    userId,
    tables: ['onboarding_tasks']
  });

  const handleGoToTask = (route?: string) => {
    if (route) navigate(route);
  };

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
      <Card className="bg-card border-primary/20">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-primary" />
              <span>{t('onboarding.title')}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {completedCount}/{totalTasks}
            </span>
          </CardTitle>
          <Progress value={progressPercent} className="h-1 mt-2" />
        </CardHeader>
        
        <CardContent className="px-3 pb-3 space-y-1">
          {tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onGo={() => handleGoToTask(task.route)}
            />
          ))}

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground pt-1.5 border-t border-border/50">
            <Gift className="w-3 h-3 text-primary" />
            <span>{t('onboarding.final_reward')}</span>
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
