import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRetentionCohorts } from "@/hooks/useAdminKPIs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

export const RetentionCohorts = () => {
  const { data: cohorts, isLoading } = useRetentionCohorts(12);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-96" />
      </div>
    );
  }

  const getRetentionColor = (rate: number): string => {
    if (rate >= 30) return 'bg-emerald-500 text-white';
    if (rate >= 20) return 'bg-emerald-400 text-white';
    if (rate >= 15) return 'bg-amber-400 text-black';
    if (rate >= 10) return 'bg-amber-500 text-black';
    if (rate >= 5) return 'bg-red-400 text-white';
    return 'bg-red-500 text-white';
  };

  const getStatusBadge = (rate: number) => {
    if (rate >= 25) return <Badge className="bg-emerald-500">🟢 ممتاز</Badge>;
    if (rate >= 15) return <Badge className="bg-amber-500">🟡 جيد</Badge>;
    return <Badge className="bg-red-500">🔴 يحتاج تحسين</Badge>;
  };

  // Calculate averages
  const avgD1 = cohorts?.length 
    ? (cohorts.reduce((sum, c) => sum + (c.d1_rate || 0), 0) / cohorts.length).toFixed(1)
    : 0;
  const avgD7 = cohorts?.length 
    ? (cohorts.reduce((sum, c) => sum + (c.d7_rate || 0), 0) / cohorts.length).toFixed(1)
    : 0;
  const avgD30 = cohorts?.length 
    ? (cohorts.reduce((sum, c) => sum + (c.d30_rate || 0), 0) / cohorts.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">تحليل الاحتفاظ (Retention Cohorts)</h2>
        <p className="text-muted-foreground text-sm">هل التحسينات ترفع البقاء فعلاً؟</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">متوسط D1 Retention</p>
            <p className="text-3xl font-bold">{avgD1}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">متوسط D7 Retention</p>
            <p className="text-3xl font-bold">{avgD7}%</p>
            {getStatusBadge(parseFloat(avgD7 as string))}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">متوسط D30 Retention</p>
            <p className="text-3xl font-bold">{avgD30}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Cohort Table */}
      <Card>
        <CardHeader>
          <CardTitle>جدول Cohorts</CardTitle>
          <CardDescription>معدل الاحتفاظ لكل مجموعة تسجيل (آخر 12 أسبوع)</CardDescription>
        </CardHeader>
        <CardContent>
          {cohorts && cohorts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">تاريخ التسجيل</TableHead>
                  <TableHead className="text-center">حجم المجموعة</TableHead>
                  <TableHead className="text-center">D1</TableHead>
                  <TableHead className="text-center">D7</TableHead>
                  <TableHead className="text-center">D30</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cohorts.map((cohort, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {cohort.cohort_date 
                        ? format(parseISO(cohort.cohort_date), 'dd MMM yyyy', { locale: ar })
                        : 'غير معروف'
                      }
                    </TableCell>
                    <TableCell className="text-center">
                      {cohort.cohort_size?.toLocaleString('ar-SA') || 0}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        getRetentionColor(cohort.d1_rate || 0)
                      )}>
                        {cohort.d1_rate || 0}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        getRetentionColor(cohort.d7_rate || 0)
                      )}>
                        {cohort.d7_rate || 0}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        getRetentionColor(cohort.d30_rate || 0)
                      )}>
                        {cohort.d30_rate || 0}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>لا توجد بيانات cohorts بعد</p>
              <p className="text-sm">ستظهر البيانات بعد تجميع المزيد من المستخدمين</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-2">دليل الألوان:</p>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-emerald-500">≥30% ممتاز</Badge>
            <Badge className="bg-emerald-400">≥20% جيد جداً</Badge>
            <Badge className="bg-amber-400 text-black">≥15% جيد</Badge>
            <Badge className="bg-amber-500 text-black">≥10% متوسط</Badge>
            <Badge className="bg-red-400">≥5% ضعيف</Badge>
            <Badge className="bg-red-500">&lt;5% خطر</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
