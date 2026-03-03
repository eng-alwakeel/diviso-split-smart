import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { usePayoutMethodMutations, METHOD_TYPE_OPTIONS, type PayoutMethod } from "@/hooks/usePayoutMethods";
import { Save } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingMethod: PayoutMethod | null;
}

export function PayoutMethodFormDialog({ open, onOpenChange, editingMethod }: Props) {
  const { addMethod, updateMethod } = usePayoutMethodMutations();
  const isEdit = !!editingMethod;

  const [form, setForm] = useState({
    method_type: 'iban',
    label: '',
    account_name: '',
    account_value: '',
    note: '',
    is_default: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (editingMethod) {
        setForm({
          method_type: editingMethod.method_type,
          label: editingMethod.label,
          account_name: editingMethod.account_name || '',
          account_value: editingMethod.account_value,
          note: editingMethod.note || '',
          is_default: editingMethod.is_default,
        });
      } else {
        setForm({ method_type: 'iban', label: '', account_name: '', account_value: '', note: '', is_default: false });
      }
      setErrors({});
    }
  }, [open, editingMethod]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.label.trim()) e.label = 'مطلوب';
    if (!form.account_value.trim()) e.account_value = 'مطلوب';

    if (form.method_type === 'iban' && form.account_value.trim()) {
      const v = form.account_value.trim().toUpperCase();
      if (v.startsWith('SA') && (v.length < 22 || v.length > 24)) {
        e.account_value = 'IBAN سعودي يجب أن يكون 22-24 حرف';
      }
    }

    if ((form.method_type === 'stc_bank' || form.method_type === 'stc_pay') && form.account_value.trim()) {
      const v = form.account_value.trim().replace(/\s/g, '');
      if (!/^[\d+]{10,15}$/.test(v)) {
        e.account_value = 'أدخل رقم جوال صحيح';
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const payload = {
      method_type: form.method_type,
      label: form.label.trim(),
      account_name: form.account_name.trim() || null,
      account_value: form.account_value.trim(),
      note: form.note.trim() || null,
      is_default: form.is_default,
    };

    if (isEdit) {
      await updateMethod.mutateAsync({ id: editingMethod!.id, ...payload });
    } else {
      await addMethod.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const isPending = addMethod.isPending || updateMethod.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'تعديل طريقة الاستلام' : 'إضافة طريقة استلام'}</DialogTitle>
          <DialogDescription>أضف حسابك البنكي أو طريقة التحويل لتسهيل استلام المدفوعات من أعضاء المجموعة.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Method type */}
          <div className="space-y-2">
            <Label>نوع الطريقة</Label>
            <Select value={form.method_type} onValueChange={v => setForm(f => ({ ...f, method_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {METHOD_TYPE_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.icon} {o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Label */}
          <div className="space-y-2">
            <Label>الاسم / البنك</Label>
            <Input
              value={form.label}
              onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              placeholder="مثال: الراجحي، STC Bank"
              className={errors.label ? 'border-destructive' : ''}
            />
            {errors.label && <p className="text-xs text-destructive">{errors.label}</p>}
          </div>

          {/* Account name */}
          <div className="space-y-2">
            <Label>اسم المستفيد <span className="text-muted-foreground text-xs">(اختياري)</span></Label>
            <Input value={form.account_name} onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))} placeholder="الاسم كما يظهر في البنك" />
          </div>

          {/* Account value */}
          <div className="space-y-2">
            <Label>{form.method_type === 'iban' ? 'رقم IBAN' : form.method_type.startsWith('stc') ? 'رقم الجوال' : 'رقم/معرّف الحساب'}</Label>
            <Input
              value={form.account_value}
              onChange={e => setForm(f => ({ ...f, account_value: e.target.value }))}
              placeholder={form.method_type === 'iban' ? 'SA0000000000000000000000' : '05XXXXXXXX'}
              className={errors.account_value ? 'border-destructive' : ''}
              dir="ltr"
            />
            {errors.account_value && <p className="text-xs text-destructive">{errors.account_value}</p>}
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label>ملاحظة <span className="text-muted-foreground text-xs">(اختياري)</span></Label>
            <Input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="مثال: اكتب اسم المجموعة في وصف التحويل" />
          </div>

          {/* Default toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
            <Label className="cursor-pointer">اجعلها الطريقة الافتراضية</Label>
            <Switch checked={form.is_default} onCheckedChange={v => setForm(f => ({ ...f, is_default: v }))} />
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={isPending} className="w-full gap-2">
          <Save className="w-4 h-4" />
          {isPending ? 'جارٍ الحفظ...' : isEdit ? 'تحديث' : 'إضافة'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
