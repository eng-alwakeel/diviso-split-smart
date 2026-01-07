import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Clock, ArrowLeft, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BlogArticle } from "@/content/blog/articles";

interface BlogCardProps {
  article: BlogArticle;
}

const categoryColors: Record<string, string> = {
  guides: "bg-primary/10 text-primary",
  tips: "bg-green-500/10 text-green-600",
  news: "bg-blue-500/10 text-blue-600",
  comparisons: "bg-orange-500/10 text-orange-600",
};

export const BlogCard = ({ article }: BlogCardProps) => {
  const { t, i18n } = useTranslation("blog");
  const isRTL = i18n.language === "ar";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  const title = isRTL ? article.title : article.titleEn;
  const description = isRTL ? article.description : article.descriptionEn;
  const categoryLabel = t(`categories.${article.category}`);

  return (
    <Link to={`/blog/${article.slug}`}>
      <Card className="group h-full transition-all duration-300 hover:shadow-lg hover:border-primary/30 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Badge 
              variant="secondary" 
              className={categoryColors[article.category] || "bg-muted text-muted-foreground"}
            >
              {categoryLabel}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{t("readTime", { minutes: article.readTime })}</span>
            </div>
          </div>

          <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>

          <p className="text-muted-foreground mb-4 line-clamp-3">
            {description}
          </p>

          <div className="flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all">
            <span>{t("readMore")}</span>
            <Arrow className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
