import { SEO } from "@/components/SEO";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, Sparkles, Zap, Shield, MessageCircle, Users, Wallet, Dice1, BarChart3, Globe, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  description: string;
  type: 'major' | 'feature' | 'improvement' | 'fix';
  icon: React.ReactNode;
  items: string[];
}

const changelog: ChangelogEntry[] = [
  {
    version: "2.8",
    date: "2026-03-03",
    title: "طرق الاستلام (Payout Methods)",
    description: "أضف حسابك البنكي أو STC Pay لتسهيل استلام المدفوعات من أعضاء المجموعة.",
    type: "major",
    icon: <Wallet className="w-5 h-5" />,
    items: [
      "إضافة طرق استلام متعددة (IBAN, حساب بنكي, STC Bank, STC Pay)",
      "طريقة افتراضية واحدة تظهر تلقائياً في طلبات السداد",
      "عرض طرق الدفع للمستلم داخل بطاقة التسوية",
      "تضمين طريقة الدفع تلقائياً في رسائل واتساب",
      "إخفاء جزئي لأرقام الحسابات مع إمكانية النسخ الكامل",
      "خصوصية تامة: تظهر فقط لأعضاء مجموعاتك المشتركة",
    ],
  },
  {
    version: "2.7",
    date: "2026-03-03",
    title: "الدردشة الفورية (Realtime Broadcast)",
    description: "رسائل فورية بتأخير أقل من 100 مللي ثانية مع مؤشر الكتابة.",
    type: "major",
    icon: <MessageCircle className="w-5 h-5" />,
    items: [
      "بث فوري للرسائل عبر Supabase Realtime Broadcast",
      "مؤشر 'يكتب الآن...' في الوقت الحقيقي",
      "حفظ غير متزامن للرسائل (لا ينتظر قاعدة البيانات)",
      "منع التكرار + تحديد معدل الإرسال (25 رسالة/10 ثوانٍ)",
      "فقاعات رسائل محسّنة مع بطاقات مالية تفاعلية",
    ],
  },
  {
    version: "2.6",
    date: "2026-02-28",
    title: "الأرصدة السابقة (Legacy Balances)",
    description: "سجّل ديون سابقة لمجموعات بدأت قبل استخدام Diviso.",
    type: "feature",
    icon: <BarChart3 className="w-5 h-5" />,
    items: [
      "إضافة أرصدة سابقة لأي عضو من قبل المشرف",
      "تأثير مباشر على صافي الرصيد والتسويات المقترحة",
      "بطاقة إعلان تلقائية في الدردشة عند إضافة رصيد سابق",
      "دعم المجموعات التي بدأت خارج التطبيق",
    ],
  },
  {
    version: "2.5",
    date: "2026-02-25",
    title: "دورة حياة المجموعة + التأكيد المزدوج",
    description: "إنهاء الرحلة، الإغلاق النهائي، وتأكيد استلام التسويات.",
    type: "feature",
    icon: <Shield className="w-5 h-5" />,
    items: [
      "حالات المجموعة: نشطة ← منتهية ← مغلقة",
      "زر 'إنهاء الرحلة' للمشرفين مع إشعار لجميع الأعضاء",
      "التأكيد المزدوج: المستلم يؤكد استلام التسوية داخل الدردشة",
      "ملخص الرحلة القابل للمشاركة كبطاقة صورية",
      "تصدير التسويات كنص أو صورة بعلامة Diviso المائية",
    ],
  },
  {
    version: "2.4",
    date: "2026-02-20",
    title: "طلب السداد عبر واتساب",
    description: "أرسل طلب سداد جاهز للمدينين عبر واتساب بضغطة واحدة.",
    type: "feature",
    icon: <MessageCircle className="w-5 h-5" />,
    items: [
      "رسالة واتساب منسّقة تلقائياً بالمبلغ واسم المجموعة",
      "تذكير المدينين عبر إشعارات التطبيق (🔔)",
      "مشاركة التسويات كنص منسّق",
    ],
  },
  {
    version: "2.3",
    date: "2026-02-15",
    title: "النرد الجماعي (Group Dice)",
    description: "اتخذ قرارات جماعية عشوائية بطريقة ممتعة.",
    type: "feature",
    icon: <Dice1 className="w-5 h-5" />,
    items: [
      "أنواع نرد متعددة: من يدفع؟ أين نأكل؟ ماذا نفعل؟",
      "تصويت الأعضاء على النتيجة أو إعادة الرمي",
      "إعلان تلقائي في الدردشة",
      "نرد اليوم المقترح حسب سياق المجموعة",
    ],
  },
  {
    version: "2.2",
    date: "2026-02-10",
    title: "شارات السمعة + الإنجازات",
    description: "احصل على شارات تقدير بناءً على نشاطك في المجموعات.",
    type: "improvement",
    icon: <Sparkles className="w-5 h-5" />,
    items: [
      "شارة 'أكثر مساهمة' لأكثر عضو دفعاً",
      "شارة 'أسرع سداد' لأسرع عضو في تسوية ديونه",
      "شارة 'روح المجموعة' للعضو الأكثر تفاعلاً",
      "نظام إنجازات تراكمي مع مكافآت",
    ],
  },
  {
    version: "2.1",
    date: "2026-02-01",
    title: "دعم متعدد اللغات + العملات",
    description: "واجهة كاملة بالعربية والإنجليزية مع تحويل تلقائي للعملات.",
    type: "improvement",
    icon: <Globe className="w-5 h-5" />,
    items: [
      "واجهة كاملة بالعربية والإنجليزية",
      "تبديل اللغة من الإعدادات",
      "دعم 15+ عملة مع أسعار صرف محدّثة",
      "عرض المبالغ بعملتك المفضلة بجانب عملة المجموعة",
    ],
  },
  {
    version: "2.0",
    date: "2026-01-20",
    title: "إعادة بناء كاملة — Diviso 2.0",
    description: "تصميم جديد كلياً مع أداء محسّن وميزات متقدمة.",
    type: "major",
    icon: <Zap className="w-5 h-5" />,
    items: [
      "تصميم UI/UX جديد بالكامل مع وضع داكن",
      "نظام مجموعات متقدم مع أدوار (مالك/مشرف/عضو)",
      "تقسيم مصاريف مرن (بالتساوي/مخصص/بالنسبة)",
      "موافقة على المصاريف من المشرف قبل الاحتساب",
      "لوحة تحكم شخصية مع إحصائيات مالية",
      "نظام إشعارات ذكي",
    ],
  },
];

