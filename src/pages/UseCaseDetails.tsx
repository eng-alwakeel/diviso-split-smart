import { useParams, Navigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { RelatedUseCases } from '@/components/use-cases/RelatedUseCases';
import { getUseCaseBySlug, getOtherUseCases } from '@/content/use-cases/useCases';
import { Button } from '@/components/ui/button';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Plane, Home, Users, PartyPopper, Mountain,
  AlertCircle, CheckCircle2, ListOrdered
} from 'lucide-react';
import { useEffect } from 'react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Plane,
  Home,
  Users,
  PartyPopper,
  Mountain
};

const UseCaseDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const useCase = slug ? getUseCaseBySlug(slug) : undefined;
  const otherUseCases = slug ? getOtherUseCases(slug) : [];

  // Add comprehensive schema for AI
  useEffect(() => {
    if (!useCase) return;

    const existingScript = document.querySelector('script[data-use-case-detail-schema]');
    if (existingScript) existingScript.remove();

    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          "headline": isRTL ? useCase.question : useCase.questionEn,
          "description": isRTL ? useCase.intro : useCase.introEn,
          "isAccessibleForFree": true,
          "author": {
            "@type": "Organization",
            "name": "Diviso",
            "url": "https://diviso.app"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Diviso",
            "logo": {
              "@type": "ImageObject",
              "url": "https://diviso.app/og-image.png"
            }
          },
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://diviso.app/use-cases/${useCase.slug}`
          }
        },
        {
          "@type": "FAQPage",
          "mainEntity": (isRTL ? useCase.faqs : useCase.faqsEn).map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.answer
            }
          }))
        },
        {
          "@type": "HowTo",
          "name": isRTL 
            ? `خطوات استخدام Diviso لـ${useCase.title}`
            : `Steps to use Diviso for ${useCase.titleEn}`,
          "description": isRTL ? useCase.intro : useCase.introEn,
          "step": (isRTL ? useCase.steps : useCase.stepsEn).map((step, index) => ({
            "@type": "HowToStep",
            "position": index + 1,
            "name": step.title,
            "text": step.description
          }))
        },
        {
          "@type": "SoftwareApplication",
          "name": "Diviso",
          "applicationCategory": "FinanceApplication",
          "operatingSystem": "Web, iOS, Android",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "SAR"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "1250"
          }
        }
      ]
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-use-case-detail-schema', 'true');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const schemaScript = document.querySelector('script[data-use-case-detail-schema]');
      if (schemaScript) schemaScript.remove();
    };
  }, [useCase, isRTL]);

  if (!useCase) {
    return <Navigate to="/use-cases" replace />;
  }

  const Icon = iconMap[useCase.icon] || Users;
  const problems = isRTL ? useCase.problems : useCase.problemsEn;
  const solutions = isRTL ? useCase.solutions : useCase.solutionsEn;
  const steps = isRTL ? useCase.steps : useCase.stepsEn;
  const faqs = isRTL ? useCase.faqs : useCase.faqsEn;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={isRTL ? useCase.title : useCase.titleEn}
        description={isRTL ? useCase.intro : useCase.introEn}
        canonical={`https://diviso.app/use-cases/${useCase.slug}`}
        keywords={(isRTL ? useCase.keywords : useCase.keywordsEn).join(', ')}
        lang={isRTL ? 'ar' : 'en'}
        ogType="article"
        breadcrumbs={[
          { name: isRTL ? 'الرئيسية' : 'Home', url: 'https://diviso.app' },
          { name: isRTL ? 'حالات الاستخدام' : 'Use Cases', url: 'https://diviso.app/use-cases' },
          { name: isRTL ? useCase.title : useCase.titleEn, url: `https://diviso.app/use-cases/${useCase.slug}` }
        ]}
      />
      <Header />

      <main className="pt-24 pb-8">
        {/* Hero Section with H1 */}
        <section className="py-12 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <Icon className="w-8 h-8" />
              </div>
              <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                {isRTL ? 'حالة استخدام' : 'Use Case'}
              </span>
            </div>
            
            {/* H1 - Question format */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-6 leading-tight">
              {isRTL ? useCase.question : useCase.questionEn}
            </h1>
            
            {/* Intro paragraph - AI-optimized */}
            <p className="text-lg text-muted-foreground leading-relaxed">
              {isRTL ? useCase.intro : useCase.introEn}
            </p>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-10">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="w-6 h-6 text-destructive" />
              <h2 className="text-xl font-bold text-foreground">
                {isRTL ? 'المشكلة' : 'The Problem'}
              </h2>
            </div>
            <ul className="space-y-3">
              {problems.map((problem, index) => (
                <li key={index} className="flex items-start gap-3 text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-destructive/60 mt-2 flex-shrink-0" />
                  <span>{problem}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Solution Section */}
        <section className="py-10 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle2 className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                {isRTL ? 'الحل مع Diviso' : 'The Solution with Diviso'}
              </h2>
            </div>
            <ul className="space-y-3">
              {solutions.map((solution, index) => (
                <li key={index} className="flex items-start gap-3 text-foreground">
                  <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>{solution}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Steps Section */}
        <section className="py-10">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <ListOrdered className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                {isRTL ? 'خطوات الاستخدام' : 'How to Use'}
              </h2>
            </div>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                    <p className="text-muted-foreground text-sm">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-10 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-xl font-bold text-foreground mb-6">
              {isRTL ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
            </h2>
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`faq-${index}`}
                  className="bg-card border border-border rounded-xl px-4"
                >
                  <AccordionTrigger className="text-foreground hover:no-underline text-start">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              {isRTL ? 'جرب Diviso الآن مجانًا' : 'Try Diviso Now for Free'}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              {isRTL 
                ? 'أنشئ مجموعتك الأولى وابدأ بتقسيم المصاريف في دقائق.'
                : 'Create your first group and start splitting expenses in minutes.'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="rounded-full px-8">
                <Link to="/auth">
                  {isRTL ? 'ابدأ مجانًا' : 'Start for Free'}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8">
                <Link to="/how-it-works">
                  {isRTL ? 'كيف يعمل؟' : 'How it Works?'}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Related Use Cases */}
        <RelatedUseCases useCases={otherUseCases} />
      </main>

      <Footer />
    </div>
  );
};

export default UseCaseDetails;
