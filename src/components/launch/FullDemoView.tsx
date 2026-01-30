import React, { useState, useCallback, useMemo } from 'react';
import { Plus, X, ArrowLeft, ArrowRight, Users, Receipt, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DemoBalanceView } from './DemoBalanceView';
import { FullDemoExpenseForm, type SplitType } from './FullDemoExpenseForm';
import { cn } from '@/lib/utils';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';
import { formatAmount, type MemberBalance } from '@/data/demoScenarios';

export interface FullDemoMember {
  id: string;
  name: string;
}

export interface FullDemoExpense {
  id: string;
  description: string;
  amount: number;
  paidById: string;
  splitType: SplitType;
  splits?: { memberId: string; value: number }[];
}

type FullDemoStep = 'members' | 'expenses' | 'results';

interface FullDemoViewProps {
  scenarioId: string;
  currency: string;
  onCompleted: (durationSeconds: number, membersCount: number, expensesCount: number) => void;
}

const MIN_MEMBERS = 2;
const MAX_MEMBERS = 5;
const MIN_EXPENSES = 1;
const MAX_EXPENSES = 5;

export const FullDemoView: React.FC<FullDemoViewProps> = ({
  scenarioId,
  currency,
  onCompleted,
}) => {
  const { trackEvent } = useGoogleAnalytics();
  const startTimeRef = React.useRef<number>(Date.now());
  
  // State
  const [currentStep, setCurrentStep] = useState<FullDemoStep>('members');
  const [members, setMembers] = useState<FullDemoMember[]>([]);
  const [expenses, setExpenses] = useState<FullDemoExpense[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  
  // Add member
  const handleAddMember = useCallback(() => {
    const name = newMemberName.trim();
    if (!name || members.length >= MAX_MEMBERS) return;
    
    // Check for duplicate names
    if (members.some(m => m.name === name)) return;
    
    setMembers(prev => [
      ...prev,
      { id: `m-${Date.now()}`, name }
    ]);
    setNewMemberName('');
  }, [newMemberName, members]);
  
  // Remove member
  const handleRemoveMember = useCallback((memberId: string) => {
    setMembers(prev => prev.filter(m => m.id !== memberId));
  }, []);
  
  // Add expense
  const handleAddExpense = useCallback((expense: Omit<FullDemoExpense, 'id'>) => {
    if (expenses.length >= MAX_EXPENSES) return;
    
    setExpenses(prev => [
      ...prev,
      { ...expense, id: `e-${Date.now()}` }
    ]);
  }, [expenses.length]);
  
  // Remove expense
  const handleRemoveExpense = useCallback((expenseId: string) => {
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
  }, []);
  
  // Navigate between steps
  const goToStep = useCallback((step: FullDemoStep) => {
    if (step === 'expenses' && currentStep === 'members') {
      trackEvent('full_demo_step_completed', { step: 'members', scenario: scenarioId });
    } else if (step === 'results' && currentStep === 'expenses') {
      trackEvent('full_demo_step_completed', { step: 'expenses', scenario: scenarioId });
      
      // Mark as completed
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      onCompleted(duration, members.length, expenses.length);
    }
    setCurrentStep(step);
  }, [currentStep, trackEvent, scenarioId, members.length, expenses.length, onCompleted]);
  
  // Calculate balances
  const balances = useMemo((): MemberBalance[] => {
    if (expenses.length === 0 || members.length === 0) return [];
    
    const memberBalances: Record<string, { paid: number; owed: number }> = {};
    
    // Initialize all members
    members.forEach(m => {
      memberBalances[m.id] = { paid: 0, owed: 0 };
    });
    
    // Process each expense
    expenses.forEach(expense => {
      // Add what the payer paid
      if (memberBalances[expense.paidById]) {
        memberBalances[expense.paidById].paid += expense.amount;
      }
      
      // Calculate what each member owes
      if (expense.splitType === 'equal') {
        const perPerson = expense.amount / members.length;
        members.forEach(m => {
          memberBalances[m.id].owed += perPerson;
        });
      } else if (expense.splits) {
        expense.splits.forEach(split => {
          if (memberBalances[split.memberId]) {
            memberBalances[split.memberId].owed += split.value;
          }
        });
      }
    });
    
    // Convert to MemberBalance format
    const calculated = members.map(member => ({
      member: { id: member.id, name: member.name, avatar: member.name[0] || '?' },
      paid: memberBalances[member.id].paid,
      owed: memberBalances[member.id].owed,
      net: memberBalances[member.id].paid - memberBalances[member.id].owed,
    }));
    
    return calculated.sort((a, b) => b.net - a.net);
  }, [expenses, members]);
  
  // Total expenses
  const totalExpenses = useMemo(() => 
    expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  
  // Step indicators
  const steps = [
    { key: 'members' as const, label: 'الأعضاء', icon: Users },
    { key: 'expenses' as const, label: 'المصاريف', icon: Receipt },
    { key: 'results' as const, label: 'النتائج', icon: Calculator },
  ];
  
  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.key;
          const isPast = steps.findIndex(s => s.key === currentStep) > index;
          
          return (
            <React.Fragment key={step.key}>
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                isActive && "bg-primary text-primary-foreground",
                isPast && "bg-primary/20 text-primary",
                !isActive && !isPast && "bg-muted text-muted-foreground"
              )}>
                <Icon className="h-3.5 w-3.5" />
                <span>{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "w-6 h-0.5 rounded-full",
                  isPast ? "bg-primary" : "bg-muted"
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      
      {/* Step 1: Members */}
      {currentStep === 'members' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-foreground flex items-center justify-center gap-2">
              <span>👥</span>
              <span>من معك في المجموعة؟</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              أضف من {MIN_MEMBERS} إلى {MAX_MEMBERS} أعضاء
            </p>
          </div>
          
          {/* Add Member Input */}
          <div className="flex gap-2">
            <Input
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="اسم العضو"
              className="flex-1 text-right"
              dir="rtl"
              maxLength={20}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddMember();
                }
              }}
            />
            <Button
              onClick={handleAddMember}
              disabled={!newMemberName.trim() || members.length >= MAX_MEMBERS}
              size="icon"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Members List */}
          <div className="space-y-2">
            {members.map(member => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                    {member.name[0]}
                  </div>
                  <span className="font-medium text-foreground">{member.name}</span>
                </div>
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="p-1.5 hover:bg-destructive/10 rounded-full transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>
          
          {/* Counter */}
          <p className="text-xs text-center text-muted-foreground">
            ({members.length}/{MAX_MEMBERS} أعضاء - الحد الأدنى {MIN_MEMBERS})
          </p>
          
          {/* Next Button */}
          <Button
            onClick={() => goToStep('expenses')}
            disabled={members.length < MIN_MEMBERS}
            className="w-full gap-2"
          >
            <span>التالي</span>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {/* Step 2: Expenses */}
      {currentStep === 'expenses' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-foreground flex items-center justify-center gap-2">
              <span>📝</span>
              <span>أضف المصاريف</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              أضف من {MIN_EXPENSES} إلى {MAX_EXPENSES} مصاريف
            </p>
          </div>
          
          {/* Expense Form */}
          <FullDemoExpenseForm
            members={members}
            onAddExpense={handleAddExpense}
            expenseCount={expenses.length}
            maxExpenses={MAX_EXPENSES}
            currency={currency}
          />
          
          {/* Expenses List */}
          {expenses.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">المصاريف المضافة:</h3>
              {expenses.map(expense => {
                const payer = members.find(m => m.id === expense.paidById);
                return (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{expense.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatAmount(expense.amount, currency)} • دفعها {payer?.name}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveExpense(expense.id)}
                      className="p-1.5 hover:bg-destructive/10 rounded-full transition-colors"
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Navigation Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => goToStep('members')}
              className="flex-1 gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              <span>السابق</span>
            </Button>
            <Button
              onClick={() => goToStep('results')}
              disabled={expenses.length < MIN_EXPENSES}
              className="flex-1 gap-2"
            >
              <span>شوف القسمة</span>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Step 3: Results */}
      {currentStep === 'results' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-foreground flex items-center justify-center gap-2">
              <span>💰</span>
              <span>القسمة النهائية</span>
            </h2>
          </div>
          
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">المجموع</p>
              <p className="font-bold text-foreground">{formatAmount(totalExpenses, currency)}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">عدد المصاريف</p>
              <p className="font-bold text-foreground">{expenses.length}</p>
            </div>
          </div>
          
          {/* Balance View */}
          <DemoBalanceView balances={balances} currency={currency} />
          
          {/* Back Button */}
          <Button
            variant="outline"
            onClick={() => goToStep('expenses')}
            className="w-full gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            <span>تعديل المصاريف</span>
          </Button>
        </div>
      )}
    </div>
  );
};
