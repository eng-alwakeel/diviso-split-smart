import { Bot, Loader2, Hotel, Car, Utensils, PartyPopper, Package, Vote, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { usePlanSuggestions, PlanSuggestion } from "@/hooks/usePlanSuggestions";

const categoryIcons: Record<string, React.ElementType> = {
  stay: Hotel,
  transport: Car,
  food: Utensils,
  activities: PartyPopper,
  other: Package,
};

const categoryColors: Record<string, string> = {
  stay: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  transport: "bg-green-500/10 text-green-600 border-green-500/20",
  food: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  activities: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  other: "bg-muted text-muted-foreground border-border",
};

interface PlanSuggestionsTabProps {
  planId: string;
  isAdmin: boolean;
  onConvertToVote: (suggestion: PlanSuggestion) => void;
}

export function PlanSuggestionsTab({ planId, isAdmin, onConvertToVote }: PlanSuggestionsTabProps) {
  const { t } = useTranslation('plans');
  const {
    summary,
    groupedSuggestions,
    isLoading,
    isGenerating,
    rateLimitSeconds,
    generate,
  } = usePlanSuggestions(planId);

  const hasSuggestions = Object.keys(groupedSuggestions).length > 0;
  const categories = ['stay', 'transport', 'activities', 'food', 'other'];

  return (
    <div className="space-y-4">
      {/* Generate Button */}
      <div className="flex justify-center">
        <Button
          onClick={() => generate()}
          disabled={isGenerating || !!rateLimitSeconds}
          className="gap-2"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Bot className="w-4 h-4" />
          )}
          {isGenerating ? t('suggestions.generating') : t('suggestions.generate_btn')}
        </Button>
      </div>

      {/* Rate Limit Warning */}
      {rateLimitSeconds && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-3 flex items-center gap-2 text-sm text-amber-600">
            <Clock className="w-4 h-4 shrink-0" />
            <span>{t('suggestions.rate_limited_desc')}</span>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* AI Summary */}
      {summary && (
        <Card className="border border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <Bot className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm leading-relaxed">{summary.intent_summary_text}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggestions by Category */}
      {hasSuggestions && categories.map(cat => {
        const items = groupedSuggestions[cat];
        if (!items || items.length === 0) return null;
        const Icon = categoryIcons[cat] || Package;
        const colorClass = categoryColors[cat] || categoryColors.other;

        return (
          <div key={cat} className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`${colorClass} text-xs`}>
                <Icon className="w-3 h-3 ltr:mr-1 rtl:ml-1" />
                {t(`suggestions.categories.${cat}`)}
              </Badge>
            </div>

            {items.map(suggestion => (
              <Card key={suggestion.id} className="border border-border">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{suggestion.title}</p>
                      {suggestion.details && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {suggestion.details}
                        </p>
                      )}
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-xs gap-1 h-7"
                        onClick={() => onConvertToVote(suggestion)}
                      >
                        <Vote className="w-3 h-3" />
                        {t('suggestions.to_vote')}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      })}

      {/* Empty State */}
      {!isLoading && !hasSuggestions && !summary && (
        <Card className="border border-border">
          <CardContent className="p-6 text-center text-muted-foreground">
            <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('suggestions.empty')}</p>
            <p className="text-xs mt-1">{t('suggestions.empty_desc')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
