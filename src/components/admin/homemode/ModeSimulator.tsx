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

const REGISTERED_PRESETS: Preset[] = [
  { label: "مستخدم جديد", profile: {} },
  { label: "قيد التقدم", profile: { draft_groups_count: 1, has_in_progress_data: true, stale_days: 2 } },
  { label: "جاهز للمشاركة", profile: { draft_groups_with_expenses_count: 1, has_in_progress_data: true } },
  { label: "مشارك فقط", profile: { joined_groups_count: 2, joined_active_groups_count: 2, has_participant_experience: true } },
  { label: "منشئ نشط", profile: { owned_groups_count: 3, owned_active_groups_count: 2, owned_archived_groups_count: 1, expenses_count: 15, has_creator_experience: true, has_balance: true } },
  { label: "إعادة تنشيط", profile: { stale_days: 20, has_in_progress_data: true, expenses_count: 5 } },
  { label: "مع دعوة", profile: { pending_invites_count: 1, joined_groups_count: 1, has_participant_experience: true } },
];

const GUEST_PRESETS: Preset[] = [
  { label: "ضيف جديد", profile: { identity_type: 'guest' } },
  { label: "ضيف بمجموعة مؤقتة", profile: { identity_type: 'guest', guest_temporary_groups_count: 1, has_in_progress_data: true } },
  { label: "ضيف جاهز للمشاركة", profile: { identity_type: 'guest', guest_temporary_groups_count: 1, guest_temporary_expenses_count: 3, has_in_progress_data: true } },
  { label: "ضيف خامل", profile: { identity_type: 'guest', stale_days: 20, has_in_progress_data: true, guest_temporary_groups_count: 1 } },
  { label: "ضيف مع دعوة", profile: { identity_type: 'guest', entered_via_invite_link: true } },
  { label: "ضيف يحاول إضافة أعضاء", profile: { identity_type: 'guest', guest_temporary_groups_count: 1, guest_temporary_expenses_count: 2, has_in_progress_data: true } },
  { label: "ضيف من رابط دعوة → تسجيل", profile: { identity_type: 'guest', entered_via_invite_link: true, invite_target_group_id: 'group-123' } },
];

const GUEST_NUMBER_FIELDS: { key: keyof UserDataProfile; label: string }[] = [
  { key: 'guest_temporary_groups_count', label: 'مجموعات مؤقتة' },
  { key: 'guest_temporary_expenses_count', label: 'مصاريف مؤقتة' },
  { key: 'guest_draft_plans_count', label: 'خطط مسودة (ضيف)' },
  { key: 'stale_days', label: 'أيام الخمول' },
];

const REGISTERED_NUMBER_FIELDS: { key: keyof UserDataProfile; label: string }[] = [
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
  const isGuest = profile.identity_type === 'guest';

  const result = useMemo(() => resolveHomeMode(profile), [profile]);

  const setField = (key: keyof UserDataProfile, value: number | boolean | string) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const toggleIdentity = (guest: boolean) => {
    setProfile({ ...DEFAULT_PROFILE, identity_type: guest ? 'guest' : 'registered' });
  };

  const applyPreset = (preset: Preset) => {
    setProfile({ ...DEFAULT_PROFILE, ...preset.profile });
  };

  const presets = isGuest ? GUEST_PRESETS : REGISTERED_PRESETS;
  const numberFields = isGuest ? GUEST_NUMBER_FIELDS : REGISTERED_NUMBER_FIELDS;
  const booleanFields = isGuest
    ? BOOLEAN_FIELDS.filter(f => ['has_in_progress_data', 'entered_via_invite_link'].includes(f.key as string))
    : BOOLEAN_FIELDS;

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
        {/* Identity Toggle */}
        <div className="flex items-center gap-3 p-2 border rounded-md bg-muted/30">
          <Label className="text-xs font-medium">نوع الهوية:</Label>
          <div className="flex gap-1.5">
            <Button
              variant={!isGuest ? "default" : "outline"}
              size="sm"
              className="text-xs h-7"
              onClick={() => toggleIdentity(false)}
            >
              مسجل
            </Button>
            <Button
              variant={isGuest ? "default" : "outline"}
              size="sm"
              className="text-xs h-7"
              onClick={() => toggleIdentity(true)}
            >
              ضيف
            </Button>
          </div>
          {isGuest && (
            <Badge variant="outline" className="text-xs">
              participant / creator_active محظور
            </Badge>
          )}
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-1.5">
          {presets.map(p => (
            <Button key={p.label} variant="outline" size="sm" className="text-xs h-7" onClick={() => applyPreset(p)}>
              {p.label}
            </Button>
          ))}
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {numberFields.map(({ key, label }) => (
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
          {booleanFields.map(({ key, label }) => (
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
            <Badge variant="outline" className="font-mono text-xs">
              {isGuest ? 'guest' : 'registered'}
            </Badge>
          </div>
          <div className="bg-muted/50 rounded-md p-3 text-xs font-mono leading-relaxed" dir="ltr">
            {result.resolution_reason}
          </div>
          {/* Conversion context for guest scenarios */}
          {isGuest && (
            <div className="bg-muted/30 rounded-md p-3 text-xs space-y-1 border border-dashed">
              <span className="font-medium text-muted-foreground">سياق التحويل:</span>
              <div className="font-mono" dir="ltr">
                {result.active_overlays.includes('auth_required_gate')
                  ? `auth_gate: active | redirect: /auth?mode=signup`
                  : 'auth_gate: inactive'}
              </div>
              {profile.entered_via_invite_link && (
                <div className="font-mono" dir="ltr">
                  invite_target: {profile.invite_target_group_id || 'none'} | post_auth: /i/{'{code}'}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
