import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Check, X, Clock, TrendingUp } from 'lucide-react';
import { useAISuggestions } from '@/hooks/useAISuggestions';

export const AISuggestionsPanel = () => {
  const { suggestions, loading, acceptSuggestion, rejectSuggestion } = useAISuggestions();

  if (loading) {
    return (
      <Card className="bg-card border border-border shadow-card rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Brain className="w-5 h-5 text-primary animate-pulse" />
            جاري تحليل الاقتراحات...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-3 border rounded-lg animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'category':
        return <Brain className="w-4 h-4" />;
      case 'duplicate':
        return <Clock className="w-4 h-4" />;
      case 'budget_alert':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Brain className="w-4 h-4" />;
    }
  };

  const getSuggestionTitle = (type: string) => {
    switch (type) {
      case 'category':
        return 'اقتراح فئة';
      case 'duplicate':
        return 'مصروف مشابه';
      case 'budget_alert':
        return 'تحذير ميزانية';
      case 'saving_tip':
        return 'نصيحة توفير';
      default:
        return 'اقتراح ذكي';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 dark:text-green-400';
    if (score >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <Card className="bg-card border border-border shadow-card rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Brain className="w-5 h-5 text-primary" />
          اقتراحات ذكية ({suggestions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="p-4 border border-border rounded-lg bg-background/50 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getSuggestionIcon(suggestion.suggestion_type)}
                  <span className="font-medium text-sm">
                    {getSuggestionTitle(suggestion.suggestion_type)}
                  </span>
                  {suggestion.confidence_score && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getConfidenceColor(suggestion.confidence_score)}`}
                    >
                      {(suggestion.confidence_score * 100).toFixed(0)}%
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => acceptSuggestion(suggestion.id)}
                    className="h-6 px-2 text-xs"
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rejectSuggestion(suggestion.id)}
                    className="h-6 px-2 text-xs"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                {suggestion.suggestion_type === 'category' && (
                  <div>
                    <strong>فئة مقترحة:</strong> {suggestion.content.category_name}
                    <br />
                    <strong>السبب:</strong> {suggestion.content.reason}
                  </div>
                )}
                
                {suggestion.suggestion_type === 'duplicate' && (
                  <div>
                    <strong>مصروف مشابه:</strong> {suggestion.content.similar_description}
                    <br />
                    <strong>التاريخ:</strong> {suggestion.content.similar_date}
                  </div>
                )}
                
                {suggestion.suggestion_type === 'budget_alert' && (
                  <div>
                    <strong>تحذير:</strong> {suggestion.content.message}
                    <br />
                    <strong>الميزانية:</strong> {suggestion.content.budget_name}
                  </div>
                )}
                
                {suggestion.suggestion_type === 'saving_tip' && (
                  <div>
                    <strong>نصيحة:</strong> {suggestion.content.tip}
                  </div>
                )}
              </div>

              <div className="text-xs text-muted-foreground">
                منذ {new Date(suggestion.created_at).toLocaleDateString('ar')}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};