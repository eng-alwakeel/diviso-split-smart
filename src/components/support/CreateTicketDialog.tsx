import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useCreateTicket, type TicketCategory } from '@/hooks/useTickets';

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory?: TicketCategory;
}

const categories: TicketCategory[] = [
  'payment',
  'credits',
  'groups',
  'recommendations',
  'account',
  'technical',
];

export function CreateTicketDialog({
  open,
  onOpenChange,
  defaultCategory = 'payment',
}: CreateTicketDialogProps) {
  const { t } = useTranslation('support');
  const createTicket = useCreateTicket();
  
  const [category, setCategory] = useState<TicketCategory>(defaultCategory);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !description.trim()) return;

    await createTicket.mutateAsync({
      category,
      subject: subject.trim(),
      description: description.trim(),
    });

    // Reset form
    setSubject('');
    setDescription('');
    setCategory(defaultCategory);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('create_ticket.title')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">{t('create_ticket.category')}</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as TicketCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {t(`ticket_categories.${cat}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">{t('create_ticket.subject')}</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('create_ticket.subject_placeholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('create_ticket.description')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('create_ticket.description_placeholder')}
              rows={4}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createTicket.isPending || !subject.trim() || !description.trim()}
          >
            {createTicket.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t('create_ticket.submit')
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
