import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plane, Home, Users, PartyPopper, Mountain, ArrowLeft, ArrowRight } from 'lucide-react';
import { UseCase } from '@/content/use-cases/useCases';

interface UseCaseCardProps {
  useCase: UseCase;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Plane,
  Home,
  Users,
  PartyPopper,
  Mountain
};

export const UseCaseCard = ({ useCase }: UseCaseCardProps) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const Icon = iconMap[useCase.icon] || Users;
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <Link
      to={`/use-cases/${useCase.slug}`}
      className="group block p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
            {isRTL ? useCase.title : useCase.titleEn}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-2">
            {isRTL ? useCase.intro : useCase.introEn}
          </p>
        </div>
        <ArrowIcon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
      </div>
    </Link>
  );
};
