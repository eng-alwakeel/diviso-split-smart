import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dice5 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DiceChatSheet } from './DiceChatSheet';

interface ChatDiceButtonProps {
  groupId: string;
  onDecisionCreated?: () => void;
}

export function ChatDiceButton({ groupId, onDecisionCreated }: ChatDiceButtonProps) {
  const { t } = useTranslation(['dice']);
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = () => {
    setIsOpen(false);
    onDecisionCreated?.();
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="shrink-0"
        title={t('dice:dialog.title')}
      >
        <Dice5 className="w-5 h-5" />
      </Button>

      <DiceChatSheet
        groupId={groupId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
