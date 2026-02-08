import { useState } from "react";
import { Vote as VoteIcon, Plus, Loader2, Check, Lock, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";
import { usePlanVotes, PlanVote } from "@/hooks/usePlanVotes";
import { CreateVoteDialog } from "./CreateVoteDialog";
import { cn } from "@/lib/utils";

interface PlanVotesTabProps {
  planId: string;
  isAdmin: boolean;
  initialVoteTitle?: string;
  initialVoteOptions?: string[];
  onInitialVoteConsumed?: () => void;
}

export function PlanVotesTab({
  planId,
  isAdmin,
  initialVoteTitle,
  initialVoteOptions,
  onInitialVoteConsumed,
}: PlanVotesTabProps) {
  const { t } = useTranslation('plans');
  const {
    votes,
    isLoading,
    createVote,
    isCreating,
    castVote,
    isCasting,
    closeVote,
    isClosing,
  } = usePlanVotes(planId);

  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const openVotes = votes.filter(v => v.status === 'open');
  const closedVotes = votes.filter(v => v.status === 'closed');

  const handleCreateVote = async (title: string, options: string[], closesAt?: string) => {
    await createVote({ planId, title, options, closesAt });
    setShowCreateDialog(false);
    onInitialVoteConsumed?.();
  };

  const handleCastVote = async (voteId: string, optionId: string) => {
    await castVote({ voteId, optionId });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create Vote Button */}
      {isAdmin && (
        <div className="flex justify-center">
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="gap-2"
            variant="outline"
          >
            <Plus className="w-4 h-4" />
            {t('votes.create_btn')}
          </Button>
        </div>
      )}

      {/* Open Votes */}
      {openVotes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <VoteIcon className="w-4 h-4 text-primary" />
            {t('votes.open_votes')}
          </h3>
          {openVotes.map(vote => (
            <VoteCard
              key={vote.id}
              vote={vote}
              isAdmin={isAdmin}
              onVote={handleCastVote}
              onClose={() => closeVote(vote.id)}
              isCasting={isCasting}
              isClosing={isClosing}
            />
          ))}
        </div>
      )}

      {/* Closed Votes */}
      {closedVotes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <Lock className="w-4 h-4" />
            {t('votes.closed_votes')}
          </h3>
          {closedVotes.map(vote => (
            <VoteCard
              key={vote.id}
              vote={vote}
              isAdmin={false}
              onVote={() => {}}
              onClose={() => {}}
              isCasting={false}
              isClosing={false}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {votes.length === 0 && (
        <Card className="border border-border">
          <CardContent className="p-6 text-center text-muted-foreground">
            <VoteIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('votes.empty')}</p>
            <p className="text-xs mt-1">{t('votes.empty_desc')}</p>
          </CardContent>
        </Card>
      )}

      {/* Create Vote Dialog */}
      <CreateVoteDialog
        open={showCreateDialog || !!initialVoteTitle}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) onInitialVoteConsumed?.();
        }}
        onConfirm={handleCreateVote}
        isCreating={isCreating}
        initialTitle={initialVoteTitle}
        initialOptions={initialVoteOptions}
      />
    </div>
  );
}

// --- Vote Card ---

interface VoteCardProps {
  vote: PlanVote;
  isAdmin: boolean;
  onVote: (voteId: string, optionId: string) => void;
  onClose: () => void;
  isCasting: boolean;
  isClosing: boolean;
}

function VoteCard({ vote, isAdmin, onVote, onClose, isCasting, isClosing }: VoteCardProps) {
  const { t } = useTranslation('plans');
  const isOpen = vote.status === 'open';
  const hasVoted = !!vote.user_voted_option_id;

  return (
    <Card className="border border-border">
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium">{vote.title}</CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant={isOpen ? "default" : "secondary"}
              className="text-xs"
            >
              {isOpen ? t('votes.status_open') : t('votes.status_closed')}
            </Badge>
            {isOpen && isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={onClose}
                disabled={isClosing}
              >
                <Lock className="w-3 h-3 ltr:mr-1 rtl:ml-1" />
                {t('votes.close_btn')}
              </Button>
            )}
          </div>
        </div>
        {vote.total_votes > 0 && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            {t('votes.total_votes', { count: vote.total_votes })}
          </p>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        {vote.options.map(option => {
          const percentage = vote.total_votes > 0
            ? Math.round((option.vote_count / vote.total_votes) * 100)
            : 0;
          const isSelected = vote.user_voted_option_id === option.id;

          return (
            <button
              key={option.id}
              className={cn(
                "w-full text-start rounded-lg border p-3 transition-colors",
                isOpen && !isCasting
                  ? "hover:border-primary/50 cursor-pointer"
                  : "cursor-default",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border"
              )}
              onClick={() => isOpen && onVote(vote.id, option.id)}
              disabled={!isOpen || isCasting}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  )}
                  <span className="text-sm">{option.option_text}</span>
                </div>
                {(hasVoted || !isOpen) && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {percentage}% ({option.vote_count})
                  </span>
                )}
              </div>
              {(hasVoted || !isOpen) && (
                <Progress value={percentage} className="h-1.5" />
              )}
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
