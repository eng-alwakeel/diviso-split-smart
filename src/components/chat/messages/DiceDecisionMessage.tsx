import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Dice5, ThumbsUp, RefreshCw, Divide, Loader2, CheckCircle2, Share2, Zap, Target, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useDiceChatDecision } from '@/hooks/useDiceChatDecision';
import { useSmartDiceComment } from '@/hooks/useSmartDiceComment';
import { generateExpenseTitle } from '@/services/diceChatService';
import { useAnalyticsEvents } from '@/hooks/useAnalyticsEvents';
import { cn } from '@/lib/utils';

interface DiceDecisionMessageProps {
  decisionId: string;
  groupId: string;
}

export function DiceDecisionMessage({ decisionId, groupId }: DiceDecisionMessageProps) {
  const { t, i18n } = useTranslation(['dice', 'common']);
  const navigate = useNavigate();
  const { trackEvent } = useAnalyticsEvents();
  const isRTL = i18n.language === 'ar';

  const {
    decision,
    isLoading,
    memberCount,
    threshold,
    hasVoted,
    canReroll,
    isVoting,
    isRerolling,
    vote,
    reroll,
  } = useDiceChatDecision(decisionId, groupId);

  // Smart comment hook
  const { comment: smartComment, isLoading: isLoadingComment, generateComment } = useSmartDiceComment();

  // Generate smart comment when decision loads
  useEffect(() => {
    if (decision && decision.results.length > 0 && !smartComment) {
      const firstResult = decision.results[0];
      generateComment({
        diceType: decision.dice_type as 'activity' | 'food' | 'quick',
        resultLabel: firstResult.labelEn,
        resultLabelAr: firstResult.labelAr,
        memberCount: memberCount,
      });
    }
  }, [decision, smartComment, generateComment, memberCount]);

  if (isLoading) {
    return (
      <Card className="p-5 bg-card border-border/50 max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="flex gap-3 mb-4">
          <Skeleton className="flex-1 h-28 rounded-xl" />
          <Skeleton className="flex-1 h-28 rounded-xl" />
        </div>
        <Skeleton className="h-2 w-full mb-3" />
        <div className="flex gap-2">
          <Skeleton className="flex-1 h-10" />
          <Skeleton className="flex-1 h-10" />
        </div>
      </Card>
    );
  }

  if (!decision) {
    return null;
  }

  const isOpen = decision.status === 'open';
  const isAccepted = decision.status === 'accepted';
  const isRerolled = decision.status === 'rerolled';
  const voteCount = decision.votes?.length || 0;
  const lang = isRTL ? 'ar' : 'en';
  const progressValue = threshold > 0 ? (voteCount / threshold) * 100 : 0;

  // Determine dice type badge
  const getDiceTypeBadge = () => {
    switch (decision.dice_type) {
      case 'quick':
        return (
          <Badge variant="secondary" className="bg-accent/20 border-accent/30 text-accent-foreground">
            <Zap className="w-3 h-3 me-1" />
            {t('dice:chat.quick_badge', 'قرار سريع')}
          </Badge>
        );
      case 'activity':
        return (
          <Badge variant="secondary" className="bg-secondary border-secondary text-secondary-foreground">
            <Target className="w-3 h-3 me-1" />
            {t('dice:chat.activity_badge', 'نشاط')}
          </Badge>
        );
      case 'food':
      case 'cuisine':
        return (
          <Badge variant="secondary" className="bg-secondary border-secondary text-secondary-foreground">
            <UtensilsCrossed className="w-3 h-3 me-1" />
            {t('dice:chat.cuisine_badge', t('dice:chat.food_badge', 'أكل'))}
          </Badge>
        );
      case 'budget':
        return (
          <Badge variant="secondary" className="bg-secondary border-secondary text-secondary-foreground">
            💰 {t('dice:chat.budget_badge', 'ميزانية')}
          </Badge>
        );
      case 'whopays':
        return (
          <Badge variant="secondary" className="bg-secondary border-secondary text-secondary-foreground">
            👥 {t('dice:chat.whopays_badge', 'مين يدفع')}
          </Badge>
        );
      case 'task':
        return (
          <Badge variant="secondary" className="bg-secondary border-secondary text-secondary-foreground">
            ✅ {t('dice:chat.task_badge', 'مهمة')}
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleSplitNow = () => {
    const title = generateExpenseTitle(decision.results, lang);
    trackEvent('split_started_from_dice_chat', {
      decision_id: decisionId,
      dice_type: decision.dice_type,
    });
    navigate(`/add-expense?groupId=${groupId}&title=${encodeURIComponent(title)}`);
  };

  const handleShare = async () => {
    const resultsText = decision.results
      .map(r => `${r.emoji} ${isRTL ? r.labelAr : r.labelEn}`)
      .join(' + ');
    
    const shareText = t('dice:share.text', { emoji: '', label: resultsText });
    
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(shareText);
    }
  };

  // Render result tile
  const renderResultTile = (result: typeof decision.results[0], index: number) => {
    const isActivity = index === 0 && decision.dice_type === 'quick';
    const isFood = index === 1 || decision.dice_type === 'food';
    
    let tileLabel = '';
    let tileIcon = '';
    
    if (decision.dice_type === 'quick') {
      tileLabel = isActivity 
        ? t('dice:chat.activity_tile', 'النشاط')
        : t('dice:chat.food_tile', 'الأكل');
      tileIcon = isActivity ? '🎯' : '🍽️';
    }

    return (
      <div 
        key={index}
        className={cn(
          "flex-1 bg-muted/50 rounded-xl border border-border/50 p-4 text-center",
          decision.results.length === 1 && "max-w-[200px] mx-auto"
        )}
      >
        {decision.dice_type === 'quick' && (
          <p className="text-xs text-muted-foreground mb-2">
            {tileIcon} {tileLabel}
          </p>
        )}
        <span className="text-4xl block mb-2">{result.emoji}</span>
        <p className="font-bold text-foreground">
          {isRTL ? result.labelAr : result.labelEn}
        </p>
      </div>
    );
  };

  return (
    <Card 
      className={cn(
        "p-5 max-w-sm mx-auto transition-all border-border/50 relative",
        isAccepted && "border-primary/50 bg-primary/5",
        isRerolled && "opacity-60"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Dice5 className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">
            {t('dice:chat.group_decision', 'قرار جماعي')}
          </span>
        </div>
        {getDiceTypeBadge()}
      </div>

      {/* Status badges for accepted/rerolled */}
      {isAccepted && (
        <div className="flex items-center gap-2 mb-3 text-primary">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm font-medium">
            {t('dice:chat.decision_accepted', 'تم اعتماد القرار')}
          </span>
        </div>
      )}
      {isRerolled && (
        <div className="flex items-center gap-2 mb-3 text-muted-foreground">
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm">
            {t('dice:chat.rerolled', 'أُعيد')}
          </span>
        </div>
      )}

      {/* Results Tiles */}
      <div className={cn(
        "flex gap-3 mb-3",
        decision.results.length === 1 && "justify-center"
      )}>
        {decision.results.map((result, index) => renderResultTile(result, index))}
      </div>

      {/* Smart Comment */}
      {(smartComment || isLoadingComment) && (
        <div className="mb-4 text-center">
          {isLoadingComment ? (
            <Skeleton className="h-4 w-40 mx-auto" />
          ) : (
            <p className="text-sm text-muted-foreground italic animate-in fade-in duration-500">
              {smartComment}
            </p>
          )}
        </div>
      )}

      {/* Voting section - only show when open */}
      {isOpen && (
        <div className="mb-4">
          {/* Voter text */}
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              {t('dice:chat.voters', 'موافقون')}: 
              <span className="text-foreground font-medium mx-1">{voteCount}</span>
              {t('dice:chat.of', 'من')}
              <span className="text-foreground font-medium mx-1">{threshold}</span>
            </span>
          </div>
          
          {/* Progress bar */}
          <Progress 
            value={progressValue} 
            className="h-1.5"
          />
          
          {/* Inline status hint */}
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {t('dice:chat.vote_now', 'صوّتوا عليه الحين')}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {isOpen && (
          <>
            {/* Primary Vote Button */}
            <Button
              onClick={vote}
              disabled={isVoting}
              variant={hasVoted ? 'default' : 'outline'}
              className={cn(
                "flex-1",
                hasVoted && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {isVoting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ThumbsUp className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
                  {hasVoted 
                    ? t('dice:chat.voted', 'صوّتت ✓') 
                    : t('dice:chat.vote', 'صوّت')
                  }
                </>
              )}
            </Button>

            {/* Secondary Reroll Button */}
            {canReroll ? (
              <Button
                onClick={reroll}
                disabled={isRerolling}
                variant="ghost"
                className="flex-1 bg-muted/50 hover:bg-muted"
              >
                {isRerolling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
                    {t('dice:result.reroll', 'إعادة')}
                  </>
                )}
              </Button>
            ) : (
              <Button
                disabled
                variant="ghost"
                className="flex-1 bg-muted/30 text-muted-foreground cursor-not-allowed"
              >
                <RefreshCw className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
                {t('dice:chat.reroll_done', 'تمت الإعادة')}
              </Button>
            )}
          </>
        )}

        {isAccepted && (
          <Button
            onClick={handleSplitNow}
            variant="default"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Divide className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
            {t('dice:chat.start_split', 'ابدأ التقسيم')} ➗
          </Button>
        )}
      </div>

      {/* Share button - icon only, bottom left */}
      {!isRerolled && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleShare}
          className={cn(
            "absolute bottom-4 h-8 w-8 text-muted-foreground hover:text-foreground",
            isRTL ? "left-4" : "right-4"
          )}
        >
          <Share2 className="w-4 h-4" />
        </Button>
      )}
    </Card>
  );
}
