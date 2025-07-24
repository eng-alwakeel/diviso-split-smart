import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowRight, 
  Gift, 
  Copy, 
  Share2, 
  Users, 
  Calendar,
  Crown,
  Phone,
  CheckCircle,
  Clock,
  Link as LinkIcon
} from "lucide-react";
import { Header } from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Mock data
const referralData = {
  totalReferrals: 8,
  successfulReferrals: 5,
  freeDaysEarned: 35,
  freeDaysRemaining: 7,
  referralCode: "AHMED2024",
  referralLink: "https://diviso.app/join/AHMED2024"
};

const referralHistory = [
  {
    id: 1,
    name: "فاطمة أحمد",
    phone: "05xxxxxxx12",
    status: "مكتمل",
    joinDate: "2024-01-15",
    daysEarned: 7
  },
  {
    id: 2,
    name: "خالد محمد",
    phone: "05xxxxxxx34",
    status: "مكتمل",
    joinDate: "2024-01-10",
    daysEarned: 7
  },
  {
    id: 3,
    name: "سارة علي",
    phone: "05xxxxxxx56",
    status: "مكتمل",
    joinDate: "2024-01-08",
    daysEarned: 7
  },
  {
    id: 4,
    name: "محمد عبدالله",
    phone: "05xxxxxxx78",
    status: "مكتمل",
    joinDate: "2024-01-05",
    daysEarned: 7
  },
  {
    id: 5,
    name: "نورا حسن",
    phone: "05xxxxxxx90",
    status: "مكتمل",
    joinDate: "2024-01-02",
    daysEarned: 7
  },
  {
    id: 6,
    name: "عبدالرحمن صالح",
    phone: "05xxxxxxx11",
    status: "في الانتظار",
    joinDate: "2024-01-20",
    daysEarned: 0
  },
  {
    id: 7,
    name: "هند ياسر",
    phone: "05xxxxxxx22",
    status: "في الانتظار",
    joinDate: "2024-01-18",
    daysEarned: 0
  },
  {
    id: 8,
    name: "يوسف مراد",
    phone: "05xxxxxxx33",
    status: "منتهي الصلاحية",
    joinDate: "2024-01-12",
    daysEarned: 0
  }
];

const ReferralCenter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [newReferralPhone, setNewReferralPhone] = useState("");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ!",
      description: "تم نسخ الرابط إلى الحافظة",
    });
  };

  const sendReferralInvite = () => {
    if (!newReferralPhone) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم الجوال",
        variant: "destructive"
      });
      return;
    }

    // في التطبيق الحقيقي، ستتم إرسال رسالة نصية
    toast({
      title: "تم إرسال الدعوة!",
      description: `تم إرسال دعوة إلى ${newReferralPhone}`,
    });
    setNewReferralPhone("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "مكتمل":
        return <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20">مكتمل</Badge>;
      case "في الانتظار":
        return <Badge variant="outline" className="border-orange-300 text-orange-600">في الانتظار</Badge>;
      case "منتهي الصلاحية":
        return <Badge variant="destructive">منتهي الصلاحية</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const successRate = (referralData.successfulReferrals / referralData.totalReferrals) * 100;

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للوحة التحكم
          </Button>
          <h1 className="text-3xl font-bold mb-2">مركز الإحالة</h1>
          <p className="text-muted-foreground">ادع أصدقاءك واحصل على أيام مجانية من الاشتراك</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Stats & Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Stats */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-card shadow-card">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold">{referralData.totalReferrals}</p>
                  <p className="text-sm text-muted-foreground">إجمالي الإحالات</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card shadow-card">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-secondary rounded-xl flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold">{referralData.successfulReferrals}</p>
                  <p className="text-sm text-muted-foreground">إحالات مكتملة</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card shadow-card">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold">{referralData.freeDaysEarned}</p>
                  <p className="text-sm text-muted-foreground">أيام مكتسبة</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card shadow-card">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-secondary rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold">{referralData.freeDaysRemaining}</p>
                  <p className="text-sm text-muted-foreground">أيام متبقية</p>
                </CardContent>
              </Card>
            </div>

            {/* Success Rate */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  معدل نجاح الإحالات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>معدل التحويل</span>
                    <span className="font-bold text-secondary">{successRate.toFixed(0)}%</span>
                  </div>
                  <Progress value={successRate} className="h-3" />
                  <p className="text-sm text-muted-foreground">
                    {referralData.successfulReferrals} من أصل {referralData.totalReferrals} إحالة تم تفعيلها بنجاح
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Send New Referral */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  إرسال دعوة جديدة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    placeholder="05xxxxxxxx"
                    value={newReferralPhone}
                    onChange={(e) => setNewReferralPhone(e.target.value)}
                    className="text-left"
                    dir="ltr"
                  />
                  <Button onClick={sendReferralInvite} variant="hero">
                    إرسال دعوة
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  سيتم إرسال رسالة نصية تحتوي على رابط التسجيل الخاص بك
                </p>
              </CardContent>
            </Card>

            {/* Referral History */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>سجل الإحالات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {referralHistory.map((referral) => (
                    <Card key={referral.id} className="bg-gradient-subtle border-0 hover:shadow-md transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                              <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{referral.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {referral.phone}
                              </p>
                              <p className="text-sm font-medium text-foreground">
                                تاريخ الانضمام: {referral.joinDate}
                              </p>
                            </div>
                          </div>
                          <div className="text-left flex flex-col items-end gap-2">
                            {getStatusBadge(referral.status)}
                            {referral.daysEarned > 0 && (
                              <Badge variant="secondary" className="bg-secondary/10 text-secondary">
                                +{referral.daysEarned} أيام
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Referral Tools */}
          <div className="space-y-6">
            {/* Current Status */}
            <Card className="bg-gradient-hero text-white shadow-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  حالتك الحالية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold">{referralData.freeDaysRemaining}</p>
                  <p className="text-blue-100">أيام مجانية متبقية</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-sm text-blue-100 mb-1">الأيام المكتسبة إجمالياً</p>
                  <p className="text-xl font-bold">{referralData.freeDaysEarned} يوم</p>
                </div>
              </CardContent>
            </Card>

            {/* Referral Code */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  كود الإحالة الخاص بك
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">الكود الخاص بك</p>
                  <p className="text-2xl font-bold tracking-wider">{referralData.referralCode}</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={referralData.referralLink}
                      readOnly
                      className="text-left text-xs"
                      dir="ltr"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(referralData.referralLink)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: "انضم إلى Diviso",
                          text: "انضم إلى Diviso لإدارة المصاريف المشتركة بذكاء",
                          url: referralData.referralLink
                        });
                      }
                    }}
                  >
                    <Share2 className="w-4 h-4 ml-2" />
                    مشاركة الرابط
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* How it Works */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>كيف يعمل البرنامج؟</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                      1
                    </div>
                    <p className="text-sm">ادع صديقك باستخدام رابطك الخاص</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                      2
                    </div>
                    <p className="text-sm">يسجل صديقك ويبدأ استخدام التطبيق</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                      3
                    </div>
                    <p className="text-sm">تحصل على 7 أيام مجانية فوراً!</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralCenter;