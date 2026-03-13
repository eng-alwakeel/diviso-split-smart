import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BRAND_CONFIG } from '@/lib/brandConfig';
import SEO from '@/components/SEO';
import { SEOLandingPageData } from '@/content/seo-pages/seoLandingPagesData';
import { ChevronDown } from 'lucide-react';

interface Props {
  data: SEOLandingPageData;
}

const SEOLandingPage: React.FC<Props> = ({ data }) => {
  const navigate = useNavigate();
  const handleCTA = () => navigate('/auth?mode=signup');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title={data.seoTitle.replace(' | Diviso', '')}
        description={data.metaDescription}
        canonical={`${BRAND_CONFIG.url}${data.route}`}
        keywords={data.keywords}
        ogType="website"
        lang="en"
      />

      {/* Minimal Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={BRAND_CONFIG.logo} alt="Diviso" className="h-8 w-auto" loading="eager" />
            <span className="font-bold text-lg text-foreground">Diviso</span>
          </Link>
          <Button onClick={handleCTA} size="sm" className="bg-primary hover:bg-primary/90">
            Get Started Free
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
            {data.h1}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            {data.heroSubtitle}
          </p>
          <Button
            onClick={handleCTA}
            size="lg"
            className="text-lg px-10 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
          >
            {data.ctaText}
          </Button>
          <p className="text-sm text-muted-foreground mt-4 flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse" />
            +10,000 users trust Diviso
          </p>
        </div>
      </section>

      {/* Body Content */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {data.bodyContent.map((paragraph, i) => (
            <p key={i} className="text-base md:text-lg text-muted-foreground leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-12">
            Everything You Need to {data.h1.split('—')[0].trim()}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.features.map((feature, i) => (
              <article key={i} className="bg-card rounded-xl p-6 border border-border hover:border-primary/30 transition-colors">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-12">
            Built for Real-Life Scenarios
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.useCases.map((uc, i) => (
              <article key={i} className="bg-card rounded-xl p-6 border border-border">
                <h3 className="font-semibold text-foreground mb-2">{uc.title}</h3>
                <p className="text-sm text-muted-foreground">{uc.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section with JSON-LD */}
      <FAQSection faqs={data.faqs} pageUrl={`${BRAND_CONFIG.url}${data.route}`} />

      {/* Internal Links */}
      <section className="py-12 px-4 bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-foreground mb-6 text-center">Related Pages</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {data.relatedPages.map((link, i) => (
              <Link
                key={i}
                to={link.href}
                className="px-4 py-2 rounded-lg bg-card border border-border text-sm text-foreground hover:border-primary/50 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {data.relatedBlogSlugs.map((slug, i) => (
              <Link
                key={`blog-${i}`}
                to={`/blog/${slug}`}
                className="px-4 py-2 rounded-lg bg-card border border-border text-sm text-muted-foreground hover:border-primary/50 transition-colors"
              >
                📖 {slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-t from-primary/10 via-primary/5 to-background">
        <div className="max-w-xl mx-auto text-center">
          <img src={BRAND_CONFIG.logo} alt="Diviso Logo" className="h-10 w-auto mx-auto mb-6" loading="lazy" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            Ready to simplify shared expenses?
          </h2>
          <Button
            onClick={handleCTA}
            size="lg"
            className="text-xl px-12 py-7 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90 mb-4"
          >
            {data.ctaText}
          </Button>
          <p className="text-muted-foreground text-sm">{data.ctaSubtext}</p>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Diviso. All rights reserved.</span>
          <nav className="flex gap-4">
            <Link to="/privacy-policy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};

/* FAQ sub-component with accordion + JSON-LD */
const FAQSection: React.FC<{ faqs: { question: string; answer: string }[]; pageUrl: string }> = ({ faqs, pageUrl }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-12">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left"
                aria-expanded={openIndex === i}
              >
                <span className="font-medium text-foreground pr-4">{faq.question}</span>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`}
                />
              </button>
              {openIndex === i && (
                <div className="px-6 pb-4 text-sm text-muted-foreground leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </section>
  );
};

export default SEOLandingPage;
