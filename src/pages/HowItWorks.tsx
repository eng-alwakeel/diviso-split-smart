import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { 
  UserPlus, 
  Users, 
  Send, 
  Receipt, 
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react';

const HowItWorks = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const steps = isRTL ? [
    {
      number: 1,
      icon: UserPlus,
      title: 'إنشاء حساب',
      description: 'سجّل حسابك مجاناً خلال ثوانٍ باستخدام بريدك الإلكتروني أو رقم هاتفك.',
      color: 'from-primary/20 to-primary/5',
      iconBg: 'bg-primary/20 text-primary'
    },
    {
      number: 2,
      icon: Users,
      title: 'إنشاء مجموعة',
      description: 'أنشئ مجموعة لرحلتك أو سكنك المشترك أو أي نشاط جماعي واختر العملة المناسبة.',
      color: 'from-blue-500/20 to-blue-500/5',
      iconBg: 'bg-blue-500/20 text-blue-400'
    },
    {
      number: 3,
      icon: Send,
      title: 'دعوة الأصدقاء',
      description: 'أرسل دعوات لأصدقائك عبر الواتساب أو رابط مباشر أو البريد الإلكتروني للانضمام للمجموعة.',
      color: 'from-green-500/20 to-green-500/5',
      iconBg: 'bg-green-500/20 text-green-400'
    },
    {
      number: 4,
      icon: Receipt,
      title: 'إضافة المصاريف',
      description: 'أضف المصاريف بسهولة مع تحديد من دفع ومن يشارك. يمكنك مسح الفاتورة بالذكاء الاصطناعي.',
      color: 'from-orange-500/20 to-orange-500/5',
      iconBg: 'bg-orange-500/20 text-orange-400'
    },
    {
      number: 5,
      icon: CheckCircle,
      title: 'التسوية والتقارير',
      description: 'شاهد من يدين لمن بوضوح تام، وسوِّ الحسابات بضغطة زر مع تقارير مفصلة.',
      color: 'from-purple-500/20 to-purple-500/5',
      iconBg: 'bg-purple-500/20 text-purple-400'
    }
  ] : [
    {
      number: 1,
      icon: UserPlus,
      title: 'Create Account',
      description: 'Sign up for free in seconds using your email or phone number.',
      color: 'from-primary/20 to-primary/5',
      iconBg: 'bg-primary/20 text-primary'
    },
    {
      number: 2,
      icon: Users,
      title: 'Create a Group',
      description: 'Create a group for your trip, shared housing, or any group activity and choose the appropriate currency.',
      color: 'from-blue-500/20 to-blue-500/5',
      iconBg: 'bg-blue-500/20 text-blue-400'
    },
    {
      number: 3,
      icon: Send,
      title: 'Invite Friends',
      description: 'Send invitations to your friends via WhatsApp, direct link, or email to join the group.',
      color: 'from-green-500/20 to-green-500/5',
      iconBg: 'bg-green-500/20 text-green-400'
    },
    {
      number: 4,
      icon: Receipt,
      title: 'Add Expenses',
      description: 'Add expenses easily specifying who paid and who shares. You can scan receipts with AI.',
      color: 'from-orange-500/20 to-orange-500/5',
      iconBg: 'bg-orange-500/20 text-orange-400'
    },
    {
      number: 5,
      icon: CheckCircle,
      title: 'Settle & Report',
      description: 'See who owes whom clearly, and settle accounts with one tap along with detailed reports.',
      color: 'from-purple-500/20 to-purple-500/5',
      iconBg: 'bg-purple-500/20 text-purple-400'
    }
  ];

  // Add HowTo Schema for SEO
  useEffect(() => {
    const howToSchema = {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": isRTL ? "كيفية استخدام تطبيق Diviso" : "How to Use Diviso App",
      "description": isRTL 
        ? "دليل خطوة بخطوة لاستخدام تطبيق Diviso لإدارة المصاريف المشتركة"
        : "Step-by-step guide to using Diviso app for shared expense management",
      "step": steps.map((step, index) => ({
        "@type": "HowToStep",
        "position": index + 1,
        "name": step.title,
        "text": step.description
      }))
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'howto-schema';
    script.textContent = JSON.stringify(howToSchema);
    
    const existingScript = document.getElementById('howto-schema');
    if (existingScript) {
      existingScript.remove();
    }
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById('howto-schema');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [isRTL, steps]);

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <>
      <SEO 
        title={isRTL ? "كيف يعمل Diviso" : "How Diviso Works"}
        description={isRTL 
          ? "تعرف على كيفية استخدام Diviso لتقسيم المصاريف مع أصدقائك وعائلتك في 5 خطوات بسيطة"
          : "Learn how to use Diviso to split expenses with friends and family in 5 simple steps"}
        keywords="كيف يعمل, how it works, شرح التطبيق, tutorial, دليل الاستخدام"
        lang={i18n.language as 'ar' | 'en'}
      />
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="page-container">
          {/* Hero Section */}
          <section className="text-center py-12 md:py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 mb-6">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {isRTL ? 'كيف يعمل Diviso؟' : 'How Does Diviso Work?'}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {isRTL 
                ? 'ابدأ بإدارة مصاريفك المشتركة في 5 خطوات بسيطة'
                : 'Start managing your shared expenses in 5 simple steps'}
            </p>
          </section>

          {/* Steps */}
          <section className="max-w-4xl mx-auto mb-16">
            <div className="relative">
              {/* Connection Line */}
              <div className="absolute start-8 md:start-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-blue-500 to-purple-500 -translate-x-1/2 hidden md:block" />
              
              <div className="space-y-8 md:space-y-12">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isEven = index % 2 === 0;
                  
                  return (
                    <div 
                      key={step.number}
                      className={`relative flex flex-col md:flex-row items-center gap-6 ${
                        isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                      }`}
                    >
                      {/* Step Number Circle (center on desktop) */}
                      <div className="hidden md:flex absolute start-1/2 -translate-x-1/2 z-10 w-12 h-12 rounded-full bg-background border-4 border-primary items-center justify-center font-bold text-primary text-lg">
                        {step.number}
                      </div>
                      
                      {/* Content Card */}
                      <div className={`flex-1 ${isEven ? 'md:pe-16' : 'md:ps-16'}`}>
                        <div className={`unified-card p-6 md:p-8 bg-gradient-to-br ${step.color}`}>
                          <div className="flex items-start gap-4">
                            {/* Mobile Step Number */}
                            <div className="md:hidden flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                              {step.number}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div className={`p-2.5 rounded-xl ${step.iconBg}`}>
                                  <Icon className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-semibold text-foreground">
                                  {step.title}
                                </h2>
                              </div>
                              <p className="text-muted-foreground leading-relaxed">
                                {step.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Empty spacer for layout */}
                      <div className="hidden md:block flex-1" />
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center py-12 mb-8">
            <div className="unified-card max-w-xl mx-auto p-8 bg-gradient-to-br from-primary/10 to-primary/5">
              <h2 className="text-2xl font-bold text-foreground mb-3">
                {isRTL ? 'جاهز للبدء؟' : 'Ready to Get Started?'}
              </h2>
              <p className="text-muted-foreground mb-6">
                {isRTL 
                  ? 'انضم لآلاف المستخدمين الذين يديرون مصاريفهم بذكاء'
                  : 'Join thousands of users who manage their expenses smartly'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link to="/auth" className="gap-2">
                    {isRTL ? 'ابدأ مجاناً' : 'Start Free'}
                    <ArrowIcon className="w-4 h-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/faq">
                    {isRTL ? 'الأسئلة الشائعة' : 'FAQ'}
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default HowItWorks;
