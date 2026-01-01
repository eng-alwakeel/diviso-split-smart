import { useState } from 'react';
import { HelpCircle, CreditCard, Users, Lightbulb, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { CreateTicketDialog } from './CreateTicketDialog';
import { SubmitFeedbackDialog } from './SubmitFeedbackDialog';
import type { TicketCategory } from '@/hooks/useTickets';

interface FloatingSupportButtonProps {
  className?: string;
}

export function FloatingSupportButton({ className }: FloatingSupportButtonProps) {
  const { t } = useTranslation('support');
  const [isOpen, setIsOpen] = useState(false);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory>('payment');

  const options = [
    {
      id: 'payment',
      icon: CreditCard,
      label: t('ticket_categories.payment'),
      category: 'payment' as TicketCategory,
      action: 'ticket',
    },
    {
      id: 'groups',
      icon: Users,
      label: t('ticket_categories.groups'),
      category: 'groups' as TicketCategory,
      action: 'ticket',
    },
    {
      id: 'feedback',
      icon: Lightbulb,
      label: t('ticket_categories.feedback'),
      category: 'recommendations' as TicketCategory,
      action: 'feedback',
    },
  ];

  const handleOptionClick = (option: typeof options[0]) => {
    setIsOpen(false);
    if (option.action === 'feedback') {
      setFeedbackDialogOpen(true);
    } else {
      setSelectedCategory(option.category);
      setTicketDialogOpen(true);
    }
  };

  return (
    <>
      <div className={cn('fixed bottom-20 left-4 z-50 md:bottom-6', className)}>
        {/* Options menu */}
        <div
          className={cn(
            'absolute bottom-16 left-0 flex flex-col gap-2 transition-all duration-300',
            isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          )}
        >
          {options.map((option, index) => (
            <Button
              key={option.id}
              variant="secondary"
              size="sm"
              className={cn(
                'justify-start gap-2 shadow-lg transition-all duration-300',
                isOpen && `delay-[${index * 50}ms]`
              )}
              onClick={() => handleOptionClick(option)}
            >
              <option.icon className="h-4 w-4" />
              <span className="text-sm">{option.label}</span>
            </Button>
          ))}
        </div>

        {/* Main button */}
        <Button
          size="icon"
          className={cn(
            'h-14 w-14 rounded-full shadow-lg transition-all duration-300',
            isOpen && 'rotate-45'
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <HelpCircle className="h-6 w-6" />
          )}
        </Button>
      </div>

      <CreateTicketDialog
        open={ticketDialogOpen}
        onOpenChange={setTicketDialogOpen}
        defaultCategory={selectedCategory}
      />

      <SubmitFeedbackDialog
        open={feedbackDialogOpen}
        onOpenChange={setFeedbackDialogOpen}
      />
    </>
  );
}
