import { useState, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/SEO';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BrandedDiviso } from '@/components/ui/branded-diviso';
import { 
  Search, 
  HelpCircle, 
  Users, 
  Receipt, 
  Shield,
  ArrowRight,
  ArrowLeft,
  Mail,
  Coins,
  Sparkles,
  MessageSquare
} from 'lucide-react';

const FAQ = () => {
  const { t, i18n } = useTranslation('faq');
  const isRTL = i18n.language === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = [
    { id: 'general', icon: HelpCircle, color: 'bg-primary/20 text-primary' },
    { id: 'groups', icon: Users, color: 'bg-blue-500/20 text-blue-400' },
    { id: 'expenses', icon: Receipt, color: 'bg-green-500/20 text-green-400' },
    { id: 'credits', icon: Coins, color: 'bg-amber-500/20 text-amber-400' },
    { id: 'ai', icon: Sparkles, color: 'bg-purple-500/20 text-purple-400' },
    { id: 'account', icon: Shield, color: 'bg-orange-500/20 text-orange-400' },
    { id: 'scenarios', icon: MessageSquare, color: 'bg-cyan-500/20 text-cyan-400' },
  ];

  const questionsByCategory: Record<string, string[]> = {
    general: ['what_is_diviso', 'is_free', 'plan_difference', 'currencies', 'offline_access'],
    groups: ['create_group', 'invite_friends', 'multiple_groups', 'group_chat'],
    expenses: ['add_expense', 'expense_split', 'edit_expense', 'receipt_scan', 'create_budget', 'budget_alerts', 'reports_analytics'],
    credits: ['what_are_credits', 'subscription_plans', 'buy_credits', 'referral_program', 'referral_rewards'],
    ai: ['ai_trip_planner', 'smart_recommendations', 'smart_categories'],
    account: ['change_password', 'delete_account', 'data_security'],
    scenarios: ['avoid_money_disputes', 'best_way_split_trip', 'close_accounts_peacefully', 'one_pays_others_transfer'],
  };

  const allQuestions = Object.entries(questionsByCategory).flatMap(([category, questions]) =>
    questions.map(q => ({ category, id: q }))
  );

  const filteredQuestions = searchQuery
    ? allQuestions.filter(({ id }) => {
        const question = t(`questions.${id}.question`).toLowerCase();
        const answer = t(`questions.${id}.answer`).toLowerCase();
        return question.includes(searchQuery.toLowerCase()) || answer.includes(searchQuery.toLowerCase());
      })
    : activeCategory
    ? allQuestions.filter(q => q.category === activeCategory)
    : allQuestions;

  // Add FAQ Schema for SEO
  useEffect(() => {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": allQuestions.map(({ id }) => ({
        "@type": "Question",
        "name": t(`questions.${id}.question`),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": t(`questions.${id}.answer`)
        }
      }))
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'faq-schema';
    script.textContent = JSON.stringify(faqSchema);
    
    const existingScript = document.getElementById('faq-schema');
    if (existingScript) {
      existingScript.remove();
    }
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById('faq-schema');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [t, i18n.language]);

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <>
      <SEO 
        title={t('pageTitle')}
        description={t('pageDescription')}
        keywords="الأسئلة الشائعة, FAQ, دعم فني, مساعدة, Diviso help, support"
        lang={i18n.language as 'ar' | 'en'}
      />
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="page-container">
          {/* Hero Section */}
          <section className="text-center py-12 md:py-16 lg:py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-primary/20 mb-6">
              <HelpCircle className="w-8 h-8 lg:w-10 lg:h-10 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              {t('pageTitle')}
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl lg:max-w-3xl mx-auto">
              <Trans
                i18nKey="pageDescription"
                ns="faq"
                components={{ brand: <BrandedDiviso /> }}
              />
            </p>
          </section>

          {/* Search */}
          <section className="max-w-xl lg:max-w-2xl mx-auto mb-8 lg:mb-12">
            <div className="relative">
              <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-12 h-12 lg:h-14 text-lg rounded-xl"
              />
            </div>
          </section>

          {/* Mobile Category Filters */}
          <section className="flex flex-wrap justify-center gap-3 mb-10 lg:hidden">
            <Badge
              variant={activeCategory === null ? "default" : "outline"}
              className="cursor-pointer px-4 py-2 text-sm"
              onClick={() => setActiveCategory(null)}
            >
              {t('allCategories')}
            </Badge>
            {categories.map(({ id, icon: Icon, color }) => (
              <Badge
                key={id}
                variant={activeCategory === id ? "default" : "outline"}
                className={`cursor-pointer px-4 py-2 text-sm gap-2 ${activeCategory === id ? '' : color}`}
                onClick={() => setActiveCategory(id)}
              >
                <Icon className="w-4 h-4" />
                {t(`categories.${id}`)}
              </Badge>
            ))}
          </section>

          {/* Two-Column Layout for Desktop */}
          <section className="max-w-6xl mx-auto mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Desktop Sidebar - Categories */}
              <aside className="hidden lg:block lg:col-span-1">
                <div className="sticky top-24 space-y-2 unified-card p-5">
                  <h3 className="font-semibold text-foreground mb-4 text-lg">{t('categoriesTitle') || t('allCategories').replace(/^[^ ]+ /, '')}</h3>
                  
                  <Button
                    variant={activeCategory === null ? "default" : "ghost"}
                    className="w-full justify-start gap-3 h-11"
                    onClick={() => setActiveCategory(null)}
                  >
                    <HelpCircle className="w-5 h-5" />
                    <span className="flex-1 text-start">{t('allCategories')}</span>
                    <Badge variant="secondary" className="text-xs">
                      {allQuestions.length}
                    </Badge>
                  </Button>
                  
                  {categories.map(({ id, icon: Icon, color }) => (
                    <Button
                      key={id}
                      variant={activeCategory === id ? "default" : "ghost"}
                      className={`w-full justify-start gap-3 h-11 ${activeCategory !== id ? 'hover:bg-muted/50' : ''}`}
                      onClick={() => setActiveCategory(id)}
                    >
                      <div className={`p-1.5 rounded-md ${activeCategory === id ? 'bg-primary-foreground/20' : color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="flex-1 text-start">{t(`categories.${id}`)}</span>
                      <Badge variant="secondary" className="text-xs">
                        {questionsByCategory[id].length}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </aside>

              {/* Main Content - FAQ Accordion */}
              <div className="lg:col-span-3">
                <Accordion type="single" collapsible className="space-y-4">
                  {filteredQuestions.map(({ category, id }) => {
                    const categoryData = categories.find(c => c.id === category);
                    const Icon = categoryData?.icon || HelpCircle;
                    
                    return (
                      <AccordionItem 
                        key={id} 
                        value={id}
                        className="unified-card px-6 border-none"
                      >
                        <AccordionTrigger className="hover:no-underline py-5">
                          <div className="flex items-center gap-3 text-start">
                            <div className={`p-2 rounded-lg ${categoryData?.color}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-foreground">
                              <Trans
                                i18nKey={`questions.${id}.question`}
                                ns="faq"
                                components={{ brand: <BrandedDiviso /> }}
                              />
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pb-5 ps-12 leading-relaxed">
                          <Trans
                            i18nKey={`questions.${id}.answer`}
                            ns="faq"
                            components={{ brand: <BrandedDiviso /> }}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>

                {filteredQuestions.length === 0 && (
                  <div className="text-center py-12">
                    <HelpCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {t('noResults')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Contact CTA */}
          <section className="text-center py-12 mb-8">
            <div className="unified-card max-w-xl lg:max-w-3xl mx-auto p-8 lg:p-12">
              <h2 className="text-xl lg:text-2xl font-semibold text-foreground mb-3">
                {t('stillHaveQuestions')}
              </h2>
              <p className="text-muted-foreground mb-6 lg:text-lg">
                {t('supportTeamReady')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <a href="mailto:support@diviso.app" className="gap-2">
                    <Mail className="w-4 h-4" />
                    {t('contactUs')}
                  </a>
                </Button>
                <Button variant="outline" asChild size="lg">
                  <Link to="/" className="gap-2">
                    {t('backToHome')}
                    <ArrowIcon className="w-4 h-4" />
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

export default FAQ;
