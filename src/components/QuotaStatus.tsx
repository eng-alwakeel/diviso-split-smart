import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Crown, Users, Building, Receipt, MessageSquare, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { useQuotaHandler } from "@/hooks/useQuotaHandler";

interface QuotaUsage {
  members: number;
  groups: number;
  expenses: number;
  invites: number;
  ocr: number;
}

export function QuotaStatus() {
  const { subscription } = useSubscription();
  const { getCurrentPlan, getPlanLimits, isFreePlan } = useQuotaHandler();
  const [usage, setUsage] = useState<QuotaUsage>({ members: 0, groups: 0, expenses: 0, invites: 0, ocr: 0 });
  const [loading, setLoading] = useState(true);

  const currentPlan = getCurrentPlan();
  const limits = getPlanLimits(currentPlan);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get groups count
        const { count: groupsCount } = await supabase
          .from("groups")
          .select("*", { count: "exact", head: true })
          .eq("owner_id", user.id);

        // Get monthly expenses count
        const { count: expensesCount } = await supabase
          .from("expenses")
          .select("*", { count: "exact", head: true })
          .eq("created_by", user.id)
          .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

        // Get monthly invites count
        const { count: invitesCount } = await supabase
          .from("invites")
          .select("*", { count: "exact", head: true })
          .eq("created_by", user.id)
          .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

        // Get monthly OCR count
        const { count: ocrCount } = await supabase
          .from("receipt_ocr")
          .select("*", { count: "exact", head: true })
          .eq("created_by", user.id)
          .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

        // Get max members in any group owned by user
        const { data: groups } = await supabase
          .from("groups")
          .select("id")
          .eq("owner_id", user.id);

        let maxMembers = 0;
        if (groups && groups.length > 0) {
          for (const group of groups) {
            const { count: membersCount } = await supabase
              .from("group_members")
              .select("*", { count: "exact", head: true })
              .eq("group_id", group.id);
            maxMembers = Math.max(maxMembers, membersCount || 0);
          }
        }

        setUsage({
          members: maxMembers,
          groups: groupsCount || 0,
          expenses: expensesCount || 0,
          invites: invitesCount || 0,
          ocr: ocrCount || 0,
        });
      } catch (error) {
        console.error("Error fetching usage:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, []);

  const getProgressColor = (current: number, limit: number) => {
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return "hsl(var(--destructive))";
    if (percentage >= 75) return "hsl(39, 100%, 57%)"; // warning color
    return "hsl(var(--primary))";
  };

  const getProgressMessage = (current: number, limit: number, itemType: string) => {
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return `تحذير: اقتربت من الحد الأقصى لـ${itemType}`;
    if (percentage >= 75) return `تنبيه: استخدمت 75% من حد ${itemType}`;
    return "";
  };

  const quotaItems = [
    { 
      key: "members", 
      label: "الأعضاء في المجموعة", 
      icon: Users, 
      current: usage.members, 
      limit: limits.members 
    },
    { 
      key: "groups", 
      label: "المجموعات", 
      icon: Building, 
      current: usage.groups, 
      limit: limits.groups 
    },
    { 
      key: "expenses", 
      label: "المصروفات (شهرياً)", 
      icon: Receipt, 
      current: usage.expenses, 
      limit: limits.expenses 
    },
    { 
      key: "invites", 
      label: "الدعوات (شهرياً)", 
      icon: MessageSquare, 
      current: usage.invites, 
      limit: limits.invites 
    },
    { 
      key: "ocr", 
      label: "قراءة الفواتير (شهرياً)", 
      icon: Eye, 
      current: usage.ocr, 
      limit: limits.ocr 
    },
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">جاري التحميل...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isFreePlan ? (
            <>
              <Crown className="w-5 h-5 text-muted-foreground" />
              الباقة المجانية
            </>
          ) : (
            <>
              <Crown className="w-5 h-5 text-primary" />
              باقة {currentPlan === "personal" ? "شخصية" : "عائلية"}
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {quotaItems.map((item) => {
          const percentage = Math.min((item.current / item.limit) * 100, 100);
          const Icon = item.icon;
          
          return (
            <div key={item.key} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                <span className="font-mono">
                  {item.current}/{item.limit}
                </span>
              </div>
              <Progress 
                value={percentage} 
                className="h-2"
                style={{
                  '--progress-background': getProgressColor(item.current, item.limit)
                } as React.CSSProperties}
              />
              {getProgressMessage(item.current, item.limit, item.label) && (
                <p className="text-xs text-orange-600 mt-1">
                  {getProgressMessage(item.current, item.limit, item.label)}
                </p>
              )}
            </div>
          );
        })}
        
        {isFreePlan && (
          <div className="pt-4 border-t">
            <Button 
              className="w-full" 
              onClick={() => window.location.href = '/pricing'}
            >
              ترقية الباقة
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}