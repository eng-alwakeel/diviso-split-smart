import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { resolveHomeMode } from "@/services/homeModeEngine/modeResolver";
import type { UserDataProfile } from "@/services/homeModeEngine/types";

const DEFAULT_PROFILE: UserDataProfile = {
  identity_type: 'registered',
  guest_session_id: null,
  guest_temporary_groups_count: 0,
  guest_temporary_expenses_count: 0,
  guest_draft_plans_count: 0,
  owned_groups_count: 0,
  owned_active_groups_count: 0,
  owned_archived_groups_count: 0,
  joined_groups_count: 0,
  joined_active_groups_count: 0,
  joined_archived_groups_count: 0,
  draft_groups_count: 0,
  draft_groups_with_expenses_count: 0,
  draft_plans_count: 0,
  has_in_progress_data: false,
  expenses_count: 0,
  has_balance: false,
  has_settlement_action: false,
  activity_count: 0,
  last_activity_at: null,
  stale_days: 0,
  pending_invites_count: 0,
  entered_via_invite_link: false,
  invite_target_group_id: null,
  has_creator_experience: false,
  has_participant_experience: false,
};

type Preset = { label: string; profile: Partial<UserDataProfile> };

const PRESETS: Preset[] = [
  { label: "مستخدم جديد", profile: {} },
  { label: "قيد التقدم", profile: { draft_groups_count: 1, has_in_progress_data: true, stale_days: 2 } },
  { label: "جاهز للمشاركة", profile: { draft_groups_with_expenses_count: 1, has_in_progress_data: true } },
  { label: "مشارك فقط", profile: { joined_groups_count: 2, joined_active_groups_count: 2, has_participant_experience: true } },
  { label: "منشئ نشط", profile: { owned_groups_count: 3, owned_active_groups_count: 2, owned_archived_groups_count: 1, expenses_count: 15, has_creator_experience: true, has_balance: true } },
  { label: "إعادة تنشيط", profile: { stale_days: 20, has_in_progress_data: true, expenses_count: 5 } },
  { label: "مع دعوة", profile: { pending_invites_count: 1, joined_groups_count: 1, has_participant_experience: true } },
];

const NUMBER_FIELDS: { key: keyof UserDataProfile; label: string }[] = [
  { key: 'owned_groups_count', label: 'مجموعات مملوكة' },
  { key: 'owned_active_groups_count', label: 'مملوكة نشطة' },
  { key: 'owned_archived_groups_count', label: 'مملوكة مؤرشفة' },
  { key: 'joined_groups_count', label: 'مجموعات منضمة' },
  { key: 'joined_active_groups_count', label: 'منضمة نشطة' },
  { key: 'joined_archived_groups_count', label: 'منضمة مؤرشفة' },
  { key: 'draft_groups_count', label: 'مسودات مجموعات' },
  { key: 'draft_groups_with_expenses_count', label: 'مسودات بمصاريف' },
  { key: 'draft_plans_count', label: 'خطط مسودة' },
  { key: 'expenses_count', label: 'عدد المصاريف' },
  { key: 'activity_count', label: 'عدد الأنشطة' },
  { key: 'stale_days', label: 'أيام الخمول' },
  { key: 'pending_invites_count', label: 'دعوات معلقة' },
];

const BOOLEAN_FIELDS: { key: keyof UserDataProfile; label: string }[] = [
  { key: 'has_in_progress_data', label: 'بيانات قيد التقدم' },
  { key: 'has_balance', label: 'لديه رصيد' },
  { key: 'has_settlement_action', label: 'لديه تسوية' },
  { key: 'entered_via_invite_link', label: 'دخل عبر رابط دعوة' },
  { key: 'has_creator_experience', label: 'خبرة إنشاء' },
  { key: 'has_participant_experience', label: 'خبرة مشاركة' },
];

export function ModeSimulator() {
  const [profile, setProfile] = useState<UserDataProfile>({ ...DEFAULT_PROFILE });

  const result = useMemo(() => resolveHomeMode(profile), [profile]);

  const setField = (key: keyof UserDataProfile, value: number | boolean) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const applyPreset = (preset: Preset) => {
    setProfile({ ...DEFAULT_PROFILE, ...preset.profile });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">محاكاة الأوضاع</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setProfile({ ...DEFAULT_PROFILE })}>
          <RotateCcw className="h-4 w-4 ml-1" />
          إعادة تعيين
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Presets */}
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map(p => (
            <Button key={p.label} variant="outline" size="sm" className="text-xs h-7" onClick={() => applyPreset(p)}>
              {p.label}
            </Button>
          ))}
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {NUMBER_FIELDS.map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <Input
                type="number"
                min={0}
                value={profile[key] as number}
                onChange={e => setField(key, parseInt(e.target.value) || 0)}
                className="h-8 text-xs"
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {BOOLEAN_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <Switch
                checked={profile[key] as boolean}
                onCheckedChange={v => setField(key, v)}
              />
              <Label className="text-xs">{label}</Label>
            </div>
          ))}
        </div>

        {/* Result */}
        <div className="border-t pt-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">النتيجة:</span>
            <Badge variant="default" className="font-mono text-xs">{result.current_home_mode}</Badge>
            {result.active_overlays.map(o => (
              <Badge key={o} variant="secondary" className="font-mono text-xs">{o}</Badge>
            ))}
          </div>
          <div className="bg-muted/50 rounded-md p-3 text-xs font-mono leading-relaxed" dir="ltr">
            {result.resolution_reason}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
