import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MODE_RULES, OVERLAY_RULES } from "@/services/homeModeEngine/modeRulesConfig";
import { MODE_PRIORITY } from "@/services/homeModeEngine/constants";

export function ModeRulesViewer() {
  return (
    <div className="space-y-4">
      {/* Modes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">أوضاع الصفحة الرئيسية (حسب الأولوية)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {MODE_PRIORITY.map((mode, idx) => {
            const rule = MODE_RULES[mode];
            return (
              <div key={mode} className="border rounded-md p-3 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="font-mono text-xs">#{idx + 1}</Badge>
                  <Badge variant="default" className="font-mono text-xs">{mode}</Badge>
                  {rule.availableFor.map(id => (
                    <Badge key={id} variant={id === 'guest' ? 'secondary' : 'outline'} className="font-mono text-xs">
                      {id}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{rule.descriptionAr}</p>
                <div>
                  <span className="text-xs font-medium">الشروط:</span>
                  <ul className="list-disc list-inside text-xs text-muted-foreground mt-1 space-y-0.5" dir="ltr">
                    {rule.conditions.map((c, i) => (
                      <li key={i} className="font-mono">{c}</li>
                    ))}
                  </ul>
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">مثال: </span>{rule.exampleScenarioAr}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Overlays */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">الطبقات الإضافية (Overlays)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(OVERLAY_RULES).map(([key, rule]) => (
            <div key={key} className="border rounded-md p-3 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={rule.active ? "secondary" : "outline"} className="font-mono text-xs">{key}</Badge>
                {!rule.active && <Badge variant="outline" className="text-xs">غير مفعّل</Badge>}
                {rule.availableFor.map(id => (
                  <Badge key={id} variant={id === 'guest' ? 'secondary' : 'outline'} className="font-mono text-xs">
                    {id}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">{rule.descriptionAr}</p>
              <ul className="list-disc list-inside text-xs text-muted-foreground font-mono" dir="ltr">
                {rule.conditions.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          ))}

        </CardContent>
      </Card>
    </div>
  );
}
