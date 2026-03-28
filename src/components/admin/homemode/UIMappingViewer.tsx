import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MODE_PRIORITY } from "@/services/homeModeEngine/constants";
import { getHomeModeUIConfig } from "@/services/homeModeEngine/uiModeConfig";

export function UIMappingViewer() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ربط الأوضاع بالواجهة</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {MODE_PRIORITY.map(mode => {
          const config = getHomeModeUIConfig(mode);
          return (
            <div key={mode} className="border rounded-md p-3 space-y-2">
              <Badge variant="default" className="font-mono text-xs">{mode}</Badge>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <Row label="العنوان" value={config.heroTitle} />
                <Row label="العنوان الفرعي" value={config.heroSubtitle} />
                <Row label="CTA الأساسي" value={`${config.primaryCTA.label} → ${config.primaryCTA.route}`} />
                {config.secondaryCTA && (
                  <Row label="CTA الثانوي" value={`${config.secondaryCTA.label} → ${config.secondaryCTA.route}`} />
                )}
                <Row label="القسم الرئيسي" value={config.mainSectionType} mono />
                <Row label="إحصائيات" value={config.showStatsGrid ? '✓' : '✗'} />
                <Row label="إجراءات سريعة" value={config.showQuickActions ? '✓' : '✗'} />
                <Row label="بطاقات اشتراك" value={config.showSubscriptionCards ? '✓' : '✗'} />
                <Row label="إعلانات" value={config.showAds ? '✓' : '✗'} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <>
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? 'font-mono' : ''} dir="ltr">{value}</span>
    </>
  );
}
