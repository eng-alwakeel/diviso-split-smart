import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCurrentPlan } from "@/hooks/usePlan";
import { useNavigate } from "react-router-dom";
import { gaEvent } from "@/utils/analytics";

const label = "إعلان";

const canServe = (placement: string) => {
  // Feature flags via localStorage
  const globalOn = localStorage.getItem('ads.enabled.free');
  if (globalOn !== null && globalOn !== 'true') return false;
  const key = `ads.enabled.${placement}`;
  const on = localStorage.getItem(key);
  if (on !== null && on !== 'true') return false;
  // Session frequency cap: max 3 per session
  const impressions = Number(sessionStorage.getItem('ads.impr') || '0');
  if (impressions >= 3) return false;
  // One per screen basic guard using a marker (reset when route changes naturally)
  if (sessionStorage.getItem('ads.servedThisView') === '1') return false;
  return true;
};

const markServed = () => {
  const impressions = Number(sessionStorage.getItem('ads.impr') || '0');
  sessionStorage.setItem('ads.impr', String(impressions + 1));
  sessionStorage.setItem('ads.servedThisView', '1');
};

const resetViewFlag = () => sessionStorage.removeItem('ads.servedThisView');

export type AdSlotProps = { placement: 'home_banner' | 'native_offer_card' | 'postocr_tile' };

export const AdSlot: React.FC<AdSlotProps> = ({ placement }) => {
  const { planCode } = useCurrentPlan();
  const navigate = useNavigate();
  const [shouldShow, setShouldShow] = useState(false);
  const shownRef = useRef(false);

  useEffect(() => { resetViewFlag(); }, []);

  useEffect(() => {
    if (planCode && planCode.startsWith('free') && canServe(placement)) {
      setShouldShow(true);
    } else {
      setShouldShow(false);
    }
  }, [planCode, placement]);

  if (!shouldShow || shownRef.current) return null;

  const onClickUpgrade = () => {
    navigate('/#pricing');
  };

  // Mark as served once rendered
  useEffect(() => { if (shouldShow) { markServed(); shownRef.current = true; gaEvent('ad_impression', { placement, plan: planCode }); } }, [shouldShow]);

  // Simple lightweight card fallback (house offer)
  return (
    <div className={placement === 'home_banner' ? 'my-4' : placement === 'native_offer_card' ? 'my-6' : 'mt-6'}>
      <Card className="border-border bg-card/70">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground mb-1">{label}</div>
            <div className="font-medium">وفر على مصاريفك مع عرض شركائنا الحصري</div>
            <div className="text-sm text-muted-foreground">كاش باك حتى 10% على المطاعم والسفر</div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button size="sm" variant="secondary" onClick={onClickUpgrade}>إزالة الإعلانات؟ ترقية إلى برو</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
