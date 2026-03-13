import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { blogArticles, type BlogArticle } from "@/content/blog/articles";
import { BlogCard } from "./BlogCard";
import { ArrowLeft, ArrowRight } from "lucide-react";

// Map article categories/keywords to relevant use case pages
const useCaseLinks = [
  { keywords: ["سفر", "رحل", "travel", "trip"], slug: "travel", labelAr: "تقسيم مصاريف السفر", labelEn: "Split Travel Expenses" },
  { keywords: ["سكن", "إيجار", "housing", "rent", "roommate"], slug: "shared-housing", labelAr: "مصاريف السكن المشترك", labelEn: "Shared Housing Expenses" },
  { keywords: ["أصدقاء", "شباب", "friends", "group"], slug: "friends-expenses", labelAr: "مصاريف الأصدقاء", labelEn: "Friends Expenses" },
  { keywords: ["مطعم", "فاتورة", "حساب", "restaurant", "bill", "check"], slug: "events", labelAr: "مصاريف المناسبات", labelEn: "Event Expenses" },
  { keywords: ["كشتة", "تخييم", "camping", "desert"], slug: "group-trips", labelAr: "رحلات المجموعات", labelEn: "Group Trips" },
];

interface RelatedArticlesProps {
  currentSlug: string;
  category: string;
}

export const RelatedArticles = ({ currentSlug, category }: RelatedArticlesProps) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const currentArticle = blogArticles.find((a) => a.slug === currentSlug);

  // Find related use cases based on keywords
  const relatedUseCases = useCaseLinks.filter((uc) => {
    if (!currentArticle) return false;
    const allKeywords = [...currentArticle.keywords, ...currentArticle.keywordsEn, currentArticle.title, currentArticle.titleEn].join(" ").toLowerCase();
    return uc.keywords.some((kw) => allKeywords.includes(kw.toLowerCase()));
  }).slice(0, 2);

  // Related blog articles
  const relatedArticles = blogArticles
    .filter((a) => a.slug !== currentSlug)
    .filter((a) => a.category === category)
    .slice(0, 2);

  if (relatedArticles.length < 2) {
    const others = blogArticles
      .filter((a) => a.slug !== currentSlug && !relatedArticles.includes(a))
      .slice(0, 2 - relatedArticles.length);
    relatedArticles.push(...others);
  }

  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section className="mt-12 pt-8 border-t border-border space-y-8">
      {/* Related Use Cases */}
      {relatedUseCases.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-muted-foreground">
            {isRTL ? "حالات استخدام ذات صلة" : "Related Use Cases"}
          </h3>
          <div className="flex flex-wrap gap-3">
            {relatedUseCases.map((uc) => (
              <Link
                key={uc.slug}
                to={`/use-cases/${uc.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
              >
                {isRTL ? uc.labelAr : uc.labelEn}
                <Arrow className="h-3.5 w-3.5" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Related Blog Posts */}
      {relatedArticles.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">
            {isRTL ? "مقالات ذات صلة" : "Related Posts"}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {relatedArticles.map((article) => (
              <BlogCard key={article.slug} article={article} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
