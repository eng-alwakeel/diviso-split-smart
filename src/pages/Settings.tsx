import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowRight,
  User, 
  CreditCard,
  Globe,
  Bell,
  Shield,
  Key,
  Camera,
  Save,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  LogOut,
  Crown,
  Calendar,
  Zap
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { QuotaStatus } from "@/components/QuotaStatus";
import { supabase } from "@/integrations/supabase/client";

const getPlanDisplayName = (plan: string) => {
  switch (plan) {
    case 'personal':
      return 'شخصي';
    case 'family':
      return 'عائلي';
    default:
      return 'مجاني';
  }
};

const getStatusDisplayName = (status: string) => {
  switch (status) {
    case 'trialing':
      return 'تجربة مجانية';
    case 'active':
      return 'نشط';
    case 'expired':
      return 'منتهي';
    case 'canceled':
      return 'ملغي';
    default:
      return 'غير محدد';
  }
};

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { subscription, isTrialActive, daysLeft, loading, refresh, startTrial } = useSubscription();
  const [activeTab, setActiveTab] = useState("profile");
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    expenseReminders: true,
    weeklyReports: false,
    language: "ar",
    currency: "SAR",
    darkMode: false,
    twoFactorAuth: false
  });

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "",
    joinDate: "",
    plan: "مجاني"
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Load user profile from Supabase
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileData) {
          setProfile({
            name: profileData.name || profileData.display_name || "",
            email: user.email || "",
            phone: profileData.phone || "",
            avatar: profileData.name?.charAt(0) || profileData.display_name?.charAt(0) || user.email?.charAt(0) || "م",
            joinDate: new Date(user.created_at).toLocaleDateString('ar-SA'),
            plan: getPlanDisplayName(subscription?.plan || 'free')
          });
        }
      }
    };
    
    loadProfile();
  }, [subscription]);

  const saveProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            name: profile.name,
            display_name: profile.name,
            phone: profile.phone,
            updated_at: new Date().toISOString()
          });
        
        if (error) throw error;
        
        toast({
          title: "تم حفظ البيانات!",
          description: "تم تحديث معلومات الملف الشخصي بنجاح",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive"
      });
    }
  };

  const changePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمة المرور الجديدة غير متطابقة",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "تم تغيير كلمة المرور!",
      description: "تم تحديث كلمة المرور بنجاح",
    });
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
  };

  const saveSettings = () => {
    toast({
      title: "تم حفظ الإعدادات!",
      description: "تم تحديث إعدادات التطبيق بنجاح",
    });
  };

  const deleteAccount = () => {
    toast({
      title: "طلب حذف الحساب",
      description: "سيتم التواصل معك خلال 24 ساعة لتأكيد الحذف",
      variant: "destructive"
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "تم تسجيل الخروج",
      description: "سيتم تحويلك للصفحة الرئيسية",
    });
    navigate('/');
  };

  const handleStartTrial = async (plan: 'personal' | 'family') => {
    const result = await startTrial(plan);
    if (result.error) {
      if (result.error === 'trial_exists') {
        toast({
          title: "تجربة موجودة مسبقاً",
          description: "لديك تجربة مجانية نشطة بالفعل",
          variant: "destructive"
        });
      } else {
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء بدء التجربة المجانية",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "تم بدء التجربة المجانية!",
        description: `تم تفعيل باقة ${getPlanDisplayName(plan)} لمدة ${daysLeft} أيام`,
      });
      await refresh();
    }
  };

  return (
    <div className="min-h-screen bg-dark-background">
      <AppHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
          <h1 className="text-3xl font-bold mb-2">الإعدادات</h1>
          <p className="text-muted-foreground">إدارة حسابك وتخصيص التطبيق</p>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex w-full gap-1 overflow-x-auto whitespace-nowrap px-1 py-1 text-xs md:text-sm [scrollbar-width:none] [-ms-overflow-style:'none'] [&::-webkit-scrollbar]:hidden">
            <TabsTrigger value="profile" className="shrink-0 whitespace-nowrap text-[11px] md:text-sm px-2 py-1.5 h-8">الملف الشخصي</TabsTrigger>
            <TabsTrigger value="subscription" className="shrink-0 whitespace-nowrap text-[11px] md:text-sm px-2 py-1.5 h-8">الاشتراك</TabsTrigger>
            <TabsTrigger value="language" className="shrink-0 whitespace-nowrap text-[11px] md:text-sm px-2 py-1.5 h-8">اللغة</TabsTrigger>
            <TabsTrigger value="notifications" className="shrink-0 whitespace-nowrap text-[11px] md:text-sm px-2 py-1.5 h-8">الإشعارات</TabsTrigger>
            <TabsTrigger value="privacy" className="shrink-0 whitespace-nowrap text-[11px] md:text-sm px-2 py-1.5 h-8">الخصوصية</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <User className="w-5 h-5 text-accent" />
                  المعلومات الشخصية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      <AvatarFallback className="bg-accent text-background text-2xl font-bold">
                        {profile.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <Button 
                      size="sm" 
                      className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                      variant="outline"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{profile.name || "مستخدم"}</h3>
                    <p className="text-muted-foreground">{profile.email}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="border-border text-foreground">
                        خطة {getPlanDisplayName(subscription?.plan || 'free')}
                      </Badge>
                      {isTrialActive && (
                        <Badge variant="outline" className="border-accent text-accent">
                          تجربة مجانية • {daysLeft} أيام متبقية
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground">الاسم الكامل</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                      className="bg-background/50 border-border text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                      className="bg-background/50 border-border text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground">رقم الجوال</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      className="text-left bg-background/50 border-border text-foreground"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">تاريخ الانضمام</Label>
                    <Input value={profile.joinDate} disabled className="bg-background/30 border-border text-muted-foreground" />
                  </div>
                </div>

                <Button onClick={saveProfile} variant="hero">
                  <Save className="w-4 h-4 ml-2" />
                  حفظ التغييرات
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Key className="w-5 h-5 text-accent" />
                  تغيير كلمة المرور
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-foreground">كلمة المرور الحالية</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      className="bg-background/50 border-border text-foreground"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute left-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-foreground">كلمة المرور الجديدة</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="bg-background/50 border-border text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground">تأكيد كلمة المرور</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="bg-background/50 border-border text-foreground"
                  />
                </div>

                <Button onClick={changePassword} variant="outline" className="border-border text-foreground hover:bg-accent/20">
                  <Save className="w-4 h-4 ml-2" />
                  تغيير كلمة المرور
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            {/* Current Plan Status */}
            <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Crown className="w-5 h-5 text-accent" />
                  الباقة الحالية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                      <Crown className="w-6 h-6 text-background" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        باقة {getPlanDisplayName(subscription?.plan || 'free')}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        الحالة: {getStatusDisplayName(subscription?.status || '')}
                      </p>
                      {subscription?.expires_at && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {isTrialActive 
                            ? `تنتهي التجربة في ${daysLeft} أيام`
                            : `تنتهي في: ${new Date(subscription.expires_at).toLocaleDateString('ar-SA')}`
                          }
                        </p>
                      )}
                    </div>
                  </div>
                  {subscription?.status === 'trialing' && (
                    <Badge variant="outline" className="border-accent text-accent">
                      تجربة مجانية
                    </Badge>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  {(!subscription || subscription.status === 'expired') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button 
                        onClick={() => handleStartTrial('personal')}
                        variant="hero"
                        disabled={loading}
                        className="flex items-center gap-2"
                      >
                        <Zap className="w-4 h-4" />
                        تجربة الباقة الشخصية مجاناً
                      </Button>
                      <Button 
                        onClick={() => handleStartTrial('family')}
                        variant="outline"
                        disabled={loading}
                        className="flex items-center gap-2 border-border text-foreground hover:bg-accent/20"
                      >
                        <Crown className="w-4 h-4" />
                        تجربة الباقة العائلية مجاناً
                      </Button>
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => navigate('/#pricing')}
                    variant="outline"
                    className="border-border text-foreground hover:bg-accent/20"
                  >
                    عرض جميع الباقات والأسعار
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quota Status */}
            <QuotaStatus />

            {/* Subscription Benefits */}
            <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Zap className="w-5 h-5 text-accent" />
                  مزايا الاشتراك المدفوع
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p className="text-foreground">✓ أعضاء أكثر في المجموعات</p>
                    <p className="text-foreground">✓ مجموعات أكثر</p>
                    <p className="text-foreground">✓ مصروفات شهرية أكثر</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-foreground">✓ دعوات أكثر</p>
                    <p className="text-foreground">✓ استخدام OCR أكثر</p>
                    <p className="text-foreground">✓ دعم فني أولوية</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Language & Currency Tab */}
          <TabsContent value="language" className="space-y-6">
            <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Globe className="w-5 h-5 text-accent" />
                  اللغة والعملة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-foreground">اللغة</Label>
                    <Select 
                      value={settings.language} 
                      onValueChange={(value) => setSettings({...settings, language: value})}
                    >
                      <SelectTrigger className="bg-background/50 border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">العملة الافتراضية</Label>
                    <Select 
                      value={settings.currency} 
                      onValueChange={(value) => setSettings({...settings, currency: value})}
                    >
                      <SelectTrigger className="bg-background/50 border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                        <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                        <SelectItem value="EUR">يورو (EUR)</SelectItem>
                        <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={saveSettings} variant="hero">
                  <Save className="w-4 h-4 ml-2" />
                  حفظ الإعدادات
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Bell className="w-5 h-5 text-accent" />
                  إعدادات الإشعارات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">إشعارات البريد الإلكتروني</p>
                      <p className="text-sm text-muted-foreground">استقبال الإشعارات عبر البريد</p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">الإشعارات الفورية</p>
                      <p className="text-sm text-muted-foreground">إشعارات على الهاتف</p>
                    </div>
                    <Switch
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) => setSettings({...settings, pushNotifications: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">تذكير المصاريف</p>
                      <p className="text-sm text-muted-foreground">تذكيرات لإدخال المصاريف</p>
                    </div>
                    <Switch
                      checked={settings.expenseReminders}
                      onCheckedChange={(checked) => setSettings({...settings, expenseReminders: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">التقارير الأسبوعية</p>
                      <p className="text-sm text-muted-foreground">ملخص أسبوعي للمصاريف</p>
                    </div>
                    <Switch
                      checked={settings.weeklyReports}
                      onCheckedChange={(checked) => setSettings({...settings, weeklyReports: checked})}
                    />
                  </div>
                </div>

                <Button onClick={saveSettings} variant="hero">
                  <Save className="w-4 h-4 ml-2" />
                  حفظ الإعدادات
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy & Security Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Shield className="w-5 h-5 text-accent" />
                  الخصوصية والأمان
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">المصادقة الثنائية</p>
                      <p className="text-sm text-muted-foreground">حماية إضافية لحسابك</p>
                    </div>
                    <Switch
                      checked={settings.twoFactorAuth}
                      onCheckedChange={(checked) => setSettings({...settings, twoFactorAuth: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">الوضع المظلم</p>
                      <p className="text-sm text-muted-foreground">تغيير مظهر التطبيق</p>
                    </div>
                    <Switch
                      checked={settings.darkMode}
                      onCheckedChange={(checked) => setSettings({...settings, darkMode: checked})}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Button onClick={saveSettings} variant="hero">
                    <Save className="w-4 h-4 ml-2" />
                    حفظ الإعدادات
                  </Button>

                  <Button onClick={logout} variant="outline" className="w-full border-border text-foreground hover:bg-accent/20">
                    <LogOut className="w-4 h-4 ml-2" />
                    تسجيل الخروج
                  </Button>

                  <Button onClick={deleteAccount} variant="destructive" className="w-full">
                    <Trash2 className="w-4 h-4 ml-2" />
                    حذف الحساب
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <div className="h-16 md:hidden" />
      <BottomNav />
    </div>
  );
};

export default Settings;