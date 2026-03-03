import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Scale, Flag, PartyPopper, Lock, Send,
  ArrowDownToLine, FileText, MessageCircle
} from "lucide-react";

export type GroupState = 'active' | 'finished' | 'balanced' | 'closed';

interface GroupStatusBannerProps {
  state: GroupState;
  myBalance: number;
  currencyLabel: string;
  onSettleNow?: () => void;
  onSendRequest?: () => void;
  onFinalClose?: () => void;
  onViewSummary?: () => void;
  hasDebtors?: boolean;
}

const stateConfig: Record<GroupState, {
  icon: React.ElementType;
  bgClass: string;
  iconBgClass: string;
  iconClass: string;
  textClass: string;
  badgeClass: string;
  badgeLabel: string;
}> = {
  active: {
    icon: Scale,
    bgClass: "bg-primary/5 border-primary/15",
    iconBgClass: "bg-primary/10",
    iconClass: "text-primary",
    textClass: "text-primary",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
    badgeLabel: "نشطة",
  },
  finished: {
    icon: Flag,
    bgClass: "bg-amber-500/5 border-amber-500/15",
    iconBgClass: "bg-amber-500/10",
    iconClass: "text-amber-600",
    textClass: "text-amber-700",
    badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    badgeLabel: "منتهية",
  },
  balanced: {
    icon: PartyPopper,
    bgClass: "bg-green-500/5 border-green-500/15",
    iconBgClass: "bg-green-500/10",
    iconClass: "text-green-600",
    textClass: "text-green-700",
    badgeClass: "bg-green-500/10 text-green-600 border-green-500/20",
    badgeLabel: "متوازنة",
  },
  closed: {
    icon: Lock,
    bgClass: "bg-muted/50 border-border",
    iconBgClass: "bg-muted",
    iconClass: "text-muted-foreground",
    textClass: "text-muted-foreground",
    badgeClass: "bg-muted text-muted-foreground border-border",
    badgeLabel: "مغلقة",
  },
};

export const GroupStatusBanner = ({
  state, myBalance, currencyLabel,
  onSettleNow, onSendRequest, onFinalClose, onViewSummary, hasDebtors = false,
}: GroupStatusBannerProps) => {
  const config = stateConfig[state];
  const Icon = config.icon;

  const renderContent = () => {
    switch (state) {
      case 'active':
        if (myBalance < 0) {
          return (
            <>
              <div className="flex-1">
                <p className={`text-sm font-bold ${config.textClass}`}>
                  عليك {Math.abs(myBalance).toLocaleString()} {currencyLabel}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="hero" onClick={onSettleNow} className="text-xs h-8">
                  <ArrowDownToLine className="w-3.5 h-3.5 me-1" />
                  تسوية الآن
                </Button>
                {onSendRequest && (
                  <Button size="sm" variant="outline" onClick={onSendRequest} className="text-xs h-8">
                    <Send className="w-3.5 h-3.5 me-1" />
                    طلب سداد
                  </Button>
                )}
              </div>
            </>
          );
        }
        if (myBalance > 0) {
          return (
            <>
              <div className="flex-1">
                <p className={`text-sm font-bold ${config.textClass}`}>
                  لك {myBalance.toLocaleString()} {currencyLabel} عند الأعضاء
                </p>
              </div>
              {hasDebtors && onSendRequest && (
                <Button size="sm" variant="outline" onClick={onSendRequest} className="text-xs h-8 shrink-0">
                  <MessageCircle className="w-3.5 h-3.5 me-1" />
                  طلب سداد
                </Button>
              )}
            </>
          );
        }
        return (
          <div className="flex-1">
            <p className={`text-sm font-medium ${config.textClass}`}>
              حساباتك متوازنة حالياً
            </p>
          </div>
        );

      case 'finished':
        return (
          <>
            <div className="flex-1">
              <p className={`text-sm font-bold ${config.textClass}`}>
                🏁 تم إنهاء الرحلة — لا يمكن إضافة مصاريف جديدة
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">يمكنك فقط تسوية المبالغ المعلقة</p>
            </div>
            <div className="flex gap-2 shrink-0">
              {myBalance < 0 && onSettleNow && (
                <Button size="sm" variant="hero" onClick={onSettleNow} className="text-xs h-8">
                  تسوية الآن
                </Button>
              )}
              {hasDebtors && onSendRequest && (
                <Button size="sm" variant="outline" onClick={onSendRequest} className="text-xs h-8">
                  <MessageCircle className="w-3.5 h-3.5 me-1" />
                  طلب سداد
                </Button>
              )}
            </div>
          </>
        );

      case 'balanced':
        return (
          <>
            <div className="flex-1">
              <p className={`text-sm font-bold ${config.textClass}`}>
                🎉 الحسابات متوازنة بالكامل
              </p>
            </div>
            {onFinalClose && (
              <Button size="sm" variant="outline" onClick={onFinalClose} className="text-xs h-8 shrink-0">
                <Lock className="w-3.5 h-3.5 me-1" />
                إغلاق نهائي
              </Button>
            )}
          </>
        );

      case 'closed':
        return (
          <>
            <div className="flex-1">
              <p className={`text-sm font-medium ${config.textClass}`}>
                🔒 المجموعة مغلقة
              </p>
            </div>
            {onViewSummary && (
              <Button size="sm" variant="outline" onClick={onViewSummary} className="text-xs h-8 shrink-0">
                <FileText className="w-3.5 h-3.5 me-1" />
                عرض الملخص
              </Button>
            )}
          </>
        );
    }
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${config.bgClass}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${config.iconBgClass}`}>
        <Icon className={`w-4.5 h-4.5 ${config.iconClass}`} />
      </div>
      {renderContent()}
    </div>
  );
};

export const GroupStateBadge = ({ state }: { state: GroupState }) => {
  const config = stateConfig[state];
  return (
    <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${config.badgeClass}`}>
      {config.badgeLabel}
    </Badge>
  );
};
