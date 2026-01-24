import { useTranslation } from 'react-i18next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { UseCaseCard } from '@/components/use-cases/UseCaseCard';
import { useCases } from '@/content/use-cases/useCases';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';

const UseCases = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Add ItemList Schema
  useEffect(() => {
    const existingScript = document.querySelector('script[data-use-cases-schema]');
    if (existingScript) existingScript.remove();

    const schema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": isRTL ? "حالات استخدام Diviso" : "Diviso Use Cases",
      "description": isRTL 
        ? "تعرف على كيفية استخدام Diviso لتقسيم المصاريف في مختلف المواقف"
        : "Learn how to use Diviso for expense splitting in various situations",
      "numberOfItems": useCases.length,
      "itemListElement": useCases.map((uc, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": isRTL ? uc.title : uc.titleEn,
        "url": `https://diviso.app/use-cases/${uc.slug}`
      }))
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-use-cases-schema', 'true');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const schemaScript = document.querySelector('script[data-use-cases-schema]');
      if (schemaScript) schemaScript.remove();
    };
  }, [isRTL]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={isRTL ? 'حالات الاستخدام' : 'Use Cases'}
        description={isRTL 
          ? 'تعرف على كيفية استخدام Diviso لتقسيم المصاريف في السفر، السكن المشترك، الطلعات، الفعاليات، والكشتات.'
          : 'Learn how to use Diviso for splitting expenses in travel, shared housing, outings, events, and camping trips.'
        }
        canonical="https://diviso.app/use-cases"
        keywords={isRTL 
          ? 'حالات استخدام Diviso, تقسيم مصاريف السفر, مصاريف السكن المشترك, تقسيم فاتورة المطعم'
          : 'Diviso use cases, travel expense splitting, shared housing expenses, restaurant bill splitting'
        }
        lang={isRTL ? 'ar' : 'en'}
      />
      <Header />

      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {isRTL ? 'كيف يُستخدم Diviso؟' : 'How is Diviso Used?'}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {isRTL 
                ? 'Diviso يساعد على تقسيم المصاريف المشتركة في مختلف المواقف. اختر الموقف الذي يناسبك.'
                : 'Diviso helps split shared expenses in various situations. Choose the situation that fits you.'
              }
            </p>
          </div>
        </section>

        {/* Use Cases Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {useCases.map((useCase) => (
                <UseCaseCard key={useCase.slug} useCase={useCase} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              {isRTL ? 'جرب Diviso مجانًا الآن' : 'Try Diviso for Free Now'}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              {isRTL 
                ? 'أنشئ مجموعتك الأولى في أقل من دقيقة وابدأ بتقسيم المصاريف.'
                : 'Create your first group in less than a minute and start splitting expenses.'
              }
            </p>
            <Button asChild size="lg" className="rounded-full px-8">
              <Link to="/auth">
                {isRTL ? 'ابدأ الآن' : 'Start Now'}
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default UseCases;
