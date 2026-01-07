import { useTranslation } from "react-i18next";
import { Clock, Calendar, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { BlogArticle } from "@/content/blog/articles";

interface BlogHeaderProps {
  article: BlogArticle;
}

export const BlogHeader = ({ article }: BlogHeaderProps) => {
  const { t, i18n } = useTranslation("blog");
  const isRTL = i18n.language === "ar";

  const title = isRTL ? article.title : article.titleEn;
  const description = isRTL ? article.description : article.descriptionEn;
  const keywords = isRTL ? article.keywords : article.keywordsEn;

  const formattedDate = new Date(article.publishDate).toLocaleDateString(
    isRTL ? "ar-SA" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <header className="mb-8 pb-8 border-b border-border">
      <Badge variant="secondary" className="mb-4">
        {t(`categories.${article.category}`)}
      </Badge>

      <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
        {title}
      </h1>

      <p className="text-xl text-muted-foreground mb-6">
        {description}
      </p>

      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>{t("readTime", { minutes: article.readTime })}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {keywords.slice(0, 5).map((keyword, index) => (
          <div
            key={index}
            className="flex items-center gap-1 px-3 py-1 bg-muted rounded-full text-sm"
          >
            <Tag className="h-3 w-3" />
            <span>{keyword}</span>
          </div>
        ))}
      </div>
    </header>
  );
};
