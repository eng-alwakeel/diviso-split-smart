import { HOME_MODES, OVERLAYS, THRESHOLDS, type HomeMode } from './constants';

export interface ModeRuleConfig {
  description: string;
  descriptionAr: string;
  conditions: string[];
  conditionsAr: string[];
  priority: number;
  exampleScenario: string;
  exampleScenarioAr: string;
}

export interface OverlayRuleConfig {
  description: string;
  descriptionAr: string;
  conditions: string[];
  conditionsAr: string[];
  active: boolean;
}

export const MODE_RULES: Record<HomeMode, ModeRuleConfig> = {
  [HOME_MODES.CREATOR_ACTIVE]: {
    description: 'User owns at least one group — full creator dashboard',
    descriptionAr: 'المستخدم يملك مجموعة واحدة على الأقل — لوحة تحكم المنشئ الكاملة',
    conditions: ['owned_groups_count > 0'],
    conditionsAr: ['عدد المجموعات المملوكة > 0'],
    priority: 1,
    exampleScenario: 'User created 2 groups and has active expenses',
    exampleScenarioAr: 'مستخدم أنشأ مجموعتين ولديه مصاريف نشطة',
  },
  [HOME_MODES.PARTICIPANT]: {
    description: 'User joined groups but never created one — encourage first creation',
    descriptionAr: 'المستخدم انضم لمجموعات لكن لم ينشئ أي واحدة — تشجيع على الإنشاء',
    conditions: ['joined_groups_count > 0', 'owned_groups_count === 0'],
    conditionsAr: ['عدد المجموعات المنضمة > 0', 'عدد المجموعات المملوكة === 0'],
    priority: 2,
    exampleScenario: 'User was invited to 3 groups but never created their own',
    exampleScenarioAr: 'مستخدم تمت دعوته لـ 3 مجموعات لكن لم ينشئ مجموعته الخاصة',
  },
  [HOME_MODES.SHARE_READY]: {
    description: 'User has draft groups with expenses — ready to collaborate',
    descriptionAr: 'المستخدم لديه مجموعات مسودة بمصاريف — جاهز للتعاون',
    conditions: ['draft_groups_with_expenses_count > 0', 'owned_groups_count === 0', 'joined_groups_count === 0'],
    conditionsAr: ['عدد المسودات بمصاريف > 0', 'عدد المجموعات المملوكة === 0', 'عدد المجموعات المنضمة === 0'],
    priority: 3,
    exampleScenario: 'User created a draft group and added expenses but has not shared it yet',
    exampleScenarioAr: 'مستخدم أنشأ مجموعة مسودة وأضاف مصاريف لكن لم يشاركها بعد',
  },
  [HOME_MODES.RE_ENGAGEMENT]: {
    description: `User inactive for ${THRESHOLDS.STALE_DAYS}+ days with prior data — reactivation`,
    descriptionAr: `المستخدم غير نشط لمدة ${THRESHOLDS.STALE_DAYS}+ يوم مع بيانات سابقة — إعادة تنشيط`,
    conditions: [`stale_days >= ${THRESHOLDS.STALE_DAYS}`, 'has_in_progress_data === true', 'owned_groups_count === 0', 'joined_groups_count === 0', 'draft_groups_with_expenses_count === 0'],
    conditionsAr: [`أيام الخمول >= ${THRESHOLDS.STALE_DAYS}`, 'لديه بيانات قيد التقدم', 'لا يملك مجموعات', 'لم ينضم لمجموعات', 'لا مسودات بمصاريف'],
    priority: 4,
    exampleScenario: 'User added expenses 20 days ago but stopped using the app',
    exampleScenarioAr: 'مستخدم أضاف مصاريف قبل 20 يوماً لكن توقف عن استخدام التطبيق',
  },
  [HOME_MODES.IN_PROGRESS]: {
    description: 'User has drafts or plans in progress — encourage continuation',
    descriptionAr: 'المستخدم لديه مسودات أو خطط قيد التقدم — تشجيع على الاستمرار',
    conditions: ['has_in_progress_data === true', 'owned_groups_count === 0', 'joined_groups_count === 0', 'draft_groups_with_expenses_count === 0', `stale_days < ${THRESHOLDS.STALE_DAYS}`],
    conditionsAr: ['لديه بيانات قيد التقدم', 'لا يملك مجموعات', 'لم ينضم لمجموعات', 'لا مسودات بمصاريف', `أيام الخمول < ${THRESHOLDS.STALE_DAYS}`],
    priority: 5,
    exampleScenario: 'User created a draft group yesterday but has not added expenses yet',
    exampleScenarioAr: 'مستخدم أنشأ مجموعة مسودة أمس لكن لم يضف مصاريف بعد',
  },
  [HOME_MODES.FIRST_ENTRY]: {
    description: 'No meaningful prior usage — onboarding',
    descriptionAr: 'لا يوجد استخدام سابق ذو معنى — تعريف بالتطبيق',
    conditions: ['No other mode conditions matched (default fallback)'],
    conditionsAr: ['لم تتحقق شروط أي وضع آخر (القيمة الافتراضية)'],
    priority: 6,
    exampleScenario: 'Brand new user, just registered, no groups, no expenses',
    exampleScenarioAr: 'مستخدم جديد تماماً، سجل للتو، بدون مجموعات أو مصاريف',
  },
};

export const OVERLAY_RULES: Record<string, OverlayRuleConfig> = {
  [OVERLAYS.INVITE_PRIORITY]: {
    description: 'Active when user has pending invites or entered via invite link',
    descriptionAr: 'يُفعَّل عندما يكون لدى المستخدم دعوات معلقة أو دخل عبر رابط دعوة',
    conditions: ['entered_via_invite_link === true', 'OR pending_invites_count > 0'],
    conditionsAr: ['دخل عبر رابط دعوة', 'أو عدد الدعوات المعلقة > 0'],
    active: true,
  },
  [OVERLAYS.AUTH_REQUIRED_GATE]: {
    description: 'Reserved for future guest mode — never activated for registered users',
    descriptionAr: 'محجوز لوضع الضيف المستقبلي — لا يُفعَّل أبداً للمستخدمين المسجلين',
    conditions: ['Reserved — not yet implemented'],
    conditionsAr: ['محجوز — لم يُنفَّذ بعد'],
    active: false,
  },
};
