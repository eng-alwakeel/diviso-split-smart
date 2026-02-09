import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo } from "react";
import DOMPurify from "dompurify";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getArticleBySlug } from "@/content/blog/articles";
import { BlogHeader } from "@/components/blog/BlogHeader";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const article = slug ? getArticleBySlug(slug) : undefined;
  const title = article ? (isRTL ? article.title : article.titleEn) : "";
  const description = article ? (isRTL ? article.description : article.descriptionEn) : "";
  const content = article ? (isRTL ? article.content : article.contentEn) : "";
  const keywords = article ? (isRTL ? article.keywords : article.keywordsEn) : [];
  const pageUrl = article ? `https://diviso.app/blog/${article.slug}` : "";
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  useEffect(() => {
    if (!article) return;
    
    document.title = `${title} | Diviso`;
    
    const updateMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    updateMeta('description', description);
    updateMeta('keywords', keywords.join(", "));
  }, [article, title, description, keywords]);

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            {isRTL ? "المقالة غير موجودة" : "Article not found"}
          </h1>
          <Button onClick={() => navigate("/blog")}>
            {isRTL ? "العودة للمدونة" : "Back to Blog"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            className="mb-6 gap-2"
            onClick={() => navigate("/blog")}
          >
            <BackArrow className="h-4 w-4" />
            {isRTL ? "العودة للمدونة" : "Back to Blog"}
          </Button>

          <BlogHeader article={article} />

          <div className="mb-8">
            <ShareButtons title={title} url={pageUrl} />
          </div>

          <article className="prose prose-lg dark:prose-invert max-w-none">
            <div 
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatContent(content), {
                ALLOWED_TAGS: ['p', 'h2', 'h3', 'ul', 'li', 'strong', 'em', 'a', 'br'],
                ALLOWED_ATTR: ['href', 'target', 'rel']
              }) }}
              className="[&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mt-8 [&>h2]:mb-4 [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:mt-6 [&>h3]:mb-3 [&>p]:mb-4 [&>p]:leading-relaxed [&>ul]:mb-4 [&>ul]:space-y-2"
            />
          </article>

          <div className="mt-12 p-8 bg-primary/5 rounded-2xl text-center">
            <h2 className="text-2xl font-bold mb-4">
              {isRTL ? "جرب Diviso الآن" : "Try Diviso Now"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isRTL ? "ابدأ بتقسيم مصاريفك مع أصدقائك بكل سهولة" : "Start splitting expenses with your friends easily"}
            </p>
            <a
              href="/auth"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              {isRTL ? "ابدأ مجاناً" : "Start for Free"}
            </a>
          </div>

          <RelatedPosts currentSlug={article.slug} category={article.category} />
        </div>
      </main>

      <Footer />
    </div>
  );
};

function formatContent(content: string): string {
  return content
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<)(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '');
}

export default BlogPost;
