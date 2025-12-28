import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Crown, Users, Building, Receipt, MessageSquare, Eye, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { useTranslation } from "react-i18next";

interface QuotaUsage {
  members: number;
  groups: number;
  expenses: number;
  invites: number;
  ocr: number;
}

export function QuotaStatus() {
  const { t } = useTranslation('quota');
  const { 
    limits, 
    loading: limitsLoading, 
    currentPlan, 
    isFreePlan, 
    formatLimit, 
    getUsagePercentage, 
    isNearLimit, 
    isAtLimit,
    isUnlimited 
  } = useSubscriptionLimits();
  const [usage, setUsage] = useState<QuotaUsage>({ members: 0, groups: 0, expenses: 0, invites: 0, ocr: 0 });
  const [usageLoading, setUsageLoading] = useState(true);

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
        setUsageLoading(false);
      }
    };

    fetchUsage();
  }, []);

  const getProgressColor = (current: number, limit: number) => {
    if (isUnlimited(limit)) return "hsl(var(--primary))";
    const percentage = getUsagePercentage(current, limit);
    if (percentage >= 90) return "hsl(var(--destructive))";
    if (percentage >= 75) return "hsl(39, 100%, 57%)"; // warning color
    return "hsl(var(--primary))";
  };

  const getProgressMessage = (current: number, limit: number, itemKey: string) => {
    if (isUnlimited(limit)) return "";
    const itemName = t(`items.${itemKey}`, itemKey);
    const percentage = getUsagePercentage(current, limit);
    
    if (isAtLimit(current, limit)) return t('warnings.reached_limit', { item: itemName });
    if (isNearLimit(current, limit, 90)) return t('warnings.near_limit', { item: itemName, percentage: Math.round(percentage) });
    if (isNearLimit(current, limit, 75)) return t('warnings.approaching_limit', { item: itemName });
    return "";
  };

  const quotaItems = limits ? [
    { 
      key: "members", 
      label: t('items.members'), 
      icon: Users, 
      current: usage.members, 
      limit: limits.members 
    },
    { 
      key: "groups", 
      label: t('items.groups'), 
      icon: Building, 
      current: usage.groups, 
      limit: limits.groups 
    },
    { 
      key: "expenses", 
      label: t('items.expenses'), 
      icon: Receipt, 
      current: usage.expenses, 
      limit: limits.expenses 
    },
    { 
      key: "invites", 
      label: t('items.invites'), 
      icon: MessageSquare, 
      current: usage.invites, 
      limit: limits.invites 
    },
    { 
      key: "ocr", 
      label: t('items.ocr'), 
      icon: Eye, 
      current: usage.ocr, 
      limit: limits.ocr 
    },
  ] : [];

  if (limitsLoading || usageLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">{t('status.loading')}</div>
        </CardContent>
      </Card>
    );
  }

  if (!limits) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">{t('status.error_loading')}</div>
        </CardContent>
      </Card>
    );
  }

  const getPlanLabel = () => {
    if (isFreePlan) return t('status.free_plan');
    if (currentPlan === "personal") return t('status.personal_plan');
    return t('status.family_plan');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isFreePlan ? (
            <>
              <Crown className="w-5 h-5 text-muted-foreground" />
              {getPlanLabel()}
            </>
          ) : (
            <>
              <Crown className="w-5 h-5 text-primary" />
              {getPlanLabel()}
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {quotaItems.map((item) => {
          const percentage = getUsagePercentage(item.current, item.limit);
          const Icon = item.icon;
          const message = getProgressMessage(item.current, item.limit, item.key);
          
          return (
            <div key={item.key} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {isAtLimit(item.current, item.limit) && (
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  )}
                </div>
                <span className="font-mono">
                  {item.current}/{formatLimit(item.limit)}
                </span>
              </div>
              {!isUnlimited(item.limit) && (
                <Progress 
                  value={percentage} 
                  className="h-2"
                  style={{
                    '--progress-background': getProgressColor(item.current, item.limit)
                  } as React.CSSProperties}
                />
              )}
              {isUnlimited(item.limit) && (
                <div className="h-2 bg-secondary rounded-full flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">∞</span>
                </div>
              )}
              {message && (
                <p className={`text-xs mt-1 ${
                  isAtLimit(item.current, item.limit) 
                    ? 'text-destructive' 
                    : isNearLimit(item.current, item.limit, 90) 
                      ? 'text-destructive' 
                      : 'text-orange-600'
                }`}>
                  {message}
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
              {t('upgrade.button')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
