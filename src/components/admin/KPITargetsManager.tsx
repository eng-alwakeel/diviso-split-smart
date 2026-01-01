import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { 
  useKPITargets, 
  useUpdateKPITarget, 
  useCreateKPITarget,
  useDeleteKPITarget,
  KPITarget 
} from "@/hooks/useAdminKPITargets";
import { Target, Edit2, Trash2, Plus, Save } from "lucide-react";
import { cn } from "@/lib/utils";

const periodLabels: Record<string, string> = {
  daily: 'يومي',
  weekly: 'أسبوعي',
  monthly: 'شهري',
  quarterly: 'ربع سنوي',
  yearly: 'سنوي',
};

const typeLabels: Record<string, string> = {
  minimum: 'حد أدنى',
  maximum: 'حد أقصى',
  exact: 'قيمة محددة',
};

export const KPITargetsManager = () => {
  const { data: targets, isLoading } = useKPITargets();
  const updateTarget = useUpdateKPITarget();
  const createTarget = useCreateKPITarget();
  const deleteTarget = useDeleteKPITarget();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTarget, setNewTarget] = useState<{
    kpi_name: string;
    target_value: number;
    target_type: 'minimum' | 'maximum' | 'exact';
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    description: string;
    description_ar: string;
  }>({
    kpi_name: '',
    target_value: 0,
    target_type: 'minimum',
    period: 'monthly',
    description: '',
    description_ar: '',
  });

  const handleEdit = (target: KPITarget) => {
    setEditingId(target.id);
    setEditValue(target.target_value.toString());
  };

  const handleSave = async (id: string) => {
    try {
      await updateTarget.mutateAsync({ id, target_value: parseFloat(editValue) });
      toast({ title: "تم تحديث الهدف بنجاح" });
      setEditingId(null);
    } catch (error) {
      toast({ title: "خطأ في تحديث الهدف", variant: "destructive" });
    }
  };

  const handleCreate = async () => {
    try {
      await createTarget.mutateAsync({
        ...newTarget,
        created_by: null,
      });
      toast({ title: "تم إنشاء الهدف بنجاح" });
      setIsCreateOpen(false);
      setNewTarget({
        kpi_name: '',
        target_value: 0,
        target_type: 'minimum',
        period: 'monthly',
        description: '',
        description_ar: '',
      });
    } catch (error) {
      toast({ title: "خطأ في إنشاء الهدف", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الهدف؟')) return;
    
    try {
      await deleteTarget.mutateAsync(id);
      toast({ title: "تم حذف الهدف بنجاح" });
    } catch (error) {
      toast({ title: "خطأ في حذف الهدف", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>أهداف المقاييس (KPIs)</CardTitle>
              <CardDescription>حدد أهدافك لمتابعة التقدم</CardDescription>
            </div>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                إضافة هدف جديد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة هدف جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اسم المقياس</Label>
                    <Input
                      value={newTarget.kpi_name}
                      onChange={(e) => setNewTarget({ ...newTarget, kpi_name: e.target.value })}
                      placeholder="مثال: conversion_rate"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>القيمة المستهدفة</Label>
                    <Input
                      type="number"
                      value={newTarget.target_value}
                      onChange={(e) => setNewTarget({ ...newTarget, target_value: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نوع الهدف</Label>
                    <Select
                      value={newTarget.target_type}
                      onValueChange={(v: 'minimum' | 'maximum' | 'exact') => setNewTarget({ ...newTarget, target_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minimum">حد أدنى</SelectItem>
                        <SelectItem value="maximum">حد أقصى</SelectItem>
                        <SelectItem value="exact">قيمة محددة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>الفترة</Label>
                    <Select
                      value={newTarget.period}
                      onValueChange={(v: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly') => setNewTarget({ ...newTarget, period: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">يومي</SelectItem>
                        <SelectItem value="weekly">أسبوعي</SelectItem>
                        <SelectItem value="monthly">شهري</SelectItem>
                        <SelectItem value="quarterly">ربع سنوي</SelectItem>
                        <SelectItem value="yearly">سنوي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>الوصف بالعربية</Label>
                  <Input
                    value={newTarget.description_ar || ''}
                    onChange={(e) => setNewTarget({ ...newTarget, description_ar: e.target.value })}
                    placeholder="وصف المقياس"
                  />
                </div>
                <Button onClick={handleCreate} className="w-full" disabled={createTarget.isPending}>
                  {createTarget.isPending ? 'جاري الإنشاء...' : 'إنشاء الهدف'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المقياس</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الفترة</TableHead>
                <TableHead>الهدف</TableHead>
                <TableHead className="w-24">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {targets?.map((target) => (
                <TableRow key={target.id}>
                  <TableCell className="font-mono text-sm">
                    {target.kpi_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {target.description_ar || target.description || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      target.target_type === 'maximum' && 'border-red-500 text-red-600',
                      target.target_type === 'minimum' && 'border-emerald-500 text-emerald-600',
                      target.target_type === 'exact' && 'border-blue-500 text-blue-600',
                    )}>
                      {typeLabels[target.target_type]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {periodLabels[target.period]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {editingId === target.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-24 h-8"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleSave(target.id)}
                          disabled={updateTarget.isPending}
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <span className="font-semibold">
                        {target.target_value.toLocaleString('ar-SA')}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleEdit(target)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(target.id)}
                        disabled={deleteTarget.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