const typeConfig = {
  major: { label: "إصدار رئيسي", className: "bg-accent/10 text-accent border-accent/30" },
  feature: { label: "ميزة جديدة", className: "bg-primary/10 text-primary border-primary/30" },
  improvement: { label: "تحسين", className: "bg-secondary text-secondary-foreground border-secondary" },
  fix: { label: "إصلاح", className: "bg-muted text-muted-foreground border-border" },
};

const Changelog = () => {
  const navigate = useNavigate();
  const { isRTL } = useLanguage();
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="ما الجديد في Diviso | Changelog"
        description="تعرّف على آخر التحديثات والميزات الجديدة في تطبيق Diviso لتقسيم المصاريف الجماعية."
        keywords="Diviso changelog, ما الجديد, تحديثات diviso, ميزات جديدة"
      />
      <AppHeader />

      <div className="page-container max-w-3xl mx-auto space-y-8 pb-24">
        {/* Header */}
        <div>
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <BackArrow className="w-4 h-4 me-2" />
            رجوع
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">ما الجديد في Diviso</h1>
              <p className="text-muted-foreground">تابع آخر التحديثات والميزات</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute start-5 top-0 bottom-0 w-px bg-border/60" />

          <div className="space-y-8">
            {changelog.map((entry, idx) => (
              <div key={entry.version} className="relative ps-14">
                {/* Dot on timeline */}
                <div className={`absolute start-3 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  entry.type === 'major' ? 'bg-accent border-accent text-accent-foreground' : 'bg-background border-border'
                }`}>
                  {entry.type === 'major' && <Zap className="w-3 h-3" />}
                </div>

                <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden shadow-card">
                  {/* Header */}
                  <div className="p-5 pb-3">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="outline" className={typeConfig[entry.type].className}>
                        {typeConfig[entry.type].label}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">v{entry.version}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-accent">{entry.icon}</span>
                      <h2 className="text-lg font-bold text-foreground">{entry.title}</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">{entry.description}</p>
                  </div>

                  {/* Items */}
                  <div className="px-5 pb-5">
                    <ul className="space-y-2">
                      {entry.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                          <span className="text-accent mt-0.5 shrink-0">✦</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground mb-4">هل لديك اقتراح لميزة جديدة؟</p>
          <Button variant="outline" onClick={() => navigate('/settings')}>
            أرسل ملاحظاتك من الإعدادات
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Changelog;
