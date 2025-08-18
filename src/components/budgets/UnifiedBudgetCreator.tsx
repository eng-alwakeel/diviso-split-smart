import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Calculator, Save, Users } from "lucide-react";
import { toast } from "sonner";
import { useGroups } from "@/hooks/useGroups";
import { useCategories } from "@/hooks/useCategories";

type BudgetCategoryItem = {
  id: string;
  category_id: string;
  category_name: string;
  amount: number;
};

interface UnifiedBudgetCreatorProps {
  onSave?: (budgetData: {
    name: string;
    group_id: string;
    categories: BudgetCategoryItem[];
    total_amount: number;
  }) => Promise<void>;
  isLoading?: boolean;
  groupId?: string;
}

export function UnifiedBudgetCreator({ onSave, isLoading, groupId }: UnifiedBudgetCreatorProps) {
  const { data: groups = [] } = useGroups();
  const { categories = [] } = useCategories();
  
  const [budgetData, setBudgetData] = useState({
    name: "",
    group_id: groupId || "",
  });
  
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategoryItem[]>([]);

  const addCategory = () => {
    const newCategory: BudgetCategoryItem = {
      id: `temp-${Date.now()}`,
      category_id: "",
      category_name: "",
      amount: 0,
    };
    setBudgetCategories([...budgetCategories, newCategory]);
  };

  const updateCategory = (id: string, field: keyof BudgetCategoryItem, value: any) => {
    setBudgetCategories(prev => prev.map(cat => {
      if (cat.id === id) {
        const updated = { ...cat, [field]: value };
        
        // Update category name when category_id changes
        if (field === 'category_id') {
          const categoryData = categories.find(c => c.id === value);
          updated.category_name = categoryData?.name_ar || "";
        }
        
        return updated;
      }
      return cat;
    }));
  };

  const removeCategory = (id: string) => {
    setBudgetCategories(prev => prev.filter(cat => cat.id !== id));
  };

  const totalAmount = budgetCategories.reduce((sum, cat) => sum + cat.amount, 0);

  const handleSave = async () => {
    if (!budgetData.name.trim()) {
      toast.error("يرجى إدخال اسم الميزانية");
      return;
    }

    if (!budgetData.group_id) {
      toast.error("يرجى اختيار المجموعة");
      return;
    }

    if (budgetCategories.length === 0) {
      toast.error("يرجى إضافة فئة واحدة على الأقل");
      return;
    }

    const invalidCategories = budgetCategories.filter(cat => !cat.category_id || cat.amount <= 0);
    if (invalidCategories.length > 0) {
      toast.error("يرجى التأكد من جميع الفئات والمبالغ");
      return;
    }

    try {
      await onSave?.({
        name: budgetData.name,
        group_id: budgetData.group_id,
        categories: budgetCategories,
        total_amount: totalAmount,
      });
      
      // Reset form
      setBudgetData({ name: "", group_id: groupId || "" });
      setBudgetCategories([]);
      toast.success("تم حفظ الميزانية بنجاح");
    } catch (error) {
      console.error("Error saving budget:", error);
      toast.error("حدث خطأ أثناء حفظ الميزانية");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with Total */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">إنشاء ميزانية جديدة</CardTitle>
          <div className="text-4xl font-bold text-primary mt-4">
            {totalAmount.toLocaleString('ar-SA')} ريال
          </div>
          <p className="text-muted-foreground">إجمالي الميزانية</p>
        </CardHeader>
      </Card>

      {/* Budget Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات الميزانية الأساسية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="budget-name">اسم الميزانية</Label>
            <Input
              id="budget-name"
              value={budgetData.name}
              onChange={(e) => setBudgetData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="مثل: ميزانية شهر يناير 2024"
              className="text-lg"
            />
          </div>

          {!groupId && (
            <div>
              <Label htmlFor="budget-group">المجموعة</Label>
              <Select 
                value={budgetData.group_id} 
                onValueChange={(value) => setBudgetData(prev => ({ ...prev, group_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المجموعة" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{group.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {group.member_count || 0} عضو
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget Categories */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>فئات الميزانية</CardTitle>
          <Button onClick={addCategory} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            إضافة فئة
          </Button>
        </CardHeader>
        <CardContent>
          {budgetCategories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد فئات بعد</p>
              <p className="text-sm">ابدأ بإضافة فئة لميزانيتك</p>
            </div>
          ) : (
            <div className="space-y-4">
              {budgetCategories.map((category) => (
                <Card key={category.id} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div>
                      <Label className="text-sm">الفئة</Label>
                      <Select 
                        value={category.category_id} 
                        onValueChange={(value) => updateCategory(category.id, 'category_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الفئة" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories
                            .filter(cat => !budgetCategories.some(bc => bc.category_id === cat.id && bc.id !== category.id))
                            .map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name_ar}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-sm">المبلغ المخصص</Label>
                      <Input
                        type="number"
                        value={category.amount || ""}
                        onChange={(e) => updateCategory(category.id, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="text-lg font-semibold"
                      />
                    </div>
                    
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">النسبة من الإجمالي</p>
                        <p className="text-lg font-semibold text-primary">
                          {totalAmount > 0 ? ((category.amount / totalAmount) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => removeCategory(category.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="sticky bottom-4">
        <Card className="border-2 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الميزانية</p>
                <p className="text-2xl font-bold text-primary">
                  {totalAmount.toLocaleString('ar-SA')} ريال
                </p>
                <p className="text-sm text-muted-foreground">
                  {budgetCategories.length} فئة
                </p>
              </div>
              <Button 
                onClick={handleSave} 
                size="lg" 
                disabled={isLoading || budgetCategories.length === 0}
                className="px-8"
              >
                <Save className="h-4 w-4 mr-2" />
                حفظ الميزانية
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}