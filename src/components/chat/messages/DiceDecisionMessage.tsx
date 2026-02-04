import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Dice5, ThumbsUp, RefreshCw, Divide, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDiceChatDecision } from '@/hooks/useDiceChatDecision';
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

  if (isLoading) {
    return (
      <Card className="p-4 bg-muted/50 animate-pulse">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{t('common:loading')}</span>
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

  const handleSplitNow = () => {
    const title = generateExpenseTitle(decision.results, lang);
    trackEvent('split_started_from_dice_chat', {
      decision_id: decisionId,
      dice_type: decision.dice_type,
    });
    navigate(`/add-expense?groupId=${groupId}&title=${encodeURIComponent(title)}`);
  };

  return (
    <Card 
      className={cn(
        "p-4 max-w-sm mx-auto transition-all",
        isAccepted && "border-primary/50 bg-primary/5",
        isRerolled && "opacity-60"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Dice5 className="w-5 h-5 text-primary" />
          <span className="font-semibold">
            {t('dice:chat.dice_decided', '🎲 النرد قرر!')}
          </span>
        </div>
        {isAccepted && (
          <Badge variant="default" className="bg-primary text-primary-foreground">
            <CheckCircle2 className="w-3 h-3 ml-1" />
            {t('dice:chat.accepted', 'معتمد')}
          </Badge>
        )}
        {isRerolled && (
          <Badge variant="secondary">
            <RefreshCw className="w-3 h-3 ml-1" />
            {t('dice:chat.rerolled', 'أُعيد')}
          </Badge>
        )}
      </div>

      {/* Results */}
      <div className="flex flex-col items-center gap-2 py-4 bg-gradient-to-br from-muted/50 to-muted rounded-lg mb-4">
        {decision.results.map((result, index) => (
          <div key={index} className="flex items-center gap-2 text-lg">
            <span className="text-2xl">{result.emoji}</span>
            <span className="font-medium">
              {isRTL ? result.labelAr : result.labelEn}
            </span>
          </div>
        ))}
      </div>

      {/* Vote counter */}
      {isOpen && (
        <div className="text-center mb-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{voteCount}</span>
          {' / '}
          <span>{threshold}</span>
          {' '}
          {t('dice:chat.votes_needed', 'صوت مطلوب')}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {isOpen && (
          <>
            <Button
              onClick={vote}
              disabled={isVoting}
              variant={hasVoted ? 'default' : 'outline'}
              className={cn("flex-1", hasVoted && "bg-primary hover:bg-primary/90")}
            >
              {isVoting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ThumbsUp className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
                  {hasVoted 
                    ? t('dice:chat.voted', 'صوّتت ✓') 
                    : t('dice:result.accept', 'اعتماد')
                  }
                </>
              )}
            </Button>

            {canReroll && (
              <Button
                onClick={reroll}
                disabled={isRerolling}
                variant="outline"
                className="flex-1"
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
            )}
          </>
        )}

        {isAccepted && (
          <Button
            onClick={handleSplitNow}
            variant="hero"
            className="w-full"
          >
            <Divide className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
            {t('dice:chat.split_now', 'قسّم الآن')} ➗
          </Button>
        )}
      </div>

      {/* Reroll hint */}
      {isOpen && !canReroll && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          {t('dice:result.reroll_used_hint')}
        </p>
      )}
    </Card>
  );
}
