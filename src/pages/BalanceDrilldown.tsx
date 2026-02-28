import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, ChevronLeft, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import useMyExpenses from "@/hooks/useMyExpenses";
import { useGroupBalances, GroupBalance } from "@/hooks/useGroupBalances";
import { BottomNav } from "@/components/BottomNav";

const BalanceDrilldown = () => {
  const { type } = useParams<{ type: string }>();
  const isReceivables = type === 'receivables';
  const { t, i18n } = useTranslation('expenses');
  const isRTL = i18n.dir() === 'rtl';
  const navigate = useNavigate();

  const { expenses, loading, currentUserId } = useMyExpenses();
  const { receivableGroups, payableGroups } = useGroupBalances(expenses, currentUserId);

  const groups: GroupBalance[] = isReceivables ? receivableGroups : payableGroups;
  const title = isReceivables ? t('drilldown.receivables_title') : t('drilldown.payables_title');
  const desc = isReceivables ? t('drilldown.receivables_desc') : t('drilldown.payables_desc');
  const emptyMsg = isReceivables ? t('drilldown.no_receivables') : t('drilldown.no_payables');

  const totalAmount = groups.reduce((sum, g) => sum + Math.abs(g.net), 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate('/my-expenses')}
          >
            {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowRight className="h-4 w-4 rotate-180" />}
          </Button>
          <div className="flex-1">
            <h1 className="text-base font-bold">{title}</h1>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Total summary */}
        <Card className={`border-s-4 ${isReceivables ? 'border-s-success' : 'border-s-destructive'}`}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isReceivables ? 'bg-success/10' : 'bg-destructive/10'}`}>
              {isReceivables ? <TrendingUp className="h-5 w-5 text-success" /> : <TrendingDown className="h-5 w-5 text-destructive" />}
            </div>
            <div>
              <p className={`text-xl font-black ${isReceivables ? 'text-success' : 'text-destructive'}`}>
                {isReceivables ? '+' : '-'}{totalAmount.toLocaleString()} {groups[0]?.currency || 'SAR'}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {groups.length} {t('stats.groups')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Loading */}
        {loading && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {t('loading')}
          </div>
        )}

        {/* Empty state */}
        {!loading && groups.length === 0 && (
          <div className="text-center py-12 space-y-3">
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">{emptyMsg}</p>
            <Button variant="outline" size="sm" onClick={() => navigate('/my-expenses')}>
              {t('drilldown.back')}
            </Button>
          </div>
        )}

        {/* Group list */}
        {!loading && groups.length > 0 && (
          <div className="space-y-2">
            {groups.map((group) => (
              <Card
                key={group.group_id}
                className="cursor-pointer hover:bg-accent/50 transition-colors active:scale-[0.98]"
                onClick={() => navigate(`/group/${group.group_id}`)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{group.group_name}</p>
                    <p className="text-[11px] text-muted-foreground">{group.currency}</p>
                  </div>
                  <p className={`text-base font-bold whitespace-nowrap ${isReceivables ? 'text-success' : 'text-destructive'}`}>
                    {isReceivables ? '+' : ''}{group.net.toLocaleString()} 
                  </p>
                  <ChevronLeft className={`h-4 w-4 text-muted-foreground shrink-0 ${!isRTL ? 'rotate-180' : ''}`} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default BalanceDrilldown;
