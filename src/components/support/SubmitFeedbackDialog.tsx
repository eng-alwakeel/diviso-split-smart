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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useCreateFeedback, type FeedbackPaymentIntent, type FeedbackCategory } from '@/hooks/useFeedback';

interface SubmitFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categories: FeedbackCategory[] = [
  'credits',
  'groups',
  'recommendations',
  'payment',
  'account',
  'technical',
];

export function SubmitFeedbackDialog({ open, onOpenChange }: SubmitFeedbackDialogProps) {
  const { t } = useTranslation('support');
  const createFeedback = useCreateFeedback();
  
  const [idea, setIdea] = useState('');
  const [reason, setReason] = useState('');
  const [wouldPay, setWouldPay] = useState<FeedbackPaymentIntent>('maybe');
  const [category, setCategory] = useState<FeedbackCategory>('groups');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!idea.trim()) return;

    await createFeedback.mutateAsync({
      idea: idea.trim(),
      reason: reason.trim() || undefined,
      would_pay: wouldPay,
      category,
    });

    // Reset form
    setIdea('');
    setReason('');
    setWouldPay('maybe');
    setCategory('groups');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('feedback.title')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="idea">{t('feedback.idea')}</Label>
            <Input
              id="idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder={t('feedback.idea_placeholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">{t('feedback.reason')}</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('feedback.reason_placeholder')}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('feedback.would_pay')}</Label>
            <RadioGroup
              value={wouldPay}
              onValueChange={(v) => setWouldPay(v as FeedbackPaymentIntent)}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="yes" id="pay-yes" />
                <Label htmlFor="pay-yes" className="font-normal cursor-pointer">
                  {t('feedback.would_pay_yes')}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="no" id="pay-no" />
                <Label htmlFor="pay-no" className="font-normal cursor-pointer">
                  {t('feedback.would_pay_no')}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="maybe" id="pay-maybe" />
                <Label htmlFor="pay-maybe" className="font-normal cursor-pointer">
                  {t('feedback.would_pay_maybe')}
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">{t('create_ticket.category')}</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as FeedbackCategory)}>
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

          <Button
            type="submit"
            className="w-full"
            disabled={createFeedback.isPending || !idea.trim()}
          >
            {createFeedback.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t('feedback.submit')
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
