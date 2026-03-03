import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserPayoutMethods, maskAccountValue, getMethodIcon } from "@/hooks/usePayoutMethods";
import { Copy, ExternalLink, Star, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userName: string;
}

export function PayoutMethodsSheet({ open, onOpenChange, userId, userName }: Props) {
  const { data: methods = [], isLoading } = useUserPayoutMethods(open ? userId : null);
  const { toast } = useToast();

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value);
    toast({ title: "تم النسخ", description: "تم نسخ رقم الحساب." });
  };

  const handleOpenSTC = (value: string) => {
    // Try STC Pay deep link, fallback to copy
    const phone = value.replace(/\s/g, '');
    const url = `stcpay://transfer?phone=${phone}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-accent" />
            طرق الدفع لـ {userName}
          </DialogTitle>
          <DialogDescription>اختر طريقة الدفع المناسبة وانسخ التفاصيل</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {isLoading ? (
            <div className="text-center text-sm text-muted-foreground py-6">جارٍ التحميل...</div>
          ) : methods.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <Wallet className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground">لا توجد طرق دفع لهذا العضو</p>
              <p className="text-xs text-muted-foreground">اطلب منه إضافتها من صفحة الإعدادات في التطبيق</p>
            </div>
          ) : (
            methods.map((m) => (
              <div key={m.id} className="p-3 rounded-xl border border-border/50 bg-background/50 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getMethodIcon(m.method_type)}</span>
                  <span className="font-bold text-sm">{m.label}</span>
                  {m.is_default && (
                    <Badge variant="outline" className="text-xs border-accent/50 text-accent bg-accent/10 gap-1">
                      <Star className="w-3 h-3" />
                      مفضّل
                    </Badge>
                  )}
                </div>
                {m.account_name && (
                  <p className="text-xs text-muted-foreground">المستفيد: {m.account_name}</p>
                )}
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono flex-1" dir="ltr">{maskAccountValue(m.account_value)}</p>
                  <Button variant="outline" size="sm" className="shrink-0 gap-1.5 text-xs" onClick={() => handleCopy(m.account_value)}>
                    <Copy className="w-3.5 h-3.5" />
                    نسخ
                  </Button>
                </div>
                {(m.method_type === 'stc_bank' || m.method_type === 'stc_pay') && (
                  <Button variant="secondary" size="sm" className="w-full gap-2 text-xs" onClick={() => handleOpenSTC(m.account_value)}>
                    <ExternalLink className="w-3.5 h-3.5" />
                    فتح STC Pay
                  </Button>
                )}
                {m.note && (
                  <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">📝 {m.note}</p>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
