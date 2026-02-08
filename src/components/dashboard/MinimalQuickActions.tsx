import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function MinimalQuickActions() {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();

  return (
    <div className="flex gap-3">
      <Button
        className="flex-1 gap-2"
        onClick={() => navigate('/add-expense')}
      >
        <Plus className="w-4 h-4" />
        {t('quick_actions.add_expense')}
      </Button>
      <Button
        variant="outline"
        className="flex-1 gap-2"
        onClick={() => navigate('/create-group')}
      >
        <Users className="w-4 h-4" />
        {t('quick_actions.create_group')}
      </Button>
    </div>
  );
}
