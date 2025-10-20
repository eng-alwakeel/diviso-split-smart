import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/safe-tooltip";
import { 
  MapPin, 
  Calendar, 
  Briefcase, 
  AlertTriangle, 
  PiggyBank, 
  CreditCard,
  Users,
  RefreshCw,
  HelpCircle,
  Tag
} from "lucide-react";
import { toast } from "sonner";
import { useGroups } from "@/hooks/useGroups";
import { useCategories } from "@/hooks/useCategories";
import { CreateBudgetData } from "@/hooks/useBudgets";
import { addDays, addWeeks, addMonths, addYears, format } from "date-fns";

interface CreateBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateBudget: (data: CreateBudgetData) => Promise<void>;
  isCreating: boolean;
  groupId?: string; // إضافة معرف المجموعة كخيار
}

const budgetTypes = [
  {
    id: 'monthly' as const,
    name: 'ميزانية شهرية',
    description: 'ميزانية للمصاريف الشهرية العادية',
    icon: CreditCard,
    color: 'bg-blue-50 border-blue-200 text-blue-800',
    suggestedPeriod: 'monthly',
    suggestedAmount: 5000
  },
  {
    id: 'trip' as const,
    name: 'رحلة',
    description: 'ميزانية لرحلة أو سفر',
    icon: MapPin,
    color: 'bg-green-50 border-green-200 text-green-800',
    suggestedPeriod: 'custom',
    suggestedAmount: 10000
  },
  {
    id: 'event' as const,
    name: 'مناسبة',
    description: 'ميزانية لحفل أو مناسبة خاصة',
    icon: Calendar,
    color: 'bg-purple-50 border-purple-200 text-purple-800',
    suggestedPeriod: 'custom',
    suggestedAmount: 8000
  },
  {
    id: 'project' as const,
    name: 'مشروع',
    description: 'ميزانية لمشروع أو استثمار',
    icon: Briefcase,
    color: 'bg-orange-50 border-orange-200 text-orange-800',
    suggestedPeriod: 'quarterly',
    suggestedAmount: 15000
  },
  {
    id: 'emergency' as const,
    name: 'طوارئ',
    description: 'صندوق الطوارئ والحالات غير المتوقعة',
    icon: AlertTriangle,
    color: 'bg-red-50 border-red-200 text-red-800',
    suggestedPeriod: 'yearly',
    suggestedAmount: 20000
  },
  {
    id: 'savings' as const,
    name: 'ادخار',
    description: 'ميزانية للادخار والأهداف طويلة المدى',
    icon: PiggyBank,
    color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    suggestedPeriod: 'yearly',
    suggestedAmount: 12000
  }
];

