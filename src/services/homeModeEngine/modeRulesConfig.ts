import { HOME_MODES, OVERLAYS, THRESHOLDS, type HomeMode } from './constants';

export interface ModeRuleConfig {
  description: string;
  descriptionAr: string;
  conditions: string[];
  conditionsAr: string[];
  priority: number;
  exampleScenario: string;
  exampleScenarioAr: string;
  /** Which identity types can trigger this mode */
  availableFor: ('registered' | 'guest')[];
}

export interface OverlayRuleConfig {
  description: string;
  descriptionAr: string;
  conditions: string[];
  conditionsAr: string[];
  active: boolean;
  /** Which identity types can trigger this overlay */
  availableFor: ('registered' | 'guest')[];
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
    availableFor: ['registered'],
  },
  [HOME_MODES.PARTICIPANT]: {
    description: 'User joined groups but never created one — encourage first creation',
    descriptionAr: 'المستخدم انضم لمجموعات لكن لم ينشئ أي واحدة — تشجيع على الإنشاء',
    conditions: ['joined_groups_count > 0', 'owned_groups_count === 0'],
    conditionsAr: ['عدد المجموعات المنضمة > 0', 'عدد المجموعات المملوكة === 0'],
    priority: 2,
    exampleScenario: 'User was invited to 3 groups but never created their own',
    exampleScenarioAr: 'مستخدم تمت دعوته لـ 3 مجموعات لكن لم ينشئ مجموعته الخاصة',
    availableFor: ['registered'],
  },
  [HOME_MODES.SHARE_READY]: {
    description: 'User/guest has draft groups with expenses — ready to collaborate (guest: register to share)',
    descriptionAr: 'المستخدم/الضيف لديه مجموعات مسودة بمصاريف — جاهز للتعاون (ضيف: سجّل للمشاركة)',
    conditions: [
      'Registered: draft_groups_with_expenses_count > 0 && no owned/joined groups',
      'Guest: guest_temporary_groups_count > 0 && guest_temporary_expenses_count > 0',
    ],
    conditionsAr: [
      'مسجل: عدد المسودات بمصاريف > 0 ولا يملك/ينضم لمجموعات',
      'ضيف: لديه مجموعات مؤقتة > 0 ومصاريف مؤقتة > 0',
    ],
    priority: 3,
    exampleScenario: 'Guest created a temp group and added expenses — prompt to register and share',
    exampleScenarioAr: 'ضيف أنشأ مجموعة مؤقتة وأضاف مصاريف — يُطلب منه التسجيل للمشاركة',
    availableFor: ['registered', 'guest'],
  },
  [HOME_MODES.RE_ENGAGEMENT]: {
    description: `User/guest inactive for ${THRESHOLDS.STALE_DAYS}+ days with prior data — reactivation`,
    descriptionAr: `المستخدم/الضيف غير نشط لمدة ${THRESHOLDS.STALE_DAYS}+ يوم مع بيانات سابقة — إعادة تنشيط`,
    conditions: [`stale_days >= ${THRESHOLDS.STALE_DAYS}`, 'has_in_progress_data === true'],
    conditionsAr: [`أيام الخمول >= ${THRESHOLDS.STALE_DAYS}`, 'لديه بيانات قيد التقدم'],
    priority: 4,
    exampleScenario: 'Guest added expenses 20 days ago but stopped',
    exampleScenarioAr: 'ضيف أضاف مصاريف قبل 20 يوماً لكن توقف',
    availableFor: ['registered', 'guest'],
  },
  [HOME_MODES.IN_PROGRESS]: {
    description: 'User/guest has drafts or plans in progress — encourage continuation',
    descriptionAr: 'المستخدم/الضيف لديه مسودات أو خطط قيد التقدم — تشجيع على الاستمرار',
    conditions: ['has_in_progress_data === true', `stale_days < ${THRESHOLDS.STALE_DAYS}`],
    conditionsAr: ['لديه بيانات قيد التقدم', `أيام الخمول < ${THRESHOLDS.STALE_DAYS}`],
    priority: 5,
    exampleScenario: 'Guest created a temp group yesterday but has not added expenses yet',
    exampleScenarioAr: 'ضيف أنشأ مجموعة مؤقتة أمس لكن لم يضف مصاريف بعد',
    availableFor: ['registered', 'guest'],
  },
  [HOME_MODES.FIRST_ENTRY]: {
    description: 'No meaningful prior usage — onboarding',
    descriptionAr: 'لا يوجد استخدام سابق ذو معنى — تعريف بالتطبيق',
    conditions: ['No other mode conditions matched (default fallback)'],
    conditionsAr: ['لم تتحقق شروط أي وضع آخر (القيمة الافتراضية)'],
    priority: 6,
    exampleScenario: 'Brand new guest or user, no data',
    exampleScenarioAr: 'ضيف أو مستخدم جديد تماماً، بدون بيانات',
    availableFor: ['registered', 'guest'],
  },
};

export const OVERLAY_RULES: Record<string, OverlayRuleConfig> = {
  [OVERLAYS.INVITE_PRIORITY]: {
    description: 'Active when user has pending invites or entered via invite link',
    descriptionAr: 'يُفعَّل عندما يكون لدى المستخدم دعوات معلقة أو دخل عبر رابط دعوة',
    conditions: ['entered_via_invite_link === true', 'OR pending_invites_count > 0'],
    conditionsAr: ['دخل عبر رابط دعوة', 'أو عدد الدعوات المعلقة > 0'],
    active: true,
    availableFor: ['registered', 'guest'],
  },
  [OVERLAYS.AUTH_REQUIRED_GATE]: {
    description: 'Active for guests attempting collaborative actions or entering via invite link. Never active for registered users.',
    descriptionAr: 'يُفعَّل للضيوف عند محاولة إجراءات تعاونية أو الدخول عبر رابط دعوة. لا يُفعَّل أبداً للمستخدمين المسجلين.',
    conditions: [
      'identity_type === "guest"',
      'AND (entered_via_invite_link === true OR attempted collaborative action)',
    ],
    conditionsAr: [
      'نوع الهوية === "ضيف"',
      'و (دخل عبر رابط دعوة أو حاول إجراء تعاوني)',
    ],
    active: true,
    availableFor: ['guest'],
  },
};
