import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, ChevronDown, Loader2, AlertCircle } from "lucide-react";
import { buildUserDataProfile } from "@/services/homeModeEngine/dataProfileBuilder";
import { resolveHomeMode } from "@/services/homeModeEngine/modeResolver";
import type { HomeModeResult, UserDataProfile } from "@/services/homeModeEngine/types";

/** Fields that directly affect mode resolution — highlighted in the inspector */
const TRIGGER_FIELDS: (keyof UserDataProfile)[] = [
  'owned_groups_count', 'joined_groups_count', 'draft_groups_with_expenses_count',
  'stale_days', 'has_in_progress_data', 'pending_invites_count', 'entered_via_invite_link',
];

export function UserModeInspector() {
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HomeModeResult | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleInspect = async () => {
    if (!userId.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const profile = await buildUserDataProfile(userId.trim());
      const modeResult = resolveHomeMode(profile);
      setResult(modeResult);
    } catch (e: any) {
      setError(e.message || "فشل في جلب بيانات المستخدم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">فحص وضع مستخدم محدد</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="User ID (UUID)"
            value={userId}
            onChange={e => setUserId(e.target.value)}
            className="font-mono text-xs"
            dir="ltr"
          />
          <Button onClick={handleInspect} disabled={loading || !userId.trim()} size="sm">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-3">
            {/* Mode + Overlays */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">الوضع:</span>
              <Badge variant="default" className="font-mono text-xs">{result.current_home_mode}</Badge>
              {result.active_overlays.map(o => (
                <Badge key={o} variant="secondary" className="font-mono text-xs">{o}</Badge>
              ))}
            </div>

            {/* Reason */}
            <div className="bg-muted/50 rounded-md p-3 text-xs font-mono leading-relaxed" dir="ltr">
              {result.resolution_reason}
            </div>

            {/* Data Profile */}
            <Collapsible open={profileOpen} onOpenChange={setProfileOpen}>
              <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium hover:underline">
                <ChevronDown className={`h-4 w-4 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                Data Profile Snapshot
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 border rounded-md overflow-hidden">
                  <table className="w-full text-xs" dir="ltr">
                    <tbody>
                      {Object.entries(result.data_profile_snapshot).map(([key, value]) => {
                        const isTrigger = TRIGGER_FIELDS.includes(key as keyof UserDataProfile);
                        return (
                          <tr key={key} className={isTrigger ? 'bg-primary/5' : ''}>
                            <td className="px-3 py-1.5 font-mono border-b border-r text-muted-foreground">
                              {isTrigger && <span className="text-primary mr-1">●</span>}
                              {key}
                            </td>
                            <td className="px-3 py-1.5 font-mono border-b">
                              {String(value)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
