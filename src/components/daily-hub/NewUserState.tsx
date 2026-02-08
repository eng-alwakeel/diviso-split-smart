import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dice5, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function NewUserState() {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-5">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <p className="text-lg font-semibold text-foreground">
            {t('daily_hub.new_user_title')}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => navigate('/dice')}
              className="gap-2"
            >
              <Dice5 className="w-4 h-4" />
              {t('daily_hub.new_user_dice')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
