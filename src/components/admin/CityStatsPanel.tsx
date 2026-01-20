import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Building2, TrendingUp } from 'lucide-react';
import type { CityStats } from '@/hooks/useUsersByCity';
import { Skeleton } from '@/components/ui/skeleton';

interface CityStatsPanelProps {
  data: CityStats[];
  isLoading?: boolean;
  maxCities?: number;
}

export const CityStatsPanel = ({ data, isLoading, maxCities = 10 }: CityStatsPanelProps) => {
  const totalUsers = data.reduce((sum, d) => sum + d.user_count, 0);
  const maxCount = Math.max(...data.map(d => d.user_count), 1);
  const displayData = data.slice(0, maxCities);
  
  if (isLoading) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            أكثر المدن نشاطاً
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 bg-white/10" />
          ))}
        </CardContent>
      </Card>
    );
  }
  
  if (data.length === 0) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            أكثر المدن نشاطاً
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-white/60">
            <Building2 className="w-12 h-12 mx-auto mb-2 opacity-40" />
            <p>لا توجد بيانات مدن متاحة</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          أكثر المدن نشاطاً
          <span className="text-sm font-normal text-white/60">
            (إجمالي: {totalUsers.toLocaleString('ar-SA')})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayData.map((city, index) => {
          const percentage = (city.user_count / totalUsers) * 100;
          const progressValue = (city.user_count / maxCount) * 100;
          
          return (
            <div key={city.city} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                  <span className="text-white font-medium">{city.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/80 font-bold">
                    {city.user_count.toLocaleString('ar-SA')}
                  </span>
                  <span className="text-xs text-white/50">
                    ({percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
              <Progress 
                value={progressValue} 
                className="h-2 bg-white/10"
              />
            </div>
          );
        })}
        
        {data.length > maxCities && (
          <div className="pt-2 text-center text-sm text-white/50">
            +{(data.length - maxCities).toLocaleString('ar-SA')} مدينة أخرى
          </div>
        )}
      </CardContent>
    </Card>
  );
};
