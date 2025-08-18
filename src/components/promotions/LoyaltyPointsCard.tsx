import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Star, Gift, Trophy } from 'lucide-react';
import { useUserEngagement } from '@/hooks/useUserEngagement';

export const LoyaltyPointsCard = () => {
  const { engagement } = useUserEngagement();

  const pointsToNextLevel = (engagement.level * 500) - engagement.points;
  const progressToNextLevel = (engagement.points % 500) / 500 * 100;

  const getRecentAchievements = () => {
    return engagement.achievements
      .filter(a => a.earned)
      .sort((a, b) => new Date(b.earnedAt || '').getTime() - new Date(a.earnedAt || '').getTime())
      .slice(0, 3);
  };

  if (engagement.points === 0) return null;

  return (
    <Card className="mb-4 bg-gradient-to-br from-primary/10 via-primary/5 to-card border-primary/20 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-card-foreground">
          <Trophy className="h-4 w-4 text-primary" />
          نقاط الولاء
          <Badge variant="secondary" className="text-xs bg-primary/20 text-primary border-primary/30">
            المستوى {engagement.level}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-primary fill-primary/20" />
            <span className="text-sm font-medium text-card-foreground">{engagement.points} نقطة</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {pointsToNextLevel} نقطة للمستوى التالي
          </span>
        </div>

        <Progress value={progressToNextLevel} className="h-2 bg-primary/10" />

        {getRecentAchievements().length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium flex items-center gap-1 text-card-foreground">
              <Gift className="h-3 w-3 text-primary" />
              إنجازات حديثة
            </h4>
            <div className="flex flex-wrap gap-1">
              {getRecentAchievements().map(achievement => (
                <Badge 
                  key={achievement.id} 
                  variant="outline" 
                  className="text-xs border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                  title={achievement.description}
                >
                  {achievement.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {engagement.level >= 3 && (
          <div className="text-xs text-center p-2 bg-primary/10 text-primary rounded-lg border border-primary/20 animate-pulse">
            🎉 أنت عضو مميز! استمتع بخصم 10% على جميع الخطط
          </div>
        )}
      </CardContent>
    </Card>
  );
};