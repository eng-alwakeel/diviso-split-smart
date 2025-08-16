import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, XCircle, TestTube } from "lucide-react";
import { useQuotaTest, QuotaTestResult } from "@/hooks/useQuotaTest";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";

export function QuotaTestPanel() {
  const { runFullQuotaTest, cleanupTestData } = useQuotaTest();
  const { currentPlan, limits } = useSubscriptionLimits();
  const [testResults, setTestResults] = useState<{
    groupTest?: QuotaTestResult;
    expenseTest?: QuotaTestResult;
  } | null>(null);
  const [testing, setTesting] = useState(false);

  const handleRunTest = async () => {
    setTesting(true);
    try {
      const results = await runFullQuotaTest();
      setTestResults(results);
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setTesting(false);
    }
  };

  const handleCleanup = async () => {
    await cleanupTestData();
    setTestResults(null);
  };

  const getResultIcon = (result?: QuotaTestResult) => {
    if (!result) return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    if (result.success) return <CheckCircle className="w-4 h-4 text-green-600" />;
    return <XCircle className="w-4 h-4 text-red-600" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          اختبار نظام حدود الاشتراك
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>الخطة الحالية: <span className="font-medium">{currentPlan}</span></p>
          {limits && (
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>المجموعات: {limits.groups === -1 ? 'غير محدود' : limits.groups}</div>
              <div>الأعضاء: {limits.members === -1 ? 'غير محدود' : limits.members}</div>
              <div>المصروفات: {limits.expenses === -1 ? 'غير محدود' : limits.expenses}</div>
              <div>الدعوات: {limits.invites === -1 ? 'غير محدود' : limits.invites}</div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Button 
            onClick={handleRunTest} 
            disabled={testing}
            className="w-full"
            variant="outline"
          >
            {testing ? 'جاري الاختبار...' : 'تشغيل اختبار شامل للحدود'}
          </Button>

          {testResults && (
            <Button 
              onClick={handleCleanup}
              variant="ghost"
              size="sm"
              className="w-full"
            >
              حذف بيانات الاختبار
            </Button>
          )}
        </div>

        {testResults && (
          <div className="space-y-3 border-t pt-4">
            <h4 className="font-medium text-sm">نتائج الاختبار:</h4>
            
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-sm">
                {getResultIcon(testResults.groupTest)}
                <div>
                  <div className="font-medium">اختبار حدود المجموعات</div>
                  <div className="text-muted-foreground text-xs">
                    {testResults.groupTest?.message}
                  </div>
                  {testResults.groupTest?.error && (
                    <div className="text-xs text-red-600 mt-1">
                      {testResults.groupTest.error}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2 text-sm">
                {getResultIcon(testResults.expenseTest)}
                <div>
                  <div className="font-medium">اختبار حدود المصروفات</div>
                  <div className="text-muted-foreground text-xs">
                    {testResults.expenseTest?.message}
                  </div>
                  {testResults.expenseTest?.error && (
                    <div className="text-xs text-red-600 mt-1">
                      {testResults.expenseTest.error}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
          <strong>ملاحظة:</strong> هذا الاختبار يحاول إنشاء بيانات تجريبية للتحقق من عمل نظام الحدود. 
          سيتم حذف البيانات التجريبية بعد الانتهاء من الاختبار.
        </div>
      </CardContent>
    </Card>
  );
}