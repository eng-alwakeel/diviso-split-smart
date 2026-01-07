import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { blogArticles } from "@/content/blog/articles";
import { BlogCard } from "@/components/blog/BlogCard";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BookOpen } from "lucide-react";

const Blog = () => {
  const { t, i18n } = useTranslation("blog");
  const isRTL = i18n.language === "ar";

  const pageTitle = isRTL 
    ? "مدونة Diviso - مقالات عن إدارة المصاريف المشتركة" 
    : "Diviso Blog - Articles on Managing Shared Expenses";
  
  const pageDescription = isRTL
    ? "اقرأ مقالاتنا عن تقسيم المصاريف، إدارة الميزانية، ونصائح السفر مع الأصدقاء"
    : "Read our articles about expense splitting, budget management, and travel tips with friends";

  useEffect(() => {
    document.title = pageTitle;
    
    // Update meta tags
    const updateMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    const updateOGMeta = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    updateMeta('description', pageDescription);
    updateMeta('keywords', isRTL ? "تقسيم المصاريف, مدونة, نصائح, السفر, الميزانية" : "expense splitting, blog, tips, travel, budget");
    updateOGMeta('og:title', pageTitle);
    updateOGMeta('og:description', pageDescription);
    updateOGMeta('og:type', 'website');
    updateOGMeta('og:url', 'https://diviso.app/blog');

    // Add structured data
    const existingScript = document.querySelector('script[data-blog-schema]');
    if (existingScript) existingScript.remove();
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-blog-schema', 'true');
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Blog",
      "name": "Diviso Blog",
      "description": pageDescription,
      "url": "https://diviso.app/blog",
      "publisher": {
        "@type": "Organization",
        "name": "Diviso",
        "url": "https://diviso.app"
      },
      "blogPost": blogArticles.map(article => ({
        "@type": "BlogPosting",
        "headline": isRTL ? article.title : article.titleEn,
        "description": isRTL ? article.description : article.descriptionEn,
        "datePublished": article.publishDate,
        "url": `https://diviso.app/blog/${article.slug}`
      }))
    });
    document.head.appendChild(script);

    return () => {
      const schemaScript = document.querySelector('script[data-blog-schema]');
      if (schemaScript) schemaScript.remove();
    };
  }, [pageTitle, pageDescription, isRTL]);

  return (
    <>

      <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
        <Header />
        
        <main className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t("pageTitle")}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("pageDescription")}
            </p>
          </div>

          {/* Articles Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogArticles.map((article) => (
              <BlogCard key={article.slug} article={article} />
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center p-8 bg-primary/5 rounded-2xl">
            <h2 className="text-2xl font-bold mb-4">
              {isRTL ? "جرب Diviso مجاناً" : "Try Diviso for Free"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isRTL 
                ? "ابدأ بتقسيم مصاريفك مع أصدقائك بسهولة" 
                : "Start splitting expenses with your friends easily"
              }
            </p>
            <a
              href="/auth"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              {isRTL ? "ابدأ الآن" : "Get Started"}
            </a>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Blog;
