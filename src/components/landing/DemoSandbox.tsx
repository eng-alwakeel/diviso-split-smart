import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, Plus, Minus, Trash2, ArrowRight, ArrowLeft, 
  Sparkles, RotateCcw, CheckCircle2, TrendingUp, TrendingDown,
  ExternalLink
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface DemoExpense {
  id: string;
  name: string;
  amount: number;
  payerId: number; // index in members array
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

const DEFAULT_MEMBERS_AR = ["أحمد", "خالد", "سارة", "نورة"];
const DEFAULT_MEMBERS_EN = ["Ahmed", "Khaled", "Sara", "Noura"];

const createDefaultExpenses = (isAr: boolean): DemoExpense[] => [
  { id: "1", name: isAr ? "فندق" : "Hotel", amount: 500, payerId: 0 },
  { id: "2", name: isAr ? "بنزين" : "Gas", amount: 180, payerId: 1 },
  { id: "3", name: isAr ? "عشاء" : "Dinner", amount: 240, payerId: 2 },
];

let expenseCounter = 4;

export const DemoSandbox = () => {
  const { t, i18n } = useTranslation('landing');
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  const isAr = i18n.language === 'ar';

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [groupName, setGroupName] = useState(isAr ? "رحلة نهاية الأسبوع" : "Weekend Trip");
  const [members, setMembers] = useState<string[]>(isAr ? [...DEFAULT_MEMBERS_AR] : [...DEFAULT_MEMBERS_EN]);
  const [expenses, setExpenses] = useState<DemoExpense[]>(createDefaultExpenses(isAr));

  // Balance calculations
  const results = useMemo(() => {
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const perPerson = total / members.length;
    
    // Calculate how much each person paid
    const paid: number[] = members.map(() => 0);
    expenses.forEach(e => {
      if (e.payerId < members.length) {
        paid[e.payerId] += e.amount;
      }
    });

    // Balances: positive = owed money, negative = owes money
    const balances = members.map((name, i) => ({
      name,
      paid: paid[i],
      balance: paid[i] - perPerson,
    }));

    // Greedy settlement algorithm
    const settlements: Settlement[] = [];
    const bals = balances.map(b => ({ ...b }));
    
    const debtors = bals.filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance);
    const creditors = bals.filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance);
    
    let di = 0, ci = 0;
    while (di < debtors.length && ci < creditors.length) {
      const amount = Math.min(-debtors[di].balance, creditors[ci].balance);
      if (amount > 0.01) {
        settlements.push({
          from: debtors[di].name,
          to: creditors[ci].name,
          amount: Math.round(amount * 100) / 100,
        });
      }
      debtors[di].balance += amount;
      creditors[ci].balance -= amount;
      if (Math.abs(debtors[di].balance) < 0.01) di++;
      if (Math.abs(creditors[ci].balance) < 0.01) ci++;
    }

    return { total, perPerson, balances, settlements };
  }, [expenses, members]);

  // Member management
  const addMember = () => {
    if (members.length >= 8) return;
    const newName = isAr 
      ? `عضو ${members.length + 1}` 
      : `Member ${members.length + 1}`;
    setMembers([...members, newName]);
  };

  const removeMember = (index: number) => {
    if (members.length <= 2) return;
    const newMembers = members.filter((_, i) => i !== index);
    // Fix expense payerIds
    const newExpenses = expenses.map(e => ({
      ...e,
      payerId: e.payerId === index ? 0 : e.payerId > index ? e.payerId - 1 : e.payerId,
    }));
    setMembers(newMembers);
    setExpenses(newExpenses);
  };

  const updateMember = (index: number, name: string) => {
    const newMembers = [...members];
    newMembers[index] = name;
    setMembers(newMembers);
  };

  // Expense management
  const addExpense = () => {
    if (expenses.length >= 8) return;
    setExpenses([...expenses, {
      id: String(expenseCounter++),
      name: "",
      amount: 0,
      payerId: 0,
    }]);
  };

  const removeExpense = (id: string) => {
    if (expenses.length <= 1) return;
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const updateExpense = (id: string, field: keyof DemoExpense, value: string | number) => {
    setExpenses(expenses.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const resetWizard = () => {
    setStep(1);
    setGroupName(isAr ? "رحلة نهاية الأسبوع" : "Weekend Trip");
    setMembers(isAr ? [...DEFAULT_MEMBERS_AR] : [...DEFAULT_MEMBERS_EN]);
    setExpenses(createDefaultExpenses(isAr));
  };

  const progressValue = (step / 4) * 100;

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;
  const NextIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section className="py-16 lg:py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">{t('demoSandbox.badge')}</span>
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
              {t('demoSandbox.title')}
            </h2>
            <p className="text-muted-foreground text-lg">
              {t('demoSandbox.subtitle')}
            </p>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <Progress value={progressValue} className="h-2 bg-muted" />
            <div className="flex justify-between mt-2">
              {[1, 2, 3, 4].map(s => (
                <span
                  key={s}
                  className={cn(
                    "text-xs font-medium transition-colors",
                    step >= s ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {t(`demoSandbox.stepLabels.step${s}`)}
                </span>
              ))}
            </div>
          </div>

          {/* Card */}
          <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
            {/* Step 1: Group Setup */}
            {step === 1 && (
              <div className="p-6 md:p-8 animate-fade-in space-y-5">
                <h3 className="text-lg font-semibold">{t('demoSandbox.step1.title')}</h3>
                
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">
                    {t('demoSandbox.step1.groupName')}
                  </label>
                  <Input
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    className="bg-muted/50"
                    placeholder={isAr ? "رحلة نهاية الأسبوع" : "Weekend Trip"}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-muted-foreground">
                      {t('demoSandbox.step1.members')} ({members.length})
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={addMember}
                      disabled={members.length >= 8}
                      className="text-primary hover:text-primary"
                    >
                      <Plus className="w-4 h-4 me-1" />
                      {t('demoSandbox.step1.addMember')}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {members.map((m, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                          {i + 1}
                        </div>
                        <Input
                          value={m}
                          onChange={e => updateMember(i, e.target.value)}
                          className="bg-muted/50 flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMember(i)}
                          disabled={members.length <= 2}
                          className="text-muted-foreground hover:text-destructive shrink-0 h-8 w-8"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full py-5 text-base font-semibold"
                  onClick={() => setStep(2)}
                >
                  {t('demoSandbox.next')}
                  <NextIcon className="w-4 h-4 ms-2" />
                </Button>
              </div>
            )}

            {/* Step 2: Expenses */}
            {step === 2 && (
              <div className="p-6 md:p-8 animate-fade-in space-y-4">
                <h3 className="text-lg font-semibold">{t('demoSandbox.step2.title')}</h3>
                
                <div className="space-y-3">
                  {expenses.map(exp => (
                    <div key={exp.id} className="bg-muted/30 rounded-xl p-3 border border-border/50 space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          value={exp.name}
                          onChange={e => updateExpense(exp.id, 'name', e.target.value)}
                          placeholder={t('demoSandbox.step2.expenseName')}
                          className="bg-muted/50 flex-1 text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeExpense(exp.id)}
                          disabled={expenses.length <= 1}
                          className="text-muted-foreground hover:text-destructive h-8 w-8 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Input
                            type="number"
                            value={exp.amount || ''}
                            onChange={e => updateExpense(exp.id, 'amount', Number(e.target.value) || 0)}
                            placeholder="0"
                            className="bg-muted/50 text-sm"
                            min={0}
                          />
                          <span className={cn(
                            "absolute top-1/2 -translate-y-1/2 text-xs text-muted-foreground",
                            isRTL ? "left-3" : "right-3"
                          )}>
                            {t('demoSandbox.currency')}
                          </span>
                        </div>
                        <select
                          value={exp.payerId}
                          onChange={e => updateExpense(exp.id, 'payerId', Number(e.target.value))}
                          className="flex-1 bg-muted/50 border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {members.map((m, i) => (
                            <option key={i} value={i}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={addExpense}
                  disabled={expenses.length >= 8}
                >
                  <Plus className="w-4 h-4 me-2" />
                  {t('demoSandbox.step2.addExpense')}
                </Button>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 py-5"
                    onClick={() => setStep(1)}
                  >
                    <BackIcon className="w-4 h-4 me-2" />
                    {t('demoSandbox.back')}
                  </Button>
                  <Button
                    className="flex-1 py-5 font-semibold"
                    onClick={() => setStep(3)}
                    disabled={expenses.every(e => e.amount === 0)}
                  >
                    {t('demoSandbox.next')}
                    <NextIcon className="w-4 h-4 ms-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Results */}
            {step === 3 && (
              <div className="p-6 md:p-8 animate-fade-in space-y-5">
                <h3 className="text-lg font-semibold">{t('demoSandbox.step3.title')}</h3>
                
                {/* Summary row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/30 rounded-xl p-4 text-center border border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">{t('demoSandbox.step3.total')}</p>
                    <p className="text-2xl font-bold text-primary">
                      {results.total.toLocaleString()} <span className="text-sm">{t('demoSandbox.currency')}</span>
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-4 text-center border border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">{t('demoSandbox.step3.perPerson')}</p>
                    <p className="text-2xl font-bold">
                      {results.perPerson.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-sm text-muted-foreground">{t('demoSandbox.currency')}</span>
                    </p>
                  </div>
                </div>

                {/* Balances */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">{t('demoSandbox.step3.balances')}</p>
                  <div className="space-y-2">
                    {results.balances.map((b, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex items-center justify-between rounded-xl px-4 py-3 border",
                          b.balance > 0.01
                            ? "bg-status-positive-bg/50 border-status-positive/20"
                            : b.balance < -0.01
                            ? "bg-status-negative-bg/50 border-status-negative/20"
                            : "bg-muted/30 border-border/50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {b.balance > 0.01 ? (
                            <TrendingUp className="w-4 h-4 text-status-positive" />
                          ) : b.balance < -0.01 ? (
                            <TrendingDown className="w-4 h-4 text-status-negative" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className="font-medium">{b.name}</span>
                        </div>
                        <span className={cn(
                          "font-bold text-sm",
                          b.balance > 0.01 ? "text-status-positive" : b.balance < -0.01 ? "text-status-negative" : "text-muted-foreground"
                        )}>
                          {b.balance > 0.01 ? "+" : ""}{b.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} {t('demoSandbox.currency')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Settlements */}
                {results.settlements.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">{t('demoSandbox.step3.settlements')}</p>
                    <div className="space-y-2">
                      {results.settlements.map((s, i) => (
                        <div key={i} className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between">
                          <span className="text-sm">
                            <span className="font-semibold">{s.from}</span>
                            {" → "}
                            <span className="font-semibold">{s.to}</span>
                          </span>
                          <span className="font-bold text-primary text-sm">
                            {s.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {t('demoSandbox.currency')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1 py-5" onClick={() => setStep(2)}>
                    <BackIcon className="w-4 h-4 me-2" />
                    {t('demoSandbox.back')}
                  </Button>
                  <Button className="flex-1 py-5 font-semibold" onClick={() => setStep(4)}>
                    {t('demoSandbox.step3.saveGroup')}
                    <NextIcon className="w-4 h-4 ms-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: CTA */}
            {step === 4 && (
              <div className="p-6 md:p-8 animate-fade-in text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold">{t('demoSandbox.step4.title')}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
                  {t('demoSandbox.step4.description')}
                </p>

                <ul className="text-sm text-start space-y-2 max-w-xs mx-auto">
                  {(['save', 'invite', 'track', 'addLater'] as const).map(k => (
                    <li key={k} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <span>{t(`demoSandbox.step4.benefits.${k}`)}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  size="lg"
                  className="w-full py-6 text-lg font-semibold hover:scale-[1.02] transition-transform"
                  onClick={() => navigate('/auth')}
                >
                  <Sparkles className="w-5 h-5 me-2" />
                  {t('demoSandbox.step4.cta')}
                </Button>

                <div className="flex flex-col gap-2">
                  <Button variant="ghost" onClick={resetWizard} className="text-muted-foreground">
                    <RotateCcw className="w-4 h-4 me-2" />
                    {t('demoSandbox.step4.tryAgain')}
                  </Button>
                  <Button
                    variant="link"
                    onClick={() => navigate('/launch')}
                    className="text-primary text-sm"
                  >
                    <ExternalLink className="w-4 h-4 me-1" />
                    {t('demoSandbox.step4.tryScenarios')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
