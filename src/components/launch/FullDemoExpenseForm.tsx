import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { FullDemoExpense, FullDemoMember } from './FullDemoView';

export type SplitType = 'equal' | 'percentage' | 'custom';

interface FullDemoExpenseFormProps {
  members: FullDemoMember[];
  onAddExpense: (expense: Omit<FullDemoExpense, 'id'>) => void;
  expenseCount: number;
  maxExpenses: number;
  currency: string;
}

export const FullDemoExpenseForm: React.FC<FullDemoExpenseFormProps> = ({
  members,
  onAddExpense,
  expenseCount,
  maxExpenses,
  currency,
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidById, setPaidById] = useState(members[0]?.id || '');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [customSplits, setCustomSplits] = useState<Record<string, number>>({});
  const [participatingMembers, setParticipatingMembers] = useState<Set<string>>(
    new Set(members.map(m => m.id))
  );

  // Initialize percentage splits equally
  const percentageSplits = useMemo(() => {
    const equalPercentage = Math.floor(100 / members.length);
    const remainder = 100 - (equalPercentage * members.length);
    
    return members.reduce((acc, member, index) => {
      acc[member.id] = equalPercentage + (index === 0 ? remainder : 0);
      return acc;
    }, {} as Record<string, number>);
  }, [members]);

  const [percentages, setPercentages] = useState<Record<string, number>>(percentageSplits);

  const isValid = useMemo(() => {
    if (!description.trim() || !amount || parseFloat(amount) <= 0) return false;
    if (!paidById) return false;
    
    if (splitType === 'percentage') {
      const total = Object.values(percentages).reduce((sum, p) => sum + p, 0);
      if (total !== 100) return false;
    }
    
    if (splitType === 'custom' && participatingMembers.size < 1) return false;
    
    return true;
  }, [description, amount, paidById, splitType, percentages, participatingMembers]);

  const handleSubmit = () => {
    if (!isValid) return;
    
    let splits: FullDemoExpense['splits'] = undefined;
    
    if (splitType === 'percentage') {
      const amountNum = parseFloat(amount);
      splits = Object.entries(percentages).map(([memberId, percentage]) => ({
        memberId,
        value: (amountNum * percentage) / 100,
      }));
    } else if (splitType === 'custom') {
      const amountNum = parseFloat(amount);
      const perMember = amountNum / participatingMembers.size;
      splits = Array.from(participatingMembers).map(memberId => ({
        memberId,
        value: perMember,
      }));
    }
    
    onAddExpense({
      description: description.trim(),
      amount: parseFloat(amount),
      paidById,
      splitType,
      splits,
    });
    
    // Reset form
    setDescription('');
    setAmount('');
    setSplitType('equal');
    setPercentages(percentageSplits);
    setParticipatingMembers(new Set(members.map(m => m.id)));
  };

  const handlePercentageChange = (memberId: string, value: number) => {
    setPercentages(prev => ({
      ...prev,
      [memberId]: Math.max(0, Math.min(100, value)),
    }));
  };

  const toggleMemberParticipation = (memberId: string) => {
    setParticipatingMembers(prev => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        if (next.size > 1) {
          next.delete(memberId);
        }
      } else {
        next.add(memberId);
      }
      return next;
    });
  };

  const totalPercentage = Object.values(percentages).reduce((sum, p) => sum + p, 0);
  const isDisabled = expenseCount >= maxExpenses;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="expense-description" className="text-sm text-muted-foreground">
          الوصف
        </Label>
        <Input
          id="expense-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="مثال: عشاء، بنزين، حجز..."
          disabled={isDisabled}
          className="text-right"
          dir="rtl"
        />
      </div>
      
      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="expense-amount" className="text-sm text-muted-foreground">
          المبلغ ({currency})
        </Label>
        <Input
          id="expense-amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          disabled={isDisabled}
          min="1"
          max="10000"
          className="text-right"
          dir="ltr"
        />
      </div>
      
      {/* Paid By */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">دفعها</Label>
        <select
          value={paidById}
          onChange={(e) => setPaidById(e.target.value)}
          disabled={isDisabled}
          className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          dir="rtl"
        >
          {members.map(member => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </div>
      
      {/* Split Type */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">طريقة القسمة</Label>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'equal', label: 'بالتساوي', icon: '⚖️' },
            { value: 'percentage', label: 'بالنِسب', icon: '📊' },
            { value: 'custom', label: 'حسب المشاركين', icon: '👥' },
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setSplitType(option.value as SplitType)}
              disabled={isDisabled}
              className={cn(
                "flex-1 min-w-[100px] px-3 py-2 rounded-lg text-sm font-medium transition-all",
                "border",
                splitType === option.value
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {option.icon} {option.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Percentage Split Details */}
      {splitType === 'percentage' && (
        <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground">حدد نسبة كل عضو (المجموع = 100%)</p>
          {members.map(member => (
            <div key={member.id} className="flex items-center justify-between gap-3">
              <span className="text-sm text-foreground">{member.name}</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={percentages[member.id] || 0}
                  onChange={(e) => handlePercentageChange(member.id, parseInt(e.target.value) || 0)}
                  min="0"
                  max="100"
                  className="w-20 h-8 text-center text-sm"
                  dir="ltr"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
          ))}
          <div className={cn(
            "text-xs text-center py-1 rounded",
            totalPercentage === 100 
              ? "text-primary bg-primary/10" 
              : "text-destructive bg-destructive/10"
          )}>
            المجموع: {totalPercentage}%
          </div>
        </div>
      )}
      
      {/* Custom Split (Participating Members) */}
      {splitType === 'custom' && (
        <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground">اختر من يشارك في هذا المصروف</p>
          <div className="flex flex-wrap gap-2">
            {members.map(member => (
              <button
                key={member.id}
                onClick={() => toggleMemberParticipation(member.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
                  participatingMembers.has(member.id)
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-muted/50 border-border text-muted-foreground"
                )}
              >
                {member.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {participatingMembers.size} من {members.length} يشاركون
          </p>
        </div>
      )}
      
      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={!isValid || isDisabled}
        className="w-full gap-2"
      >
        <Plus className="h-4 w-4" />
        إضافة المصروف
      </Button>
      
      {/* Counter */}
      <p className="text-xs text-center text-muted-foreground">
        ({expenseCount}/{maxExpenses} مصاريف)
      </p>
    </div>
  );
};
