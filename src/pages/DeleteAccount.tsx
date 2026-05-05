import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, UserX, Settings as SettingsIcon, Mail, Clock, Database, Shield, AlertTriangle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";

const COPY = {
  ar: {
    title: "حذف الحساب",
    description: "نشرح لك بالتفصيل كيف تحذف حسابك في Diviso وما يحدث لبياناتك.",
    back: "رجوع",
    intro: {
      title: "نظرة عامة",
      body: "نحرص في Diviso على حقك في التحكم ببياناتك. يمكنك حذف حسابك في أي وقت بطريقتين: من داخل التطبيق، أو بإرسال طلب عبر البريد الإلكتروني."
    },
    inApp: {
      title: "الطريقة الأولى: حذف الحساب من داخل التطبيق",
      steps: [
        "سجّل الدخول إلى حسابك في Diviso.",
        "افتح صفحة الإعدادات من القائمة.",
        "اختر قسم 'حسابي'.",
        "انزل لأسفل الصفحة واضغط على زر 'حذف الحساب'.",
        "أكّد رغبتك في الحذف عند ظهور رسالة التأكيد."
      ],
      cta: "اذهب إلى الإعدادات"
    },
    email: {
      title: "الطريقة الثانية: حذف الحساب عبر البريد الإلكتروني",
      body: "إذا لم تستطع الوصول إلى التطبيق، أرسل بريداً إلكترونياً من نفس البريد المسجّل في حسابك إلى:",
      address: "support@diviso.app",
      subject: "وضع 'حذف الحساب' في عنوان الرسالة.",
      response: "سنرد على طلبك خلال 7 أيام عمل بعد التحقق من هويتك."
    },
    deleted: {
      title: "البيانات التي يتم حذفها",
      items: [
        "الملف الشخصي (الاسم، الصورة، رقم الهاتف، البريد الإلكتروني).",
        "المجموعات التي تملكها وسجلاتها.",
        "المصاريف والتقسيمات المرتبطة بحسابك.",
        "طرق الدفع وحسابات التحويل (IBAN / STC Pay).",
        "الإشعارات وسجل النشاط.",
        "نقاط السمعة والإنجازات."
      ]
    },
    retained: {
      title: "البيانات التي يتم الاحتفاظ بها",
      body: "بحكم النظام السعودي والتزامات هيئة الزكاة والضريبة والجمارك (ZATCA)، يُلزمنا الاحتفاظ ببعض السجلات لفترة محددة قانوناً، وتشمل:",
      items: [
        "الفواتير الضريبية ومستندات المدفوعات (لمدة 6 سنوات).",
        "السجلات المالية المرتبطة بمعاملات تمت قبل الحذف.",
        "بيانات إحصائية مجهّلة الهوية لا يمكن ربطها بشخصك."
      ]
    },
    timeline: {
      title: "الجدول الزمني للحذف",
      items: [
        "فور الضغط على 'حذف الحساب': يتم تسجيل خروجك مباشرة وإيقاف حسابك.",
        "خلال 30 يوماً: يمكنك التراجع عن قرار الحذف بمراسلتنا.",
        "بعد 30 يوماً: يصبح الحذف نهائياً ولا يمكن التراجع عنه."
      ]
    },
    contact: {
      title: "تحتاج مساعدة؟",
      body: "تواصل معنا في أي وقت على",
      email: "support@diviso.app"
    }
  },
  en: {
    title: "Delete Your Account",
    description: "A clear, step-by-step guide on how to delete your Diviso account and what happens to your data.",
    back: "Back",
    intro: {
      title: "Overview",
      body: "At Diviso we respect your right to control your data. You can delete your account at any time in two ways: from inside the app, or by sending us an email request."
    },
    inApp: {
      title: "Option 1: Delete from inside the app",
      steps: [
        "Sign in to your Diviso account.",
        "Open the Settings page from the menu.",
        "Tap the \"Account\" section.",
        "Scroll to the bottom and tap \"Delete Account\".",
        "Confirm the deletion when the confirmation prompt appears."
      ],
      cta: "Go to Settings"
    },
    email: {
      title: "Option 2: Delete via email",
      body: "If you can't access the app, send an email from the same address registered to your account to:",
      address: "support@diviso.app",
      subject: "Use \"Delete Account\" as the email subject.",
      response: "We will respond within 7 business days after verifying your identity."
    },
    deleted: {
      title: "What gets deleted",
      items: [
        "Your profile (name, photo, phone number, email).",
        "Groups you own and their records.",
        "Expenses and splits linked to your account.",
        "Payment methods and payout details (IBAN / STC Pay).",
        "Notifications and activity history.",
        "Reputation points and achievements."
      ]
    },
    retained: {
      title: "What we retain",
      body: "Under Saudi law and ZATCA tax regulations, we are required to keep certain records for a defined period, including:",
      items: [
        "Tax invoices and payment documents (kept for 6 years).",
        "Financial records of transactions completed before deletion.",
        "Anonymized analytics data that cannot be linked back to you."
      ]
    },
    timeline: {
      title: "Deletion timeline",
      items: [
        "Immediately on tapping \"Delete Account\": you are signed out and your account is suspended.",
        "Within 30 days: you can reverse the deletion by contacting us.",
        "After 30 days: deletion is permanent and cannot be reversed."
      ]
    },
    contact: {
      title: "Need help?",
      body: "Reach us anytime at",
      email: "support@diviso.app"
    }
  }
};

const DeleteAccount = () => {
  const navigate = useNavigate();
  const { isRTL } = useLanguage();
  const t = isRTL ? COPY.ar : COPY.en;
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={isRTL ? "حذف الحساب | Diviso" : "Delete Account | Diviso"}
        description={t.description}
        canonical="https://diviso.app/delete-account"
      />
      <Header />
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <BackIcon className="h-4 w-4" />
          {t.back}
        </Button>

        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
              <UserX className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t.description}</p>
        </div>

        <Card>
          <CardContent className="p-6 md:p-8 space-y-10">
            {/* Intro */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">{t.intro.title}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{t.intro.body}</p>
            </section>

            {/* In-app */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <SettingsIcon className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">{t.inApp.title}</h2>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground ps-4">
                {t.inApp.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
              <Button asChild>
                <Link to="/settings">{t.inApp.cta}</Link>
              </Button>
            </section>

            {/* Email */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">{t.email.title}</h2>
              </div>
              <p className="text-muted-foreground">{t.email.body}</p>
              <a
                href={`mailto:${t.email.address}?subject=${encodeURIComponent(isRTL ? "حذف الحساب" : "Delete Account")}`}
                className="inline-block font-mono text-primary hover:underline"
              >
                {t.email.address}
              </a>
              <p className="text-muted-foreground">{t.email.subject}</p>
              <p className="text-sm text-muted-foreground">{t.email.response}</p>
            </section>

            {/* Deleted */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <h2 className="text-xl font-semibold">{t.deleted.title}</h2>
              </div>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ps-4">
                {t.deleted.items.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </section>

            {/* Retained */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">{t.retained.title}</h2>
              </div>
              <p className="text-muted-foreground">{t.retained.body}</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ps-4">
                {t.retained.items.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </section>

            {/* Timeline */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">{t.timeline.title}</h2>
              </div>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ps-4">
                {t.timeline.items.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </section>

            {/* Contact */}
            <section className="space-y-3 bg-muted/50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold">{t.contact.title}</h2>
              <p className="text-muted-foreground">
                {t.contact.body}{" "}
                <a href={`mailto:${t.contact.email}`} className="text-primary hover:underline">
                  {t.contact.email}
                </a>
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeleteAccount;
