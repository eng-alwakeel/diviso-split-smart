import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plane, Home, Users, PartyPopper, Mountain, HandCoins } from 'lucide-react';
import { UseCase } from '@/content/use-cases/useCases';

interface RelatedUseCasesProps {
  useCases: UseCase[];
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Plane,
  Home,
  Users,
  PartyPopper,
  Mountain,
  HandCoins
};

export const RelatedUseCases = ({ useCases }: RelatedUseCasesProps) => {
  const { t, i18n } = useTranslation('common');
  const isRTL = i18n.language === 'ar';

  return (
    <section className="py-12 border-t border-border">
      <div className="container mx-auto px-4">
        <h2 className="text-xl font-bold text-foreground mb-6 text-center">
          {isRTL ? 'حالات استخدام أخرى' : 'Other Use Cases'}
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {useCases.map((uc) => {
            const Icon = iconMap[uc.icon] || Users;
            return (
              <Link
                key={uc.slug}
                to={`/use-cases/${uc.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted hover:bg-primary/10 hover:text-primary border border-border hover:border-primary/30 transition-all text-sm font-medium"
              >
                <Icon className="w-4 h-4" />
                <span>{isRTL ? uc.title : uc.titleEn}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
