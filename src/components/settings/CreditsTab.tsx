import { memo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Coins, 
  Gift, 
  ShoppingCart, 
  Users, 
  Scan, 
  Tag, 
  UserPlus, 
  HandCoins, 
  FileText, 
  FileDown,
  Sparkles,
  Clock,
  Lightbulb
} from "lucide-react";
import { useUsageCredits, CREDIT_COSTS } from "@/hooks/useUsageCredits";
import { useDailyCheckin } from "@/hooks/useDailyCheckin";
import { useRewardPoints } from "@/hooks/useRewardPoints";
import SubscriptionCard from "./SubscriptionCard";

const CreditsTab = memo(() => {
  const { t, i18n } = useTranslation("settings");
  const navigate = useNavigate();
  const isRTL = i18n.language === "ar";
  
  const { balance, loading: creditsLoading } = useUsageCredits();
  const { checkedInToday, streak, loading: dailyLoading, claiming, claimReward } = useDailyCheckin();
  const { summary, loading: rewardLoading } = useRewardPoints();

  const operationCosts = [
    { key: "ocr_scan", icon: Scan },
    { key: "smart_category", icon: Tag },
    { key: "recommendation", icon: Lightbulb },
    { key: "create_group", icon: UserPlus },
    { key: "settlement", icon: HandCoins },
    { key: "advanced_report", icon: FileText },
    { key: "export_pdf", icon: FileDown },
  ];

  if (creditsLoading || dailyLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* رصيد النقاط الحالي */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Coins className="h-5 w-5 text-primary" />
            {isRTL ? "رصيد النقاط" : "Credits Balance"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-primary">
                {balance?.totalAvailable || 0}
              </p>
              <p className="text-sm text-muted-foreground">
                {isRTL ? "نقطة متاحة" : "credits available"}
              </p>
            </div>
            <Button onClick={() => navigate("/credit-store")} className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              {isRTL ? "شراء المزيد" : "Buy More"}
            </Button>
          </div>
          
          {balance?.expiringSoon && balance.expiringSoon > 0 && (
            <div className="rounded-lg bg-amber-500/10 p-3 text-sm">
              <p className="text-amber-600 dark:text-amber-400">
                ⚠️ {isRTL 
                  ? `${balance.expiringSoon} نقطة ستنتهي قريباً` 
                  : `${balance.expiringSoon} credits expiring soon`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* بطاقة الخطة الحالية - مدمجة */}
      <SubscriptionCard />

      {/* المكافأة اليومية */}
      <Card className={!checkedInToday ? "border-green-500/30 bg-gradient-to-br from-green-500/5 to-green-500/10" : ""}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="h-5 w-5 text-green-500" />
            {isRTL ? "المكافأة اليومية" : "Daily Reward"}
          </CardTitle>
          <CardDescription>
            {isRTL 
              ? `سلسلتك الحالية: ${streak?.currentStreak || 0} يوم` 
              : `Current streak: ${streak?.currentStreak || 0} days`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!checkedInToday ? (
            <Button 
              onClick={claimReward} 
              disabled={claiming}
              className="w-full gap-2 bg-green-600 hover:bg-green-700"
            >
              <Gift className="h-4 w-4" />
              {claiming 
                ? (isRTL ? "جاري الجمع..." : "Claiming...") 
                : (isRTL ? "اجمع مكافأتك اليومية" : "Claim Daily Reward")}
            </Button>
          ) : (
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {isRTL 
                    ? "عد غداً للاستمرار" 
                    : "Come back tomorrow"}
                </span>
              </div>
              <Badge variant="secondary">
                {isRTL ? "تم الجمع ✓" : "Claimed ✓"}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* تكاليف العمليات */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-amber-500" />
            {isRTL ? "تكاليف العمليات" : "Operation Costs"}
          </CardTitle>
          <CardDescription>
            {isRTL 
              ? "النقاط المطلوبة لكل عملية" 
              : "Credits required for each operation"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {operationCosts.map((op) => {
              const costData = CREDIT_COSTS[op.key as keyof typeof CREDIT_COSTS];
              if (!costData) return null;
              
              return (
                <div 
                  key={op.key} 
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-3"
                >
                  <div className="flex items-center gap-3">
                    <op.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {isRTL ? costData.nameAr : costData.nameEn}
                    </span>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {costData.cost} {isRTL ? "نقطة" : "pts"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* نقاط المكافآت */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Coins className="h-5 w-5 text-purple-500" />
            {isRTL ? "نقاط المكافآت" : "Reward Points"}
          </CardTitle>
          <CardDescription>
            {isRTL 
              ? "نقاط إضافية من الإحالات والنشاط" 
              : "Extra points from referrals and activity"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rewardLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-purple-500">
                {summary?.availableBalance || 0}
              </p>
              <span className="text-muted-foreground">
                {isRTL ? "نقطة" : "points"}
              </span>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate("/credit-store")}
              className="flex-1 gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              {isRTL ? "متجر النقاط" : "Credit Store"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/referral")}
              className="flex-1 gap-2"
            >
              <Users className="h-4 w-4" />
              {isRTL ? "مركز الإحالات" : "Referral Center"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

CreditsTab.displayName = "CreditsTab";

export default CreditsTab;
