import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";

interface CreateVoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (title: string, options: string[], closesAt?: string) => Promise<void>;
  isCreating: boolean;
  initialTitle?: string;
  initialOptions?: string[];
}

export function CreateVoteDialog({
  open,
  onOpenChange,
  onConfirm,
  isCreating,
  initialTitle,
  initialOptions,
}: CreateVoteDialogProps) {
  const { t } = useTranslation('plans');
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '']);

  useEffect(() => {
    if (open) {
      setTitle(initialTitle || '');
      setOptions(
        initialOptions && initialOptions.length >= 2
          ? initialOptions
          : ['', '', '']
      );
    }
  }, [open, initialTitle, initialOptions]);

  const addOption = () => {
    if (options.length < 8) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (idx: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== idx));
    }
  };

  const updateOption = (idx: number, value: string) => {
    const updated = [...options];
    updated[idx] = value;
    setOptions(updated);
  };

  const validOptions = options.filter(o => o.trim().length > 0);
  const canSubmit = title.trim().length > 0 && validOptions.length >= 2;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onConfirm(title.trim(), validOptions);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('votes.create_title')}</DialogTitle>
          <DialogDescription>{t('votes.create_desc')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Vote Title */}
          <div className="space-y-2">
            <Label>{t('votes.vote_title')}</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t('votes.vote_title_placeholder')}
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <Label>{t('votes.options_label')}</Label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  value={opt}
                  onChange={e => updateOption(idx, e.target.value)}
                  placeholder={`${t('votes.option')} ${idx + 1}`}
                  className="flex-1"
                />
                {options.length > 2 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-9 w-9"
                    onClick={() => removeOption(idx)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            {options.length < 8 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={addOption}
                className="text-xs gap-1"
              >
                <Plus className="w-3 h-3" />
                {t('votes.add_option')}
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isCreating}
            className="w-full"
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 animate-spin ltr:mr-2 rtl:ml-2" />
            ) : null}
            {isCreating ? t('votes.creating') : t('votes.create_confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