export function CreateBudgetDialog({ 
  open, 
  onOpenChange, 
  onCreateBudget, 
  isCreating,
  groupId 
}: CreateBudgetDialogProps) {
  const { data: groups = [], isLoading: groupsLoading, error: groupsError, refetch: refetchGroups } = useGroups();
  const { categories = [], isLoading: categoriesLoading } = useCategories();
  const [step, setStep] = useState<'type' | 'details'>('type');
  const [selectedType, setSelectedType] = useState<typeof budgetTypes[0] | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    total_amount: "",
    amount_limit: "",
    period: "monthly" as "weekly" | "monthly" | "yearly" | "quarterly" | "custom",
    start_date: new Date().toISOString().split('T')[0],
    end_date: "",
    group_id: groupId || "",
    category_id: ""
  });

  // حساب تاريخ النهاية تلقائياً عند تغيير الفترة أو تاريخ البداية
  useEffect(() => {
    if (formData.start_date && formData.period !== 'custom') {
      const startDate = new Date(formData.start_date);
      let endDate: Date;

      switch (formData.period) {
        case 'weekly':
          endDate = addWeeks(startDate, 1);
          break;
        case 'monthly':
          endDate = addMonths(startDate, 1);
          break;
        case 'quarterly':
          endDate = addMonths(startDate, 3);
          break;
        case 'yearly':
          endDate = addYears(startDate, 1);
          break;
        default:
          return;
      }

      setFormData(prev => ({
        ...prev,
        end_date: endDate.toISOString().split('T')[0]
      }));
    }
  }, [formData.start_date, formData.period]);

  const handleTypeSelect = (type: typeof budgetTypes[0]) => {
    setSelectedType(type);
    setFormData(prev => ({
      ...prev,
      period: type.suggestedPeriod as any,
      total_amount: type.suggestedAmount.toString(),
      amount_limit: type.suggestedAmount.toString(),
      name: type.name + " - " + new Date().toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })
    }));
    setStep('details');
  };

  const handleSubmit = async () => {
    // التحقق من الحقول المطلوبة
    if (!selectedType || !formData.name || !formData.total_amount || !formData.group_id) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    // التحقق من صحة المبالغ
    const totalAmount = parseFloat(formData.total_amount);
    const limitAmount = formData.amount_limit ? parseFloat(formData.amount_limit) : totalAmount;

    if (totalAmount <= 0) {
      toast.error("يجب أن يكون المبلغ الإجمالي أكبر من صفر");
      return;
    }

    if (limitAmount > totalAmount) {
      toast.error("لا يمكن أن يكون الحد الأقصى أكبر من المبلغ الإجمالي");
      return;
    }

    // التحقق من صحة التواريخ
    if (formData.end_date && formData.start_date >= formData.end_date) {
      toast.error("يجب أن يكون تاريخ النهاية بعد تاريخ البداية");
      return;
    }

    if (groups.length === 0) {
      toast.error("لا توجد مجموعات متاحة. يجب إنشاء مجموعة أولاً");
      return;
    }

    try {
      await onCreateBudget({
        name: formData.name,
        total_amount: totalAmount,
        amount_limit: limitAmount,
        start_date: formData.start_date,
        end_date: formData.end_date || undefined,
        period: formData.period,
        budget_type: selectedType.id,
        group_id: formData.group_id,
        category_id: formData.category_id || undefined
      });

      // إعادة تعيين النموذج
      setStep('type');
      setSelectedType(null);
      setFormData({
        name: "",
        total_amount: "",
        amount_limit: "",
        period: "monthly",
        start_date: new Date().toISOString().split('T')[0],
        end_date: "",
        group_id: groupId || "",
        category_id: ""
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating budget:", error);
      toast.error("فشل في إنشاء الميزانية: " + (error.message || "خطأ غير معروف"));
    }
  };

  const handleBack = () => {
    setStep('type');
    setSelectedType(null);
  };

  const renderTypeSelection = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">اختر نوع الميزانية</h3>
        <p className="text-sm text-muted-foreground">حدد نوع الميزانية للحصول على اقتراحات مخصصة</p>
      </div>
      
      <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto">
        {budgetTypes.map((type) => {
          const IconComponent = type.icon;
          return (
            <Card 
              key={type.id}
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
              onClick={() => handleTypeSelect(type)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${type.color}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{type.name}</h4>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderDetailsForm = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          ← العودة
        </Button>
        <div className="flex items-center gap-2">
          {selectedType && (
            <>
              <selectedType.icon className="h-4 w-4" />
              <span className="font-semibold">{selectedType.name}</span>
            </>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="budget-name">اسم الميزانية *</Label>
        <Input
          id="budget-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="مثال: ميزانية شهر يناير"
          className={!formData.name ? "border-destructive" : ""}
        />
      </div>

      <div>
        <div className="flex items-center gap-2">
          <Label htmlFor="budget-amount">المبلغ الإجمالي *</Label>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>المبلغ الكامل المخصص لهذه الميزانية</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Input
          id="budget-amount"
          type="number"
          min="1"
          value={formData.total_amount}
          onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
          placeholder="0"
          className={!formData.total_amount || parseFloat(formData.total_amount) <= 0 ? "border-destructive" : ""}
        />
      </div>

      <div>
        <div className="flex items-center gap-2">
          <Label htmlFor="budget-limit">الحد الأقصى للإنفاق (اختياري)</Label>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>الحد الأقصى للإنفاق قبل إرسال تنبيه. اتركه فارغاً لاستخدام المبلغ الإجمالي</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Input
          id="budget-limit"
          type="number"
          min="1"
          value={formData.amount_limit}
          onChange={(e) => setFormData({ ...formData, amount_limit: e.target.value })}
          placeholder={`الافتراضي: ${formData.total_amount || '0'} ريال`}
        />
        {formData.amount_limit && formData.total_amount && 
         parseFloat(formData.amount_limit) > parseFloat(formData.total_amount) && (
          <p className="text-sm text-destructive mt-1">
            لا يمكن أن يكون الحد الأقصى أكبر من المبلغ الإجمالي
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="budget-category">الفئة (اختياري)</Label>
        <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
          <SelectTrigger>
            <SelectValue placeholder="اختر الفئة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">بدون فئة</SelectItem>
            {categoriesLoading ? (
              <SelectItem value="" disabled>
                <div className="flex items-center gap-2">
                  <div className="animate-spin">
                    <RefreshCw className="h-4 w-4" />
                  </div>
                  جاري التحميل...
                </div>
              </SelectItem>
            ) : (
              categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    <span>{category.name_ar}</span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="budget-group">المجموعة</Label>
        <Select value={formData.group_id} onValueChange={(value) => setFormData({ ...formData, group_id: value })}>
          <SelectTrigger>
            <SelectValue placeholder="اختر المجموعة" />
          </SelectTrigger>
          <SelectContent>
            {groupsLoading ? (
              <SelectItem value="" disabled>
                <div className="flex items-center gap-2">
                  <div className="animate-spin">
                    <RefreshCw className="h-4 w-4" />
                  </div>
                  جاري التحميل...
                </div>
              </SelectItem>
            ) : groupsError ? (
              <SelectItem value="" disabled>
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  خطأ في تحميل المجموعات
                </div>
              </SelectItem>
            ) : groups.length === 0 ? (
              <SelectItem value="" disabled>
                لا توجد مجموعات متاحة
              </SelectItem>
            ) : (
              groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{group.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {group.member_count || 0} عضو
                    </Badge>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {groupsError && (
          <div className="flex items-center gap-2 mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetchGroups()}
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              إعادة المحاولة
            </Button>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2">
          <Label htmlFor="budget-period">الفترة</Label>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>فترة الميزانية. سيتم حساب تاريخ النهاية تلقائياً</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Select 
          value={formData.period} 
          onValueChange={(value: "weekly" | "monthly" | "yearly" | "quarterly" | "custom") => 
            setFormData({ ...formData, period: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">
              <div className="flex flex-col">
                <span>أسبوعية</span>
                <span className="text-xs text-muted-foreground">7 أيام</span>
              </div>
            </SelectItem>
            <SelectItem value="monthly">
              <div className="flex flex-col">
                <span>شهرية</span>
                <span className="text-xs text-muted-foreground">شهر واحد</span>
              </div>
            </SelectItem>
            <SelectItem value="quarterly">
              <div className="flex flex-col">
                <span>ربع سنوية</span>
                <span className="text-xs text-muted-foreground">3 أشهر</span>
              </div>
            </SelectItem>
            <SelectItem value="yearly">
              <div className="flex flex-col">
                <span>سنوية</span>
                <span className="text-xs text-muted-foreground">سنة واحدة</span>
              </div>
            </SelectItem>
            <SelectItem value="custom">
              <div className="flex flex-col">
                <span>مخصصة</span>
                <span className="text-xs text-muted-foreground">تحديد يدوي للفترة</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start-date">تاريخ البداية *</Label>
          <Input
            id="start-date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            className={!formData.start_date ? "border-destructive" : ""}
          />
        </div>
        <div>
          <Label htmlFor="end-date">
            تاريخ النهاية 
            {formData.period !== 'custom' && (
              <span className="text-xs text-muted-foreground ml-1">(محسوب تلقائياً)</span>
            )}
          </Label>
          <Input
            id="end-date"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            disabled={formData.period !== 'custom'}
            className={formData.period !== 'custom' ? "opacity-60" : ""}
          />
          {formData.end_date && formData.start_date >= formData.end_date && (
            <p className="text-sm text-destructive mt-1">
              يجب أن يكون تاريخ النهاية بعد تاريخ البداية
            </p>
          )}
        </div>
      </div>

      {/* معاينة الميزانية */}
      {formData.name && formData.total_amount && (
        <div className="bg-muted/50 rounded-lg p-3 border">
          <h4 className="font-medium mb-2">معاينة الميزانية:</h4>
          <div className="text-sm space-y-1">
            <p><span className="font-medium">الاسم:</span> {formData.name}</p>
            <p><span className="font-medium">المبلغ:</span> {formData.total_amount} ريال</p>
            <p><span className="font-medium">الفترة:</span> 
              {formData.start_date && format(new Date(formData.start_date), 'dd/MM/yyyy')}
              {formData.end_date && ` - ${format(new Date(formData.end_date), 'dd/MM/yyyy')}`}
            </p>
          </div>
        </div>
      )}

      <Button 
        onClick={handleSubmit} 
        className="w-full"
        disabled={isCreating || !formData.group_id || groups.length === 0}
      >
        {isCreating ? "جاري الإنشاء..." : "إنشاء الميزانية"}
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {step === 'type' ? 'إنشاء ميزانية جديدة' : 'تفاصيل الميزانية'}
          </DialogTitle>
        </DialogHeader>
        
        {step === 'type' ? renderTypeSelection() : renderDetailsForm()}
      </DialogContent>
    </Dialog>
  );
}