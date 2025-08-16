import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Calculator, 
  Plus, 
  Trash2, 
  AlertCircle,
  CheckCircle2,
  DollarSign
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface MemberBalance {
  id: string;
  name: string;
  phone: string;
  amountPaid: number;
  amountOwed: number;
}

interface InitialBalancesStepProps {
  currency: string;
  onBalancesChange: (balances: MemberBalance[]) => void;
  initialBalances: MemberBalance[];
}

export const InitialBalancesStep = ({ 
  currency, 
  onBalancesChange, 
  initialBalances 
}: InitialBalancesStepProps) => {
  const [enableInitialBalances, setEnableInitialBalances] = useState(false);
  const [balances, setBalances] = useState<MemberBalance[]>(
    initialBalances.length > 0 ? initialBalances : [
      { id: '1', name: '', phone: '', amountPaid: 0, amountOwed: 0 }
    ]
  );

  const addMember = () => {
    const newMember: MemberBalance = {
      id: Date.now().toString(),
      name: '',
      phone: '',
      amountPaid: 0,
      amountOwed: 0
    };
    const newBalances = [...balances, newMember];
    setBalances(newBalances);
    onBalancesChange(enableInitialBalances ? newBalances : []);
  };

  const removeMember = (id: string) => {
    const newBalances = balances.filter(member => member.id !== id);
    setBalances(newBalances);
    onBalancesChange(enableInitialBalances ? newBalances : []);
  };

  const updateMember = (id: string, field: keyof MemberBalance, value: string | number) => {
    const newBalances = balances.map(member => 
      member.id === id ? { ...member, [field]: value } : member
    );
    setBalances(newBalances);
    onBalancesChange(enableInitialBalances ? newBalances : []);
  };

  const calculateNetBalance = (member: MemberBalance) => {
    return member.amountPaid - member.amountOwed;
  };

  const getTotalBalance = () => {
    return balances.reduce((sum, member) => sum + calculateNetBalance(member), 0);
  };

  const isBalanced = () => {
    return Math.abs(getTotalBalance()) < 0.01; // Allow for small floating point errors
  };

  const hasValidMembers = () => {
    return balances.every(member => 
      member.name.trim() !== '' && 
      (member.amountPaid !== 0 || member.amountOwed !== 0)
    );
  };

  const handleToggle = (checked: boolean) => {
    setEnableInitialBalances(checked);
    onBalancesChange(checked ? balances : []);
  };

  const getCurrencySymbol = () => {
    const symbols: { [key: string]: string } = {
      'SAR': 'ر.س',
      'USD': '$',
      'EUR': '€',
      'AED': 'د.إ',
      'KWD': 'د.ك',
      'QAR': 'ر.ق'
    };
    return symbols[currency] || currency;
  };

  return (
    <div className="space-y-6">
      {/* Toggle Switch */}
      <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Calculator className="w-5 h-5 text-accent" />
            الأرصدة الأولية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-foreground font-medium">
                إضافة أرصدة أولية للأعضاء
              </Label>
              <p className="text-sm text-muted-foreground">
                هل يوجد مبالغ مدفوعة مسبقاً أو مستحقة على الأعضاء؟
              </p>
            </div>
            <Switch
              checked={enableInitialBalances}
              onCheckedChange={handleToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* Initial Balances Form */}
      {enableInitialBalances && (
        <div className="space-y-4">
          <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <DollarSign className="w-5 h-5 text-accent" />
                إدخال الأرصدة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {balances.map((member, index) => (
                <div key={member.id} className="p-4 bg-background/30 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">العضو {index + 1}</h4>
                    {balances.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMember(member.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">الاسم</Label>
                      <Input
                        placeholder="اسم العضو"
                        value={member.name}
                        onChange={(e) => updateMember(member.id, 'name', e.target.value)}
                        className="bg-background/50 border-border text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">رقم الجوال (اختياري)</Label>
                      <Input
                        placeholder="966xxxxxxxxx"
                        value={member.phone}
                        onChange={(e) => updateMember(member.id, 'phone', e.target.value)}
                        className="bg-background/50 border-border text-foreground text-left"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">المبلغ المدفوع مسبقاً</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="0"
                          value={member.amountPaid || ''}
                          onChange={(e) => updateMember(member.id, 'amountPaid', Number(e.target.value) || 0)}
                          className="bg-background/50 border-border text-foreground pl-12 text-left"
                          dir="ltr"
                        />
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                          {getCurrencySymbol()}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">المبلغ المستحق عليه</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="0"
                          value={member.amountOwed || ''}
                          onChange={(e) => updateMember(member.id, 'amountOwed', Number(e.target.value) || 0)}
                          className="bg-background/50 border-border text-foreground pl-12 text-left"
                          dir="ltr"
                        />
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                          {getCurrencySymbol()}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">الرصيد الصافي</Label>
                      <div className={`p-2 rounded bg-background/50 border border-border text-center font-medium ${
                        calculateNetBalance(member) > 0 ? 'text-green-500' : 
                        calculateNetBalance(member) < 0 ? 'text-red-500' : 'text-foreground'
                      }`}>
                        {calculateNetBalance(member) > 0 ? '+' : ''}{calculateNetBalance(member).toFixed(2)} {getCurrencySymbol()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addMember}
                className="w-full border-border text-foreground hover:bg-accent/20"
              >
                <Plus className="w-4 h-4 ml-2" />
                إضافة عضو آخر
              </Button>
            </CardContent>
          </Card>

          {/* Balance Summary */}
          <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-foreground">ملخص الأرصدة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-foreground">إجمالي الرصيد:</span>
                  <span className={`font-bold ${
                    Math.abs(getTotalBalance()) < 0.01 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {getTotalBalance().toFixed(2)} {getCurrencySymbol()}
                  </span>
                </div>

                {isBalanced() ? (
                  <Alert className="border-green-500/20 bg-green-500/10">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-700 dark:text-green-300">
                      الأرصدة متوازنة! يمكنك المتابعة لإنشاء المجموعة.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-orange-500/20 bg-orange-500/10">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <AlertDescription className="text-orange-700 dark:text-orange-300">
                      الأرصدة غير متوازنة. يجب أن يكون مجموع الأرصدة = صفر.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="text-sm text-muted-foreground">
                  <p>• الأرقام الموجبة: أشخاص لهم مبالغ (دائنون)</p>
                  <p>• الأرقام السالبة: أشخاص عليهم مبالغ (مدينون)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};