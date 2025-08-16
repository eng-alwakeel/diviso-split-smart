import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Budget } from "@/hooks/useBudgets";
import { useGroups } from "@/hooks/useGroups";

interface EditBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: Budget | null;
  onUpdate: (id: string, updates: any) => Promise<void>;
  isUpdating: boolean;
}

export function EditBudgetDialog({ 
  open, 
  onOpenChange, 
  budget, 
  onUpdate, 
  isUpdating 
}: EditBudgetDialogProps) {
  const { data: groups = [] } = useGroups();
  const [formData, setFormData] = useState({
    name: "",
    total_amount: "",
    amount_limit: "",
    period: "monthly" as "weekly" | "monthly" | "yearly" | "quarterly" | "custom",
    start_date: "",
    end_date: "",
    group_id: ""
  });

  useEffect(() => {
    if (budget) {
      setFormData({
        name: budget.name,
        total_amount: budget.total_amount.toString(),
        amount_limit: budget.amount_limit?.toString() || "",
        period: budget.period,
        start_date: budget.start_date,
        end_date: budget.end_date || "",
        group_id: budget.group_id
      });
    }
  }, [budget]);

  const handleSubmit = async () => {
    if (!budget) return;
    
    if (!formData.name || !formData.total_amount || !formData.group_id) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    try {
      await onUpdate(budget.id, {
        name: formData.name,
        total_amount: parseFloat(formData.total_amount),
        amount_limit: formData.amount_limit ? parseFloat(formData.amount_limit) : null,
        period: formData.period,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        group_id: formData.group_id
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating budget:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تعديل الميزانية</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-budget-name">اسم الميزانية</Label>
            <Input
              id="edit-budget-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="مثال: ميزانية شهر يناير"
            />
          </div>
          
          <div>
            <Label htmlFor="edit-total-amount">المبلغ الإجمالي</Label>
            <Input
              id="edit-total-amount"
              type="number"
              value={formData.total_amount}
              onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
              placeholder="0"
            />
          </div>
          
          <div>
            <Label htmlFor="edit-amount-limit">الحد الأقصى للإنفاق (اختياري)</Label>
            <Input
              id="edit-amount-limit"
              type="number"
              value={formData.amount_limit}
              onChange={(e) => setFormData({ ...formData, amount_limit: e.target.value })}
              placeholder="0"
            />
          </div>
          
          <div>
            <Label htmlFor="edit-budget-group">المجموعة</Label>
            <Select 
              value={formData.group_id} 
              onValueChange={(value) => setFormData({ ...formData, group_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر المجموعة" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="edit-budget-period">الفترة</Label>
            <Select 
              value={formData.period} 
              onValueChange={(value: "weekly" | "monthly" | "yearly") => 
                setFormData({ ...formData, period: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">أسبوعية</SelectItem>
                <SelectItem value="monthly">شهرية</SelectItem>
                <SelectItem value="yearly">سنوية</SelectItem>
                <SelectItem value="quarterly">ربع سنوية</SelectItem>
                <SelectItem value="custom">مخصصة</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-start-date">تاريخ البداية</Label>
              <Input
                id="edit-start-date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-end-date">تاريخ النهاية</Label>
              <Input
                id="edit-end-date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleSubmit} 
            className="w-full"
            disabled={isUpdating}
          >
            {isUpdating ? "جاري التحديث..." : "تحديث الميزانية"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}