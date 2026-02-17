import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface StepQuickGroupProps {
  onNext: (groupName: string, memberCount: number) => Promise<void>;
}

const MEMBER_OPTIONS = [2, 3, 4, 5];

export const StepQuickGroup: React.FC<StepQuickGroupProps> = ({ onNext }) => {
  const [groupName, setGroupName] = useState('طلعة نهاية الأسبوع');
  const [memberCount, setMemberCount] = useState(3);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!groupName.trim()) return;
    setLoading(true);
    try {
      await onNext(groupName, memberCount);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">أنشئ مجموعتك</h2>
        <p className="text-muted-foreground">اختر اسم وعدد الأشخاص</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-foreground">اسم المجموعة</Label>
          <Input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="text-lg h-12"
            dir="rtl"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-foreground">عدد الأشخاص (معك)</Label>
          <div className="grid grid-cols-4 gap-2">
            {MEMBER_OPTIONS.map((n) => (
              <Button
                key={n}
                variant={memberCount === n ? 'default' : 'outline'}
                className="h-12 text-lg"
                onClick={() => setMemberCount(n)}
              >
                {n === 5 ? '5+' : n}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Button
        size="lg"
        className="w-full text-lg h-14"
        onClick={handleSubmit}
        disabled={!groupName.trim() || loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 ml-2 animate-spin" />
            جاري الإنشاء...
          </>
        ) : (
          'التالي'
        )}
      </Button>
    </div>
  );
};
