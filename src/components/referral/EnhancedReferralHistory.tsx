import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReferralData } from "@/hooks/useReferrals";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  User,
  Calendar,
  Gift,
  Smartphone
} from "lucide-react";

interface EnhancedReferralHistoryProps {
  referrals: ReferralData[];
  loading: boolean;
}

export function EnhancedReferralHistory({ referrals, loading }: EnhancedReferralHistoryProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'joined':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'blocked':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'joined':
        return 'انضم';
      case 'pending':
        return 'معلق';
      case 'expired':
        return 'منتهي';
      case 'blocked':
        return 'محظور';
      default:
        return 'غير معروف';
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'joined':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'expired':
      case 'blocked':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatPhoneDisplay = (phone: string) => {
    // تنسيق رقم الهاتف للعرض
    if (phone.startsWith('+966')) {
      return phone.replace('+966', '0');
    }
    return phone;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="h-6 w-16 bg-muted rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (referrals.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-4xl mb-4">📱</div>
        <h3 className="text-lg font-semibold mb-2">لم تقم بإحالة أحد بعد</h3>
        <p className="text-muted-foreground mb-4">
          ابدأ بدعوة الأصدقاء والعائلة للانضمام واحصل على مكافآت رائعة
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">سجل الإحالات</h3>
        <Badge variant="outline">{referrals.length} إحالة</Badge>
      </div>

      <div className="space-y-4">
        {referrals.map((referral) => (
          <div 
            key={referral.id} 
            className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
          >
            {/* أيقونة الحالة */}
            <div className="flex-shrink-0">
              {getStatusIcon(referral.status)}
            </div>

            {/* معلومات الإحالة */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {referral.invitee_name || "غير محدد"}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground font-mono">
                    {formatPhoneDisplay(referral.invitee_phone)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {formatDistanceToNow(new Date(referral.created_at), {
                      addSuffix: true,
                      locale: ar
                    })}
                  </span>
                </div>
                
                {referral.reward_days && (
                  <div className="flex items-center gap-1">
                    <Gift className="h-3 w-3" />
                    <span>{referral.reward_days} يوم مجاني</span>
                  </div>
                )}

                {referral.joined_at && (
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>
                      انضم {formatDistanceToNow(new Date(referral.joined_at), {
                        addSuffix: true,
                        locale: ar
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* شارة الحالة */}
            <div className="flex-shrink-0">
              <Badge variant={getStatusVariant(referral.status)}>
                {getStatusLabel(referral.status)}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {/* إحصائيات سريعة */}
      <div className="mt-6 pt-4 border-t">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {referrals.filter(r => r.status === 'joined').length}
            </div>
            <div className="text-xs text-muted-foreground">انضموا</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-600">
              {referrals.filter(r => r.status === 'pending').length}
            </div>
            <div className="text-xs text-muted-foreground">معلقة</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">
              {referrals.filter(r => r.status === 'expired').length}
            </div>
            <div className="text-xs text-muted-foreground">منتهية</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-primary">
              {referrals.reduce((sum, r) => sum + (r.reward_days || 0), 0)}
            </div>
            <div className="text-xs text-muted-foreground">إجمالي الأيام</div>
          </div>
        </div>
      </div>
    </Card>
  );
}