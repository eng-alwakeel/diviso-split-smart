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
    <Card className="mb-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-600" />
          نقاط الولاء
          <Badge variant="secondary" className="text-xs">
            المستوى {engagement.level}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">{engagement.points} نقطة</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {pointsToNextLevel} نقطة للمستوى التالي
          </span>
        </div>

        <Progress value={progressToNextLevel} className="h-2" />

        {getRecentAchievements().length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium flex items-center gap-1">
              <Gift className="h-3 w-3" />
              إنجازات حديثة
            </h4>
            <div className="flex flex-wrap gap-1">
              {getRecentAchievements().map(achievement => (
                <Badge 
                  key={achievement.id} 
                  variant="outline" 
                  className="text-xs"
                  title={achievement.description}
                >
                  {achievement.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {engagement.level >= 3 && (
          <div className="text-xs text-center p-2 bg-amber-100 rounded-lg">
            🎉 أنت عضو مميز! استمتع بخصم 10% على جميع الخطط
          </div>
        )}
      </CardContent>
    </Card>
  );
};