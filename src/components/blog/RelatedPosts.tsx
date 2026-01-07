import { useTranslation } from "react-i18next";
import { blogArticles, type BlogArticle } from "@/content/blog/articles";
import { BlogCard } from "./BlogCard";

interface RelatedPostsProps {
  currentSlug: string;
  category: string;
}

export const RelatedPosts = ({ currentSlug, category }: RelatedPostsProps) => {
  const { t } = useTranslation("blog");

  const relatedArticles = blogArticles
    .filter((article) => article.slug !== currentSlug)
    .filter((article) => article.category === category)
    .slice(0, 2);

  // If not enough articles in same category, add from other categories
  if (relatedArticles.length < 2) {
    const otherArticles = blogArticles
      .filter((article) => article.slug !== currentSlug)
      .filter((article) => !relatedArticles.includes(article))
      .slice(0, 2 - relatedArticles.length);
    relatedArticles.push(...otherArticles);
  }

  if (relatedArticles.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t border-border">
      <h2 className="text-2xl font-bold mb-6">{t("relatedPosts")}</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {relatedArticles.map((article) => (
          <BlogCard key={article.slug} article={article} />
        ))}
      </div>
    </section>
  );
};
