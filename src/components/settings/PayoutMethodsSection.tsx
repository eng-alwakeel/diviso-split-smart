import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMyPayoutMethods, usePayoutMethodMutations, maskAccountValue, getMethodIcon, getMethodLabel } from "@/hooks/usePayoutMethods";
import { PayoutMethodFormDialog } from "./PayoutMethodFormDialog";
import { Plus, Copy, Pencil, Trash2, Wallet, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { PayoutMethod } from "@/hooks/usePayoutMethods";

export function PayoutMethodsSection() {
  const { data: methods = [], isLoading } = useMyPayoutMethods();
  const { deleteMethod } = usePayoutMethodMutations();
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PayoutMethod | null>(null);

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value);
    toast({ title: "تم النسخ", description: "تم نسخ رقم الحساب." });
  };

  const handleEdit = (method: PayoutMethod) => {
    setEditingMethod(method);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditingMethod(null);
    setFormOpen(true);
  };

  return (
    <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-foreground">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-accent" />
            طرق الاستلام
          </div>
          <Button variant="outline" size="sm" onClick={handleAdd} className="gap-2">
            <Plus className="w-4 h-4" />
            إضافة
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="text-center text-sm text-muted-foreground py-6">جارٍ التحميل...</div>
        ) : methods.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <Wallet className="w-10 h-10 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground">لم تضف طرق استلام بعد</p>
            <p className="text-xs text-muted-foreground">أضف حسابك البنكي أو STC لتسهيل استلام المدفوعات</p>
          </div>
        ) : (
          methods.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-background/50">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-lg shrink-0">
                {getMethodIcon(m.method_type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold truncate">{m.label}</span>
                  {m.is_default && (
                    <Badge variant="outline" className="text-xs border-accent/50 text-accent bg-accent/10 gap-1">
                      <Star className="w-3 h-3" />
                      افتراضي
                    </Badge>
                  )}
                </div>
                {m.account_name && (
                  <p className="text-xs text-muted-foreground truncate">{m.account_name}</p>
                )}
                <p className="text-xs text-muted-foreground font-mono" dir="ltr">
                  {maskAccountValue(m.account_value)}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy(m.account_value)} title="نسخ">
                  <Copy className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(m)} title="تعديل">
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="حذف">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>حذف طريقة الاستلام</AlertDialogTitle>
                      <AlertDialogDescription>هل أنت متأكد من حذف "{m.label}"؟ لا يمكن التراجع.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMethod.mutate(m.id)} className="bg-destructive hover:bg-destructive/90">حذف</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))
        )}

        {methods.length > 0 && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            🔒 طرق الاستلام تظهر فقط لأعضاء مجموعاتك المشتركة
          </p>
        )}
      </CardContent>

      <PayoutMethodFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingMethod={editingMethod}
      />
    </Card>
  );
}
