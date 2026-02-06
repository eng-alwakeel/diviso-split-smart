import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, DollarSign, Clock, Users } from 'lucide-react';
import { useMemberRatings } from '@/hooks/useMemberRatings';

interface MemberToRate {
  user_id: string;
  display_name: string | null;
  name: string | null;
  avatar_url: string | null;
}

interface RatingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  member: MemberToRate;
  onRatingSubmitted?: () => void;
}

const StarRating = ({
  value,
  onChange,
  label,
  icon: Icon
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
  icon: React.ElementType;
}) => {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm">
        <Icon className="w-4 h-4 text-muted-foreground" />
        {label}
      </Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="p-1 transition-transform hover:scale-110"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
          >
            <Star
              className={`w-7 h-7 transition-colors ${
                star <= (hovered || value)
                  ? 'text-yellow-500 fill-yellow-500'
                  : 'text-muted-foreground/30'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export const RatingSheet = ({
  open,
  onOpenChange,
  groupId,
  member,
  onRatingSubmitted
}: RatingSheetProps) => {
  const { submitRating, submitting } = useMemberRatings(groupId);
  
  const [financial, setFinancial] = useState(0);
  const [time, setTime] = useState(0);
  const [cooperation, setCooperation] = useState(0);
  const [comment, setComment] = useState('');

  const displayName = member.display_name || member.name || 'العضو';
  const initials = displayName.slice(0, 2).toUpperCase();

  const canSubmit = financial > 0 && time > 0 && cooperation > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const success = await submitRating(member.user_id, {
      financial_commitment: financial,
      time_commitment: time,
      cooperation: cooperation,
      internal_comment: comment || undefined
    });

    if (success) {
      // Reset form
      setFinancial(0);
      setTime(0);
      setCooperation(0);
      setComment('');
      onOpenChange(false);
      onRatingSubmitted?.();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <SheetHeader className="text-center pb-4">
          <SheetTitle>تقييم العضو</SheetTitle>
          <SheetDescription>
            قيّم أداء هذا العضو في المجموعة
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Member Info */}
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
            <Avatar className="w-12 h-12">
              {member.avatar_url ? (
                <AvatarImage src={member.avatar_url} alt={displayName} />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <p className="font-semibold">{displayName}</p>
              <p className="text-sm text-muted-foreground">عضو في المجموعة</p>
            </div>
          </div>

          {/* Rating Criteria */}
          <div className="space-y-6">
            <StarRating
              value={financial}
              onChange={setFinancial}
              label="الالتزام المالي"
              icon={DollarSign}
            />
            
            <StarRating
              value={time}
              onChange={setTime}
              label="الالتزام بالوقت"
              icon={Clock}
            />
            
            <StarRating
              value={cooperation}
              onChange={setCooperation}
              label="التعاون"
              icon={Users}
            />
          </div>

          {/* Optional Comment */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              تعليق (اختياري - لن يظهر للأعضاء)
            </Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="أضف ملاحظاتك الخاصة..."
              className="resize-none"
              rows={3}
            />
          </div>
        </div>

        <SheetFooter className="flex-col gap-2 sm:flex-col pt-4">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="w-full"
            variant="hero"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'إرسال التقييم'
            )}
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            className="w-full"
            disabled={submitting}
          >
            إلغاء
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
