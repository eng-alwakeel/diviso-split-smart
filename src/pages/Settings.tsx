import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  ArrowRight,
  User, 
  Users,
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
  Zap,
  Upload,
  RefreshCw,
  Receipt,
  TrendingUp
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { QuotaStatus } from "@/components/QuotaStatus";
import { useUserSettings } from "@/hooks/useUserSettings";
import { usePasswordChange } from "@/hooks/usePasswordChange";
import { useProfileImage } from "@/hooks/useProfileImage";
import { useCurrencies } from "@/hooks/useCurrencies";
import { FamilyPlanManagement } from "@/components/family/FamilyPlanManagement";
import { AcceptFamilyInvite } from "@/components/family/AcceptFamilyInvite";
import { CurrencySelector } from "@/components/ui/currency-selector";
import { supabase } from "@/integrations/supabase/client";
import { PlanBadge } from "@/components/ui/plan-badge";
import { usePlanBadge } from "@/hooks/usePlanBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";

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
  const { settings, saveSettings, loading: settingsLoading } = useUserSettings();
  const { changePassword, loading: passwordLoading } = usePasswordChange();
  const { uploadProfileImage, uploading } = useProfileImage();
  const { currencies, updateExchangeRates, loading: currencyLoading } = useCurrencies();
  const { getPlanBadgeConfig, currentPlan } = usePlanBadge();
  const { data: adminData, isLoading: adminLoading } = useAdminAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState("profile");
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "",
    avatarUrl: "",
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
            avatarUrl: profileData.avatar_url || "",
            joinDate: new Date(user.created_at).toLocaleDateString('ar-SA'),
            plan: getPlanDisplayName(subscription?.plan || 'free')
          });
        }
      }
    };
    
    loadProfile();
  }, [subscription]);

  const validateProfile = () => {
    const errors: Record<string, string> = {};
    
    if (!profile.name.trim()) {
      errors.name = "الاسم مطلوب";
    }
    
    if (!profile.email.trim()) {
      errors.email = "البريد الإلكتروني مطلوب";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      errors.email = "البريد الإلكتروني غير صحيح";
    }
    
    if (profile.phone && !/^[+]?[0-9\s-()]{10,}$/.test(profile.phone)) {
      errors.phone = "رقم الجوال غير صحيح";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveProfile = async () => {
    if (!validateProfile()) return;
    
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

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمة المرور الجديدة غير متطابقة",
        variant: "destructive"
      });
      return;
    }

    const success = await changePassword(passwordData.currentPassword, passwordData.newPassword);
    if (success) {
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const newAvatarUrl = await uploadProfileImage(file);
      setProfile(prev => ({ ...prev, avatarUrl: newAvatarUrl }));
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const deleteAccount = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('delete-account', {
        method: 'POST'
      });
      
      if (error) throw error;

      toast({
        title: "تم حذف الحساب",
        description: "تم حذف حسابك نهائياً",
        variant: "destructive"
      });
      
      // Sign out and redirect
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      const errorMessage = error.message || 'حدث خطأ أثناء حذف الحساب';
      toast({
        title: "خطأ في حذف الحساب",
        description: errorMessage,
        variant: "destructive"
      });
    }
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
            <TabsTrigger value="family" className="shrink-0 whitespace-nowrap text-[11px] md:text-sm px-2 py-1.5 h-8">العائلة</TabsTrigger>
            <TabsTrigger value="language" className="shrink-0 whitespace-nowrap text-[11px] md:text-sm px-2 py-1.5 h-8">اللغة</TabsTrigger>
            <TabsTrigger value="notifications" className="shrink-0 whitespace-nowrap text-[11px] md:text-sm px-2 py-1.5 h-8">الإشعارات</TabsTrigger>
            <TabsTrigger value="privacy" className="shrink-0 whitespace-nowrap text-[11px] md:text-sm px-2 py-1.5 h-8">الخصوصية</TabsTrigger>
            {adminData?.isAdmin && (
              <TabsTrigger value="admin" className="shrink-0 whitespace-nowrap text-[11px] md:text-sm px-2 py-1.5 h-8 text-primary">الإدارة</TabsTrigger>
            )}
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
                      {profile.avatarUrl ? (
                        <AvatarImage src={profile.avatarUrl} alt="صورة الملف الشخصي" />
                      ) : (
                        <AvatarFallback className="bg-accent text-background text-2xl font-bold">
                          {profile.avatar}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <Button 
                      size="sm" 
                      className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                      {profile.name || "مستخدم"}
                      {adminData?.isAdmin && (
                        <Badge variant="outline" className="border-primary text-primary bg-primary/10">
                          <Crown className="w-3 h-3 ml-1" />
                          مدير
                        </Badge>
                      )}
                    </h3>
                    <p className="text-muted-foreground">{profile.email}</p>
                    <div className="flex gap-2 mt-2">
                      <PlanBadge 
                        config={getPlanBadgeConfig(currentPlan)} 
                        size="md"
                      />
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
                      onChange={(e) => {
                        setProfile({...profile, name: e.target.value});
                        if (validationErrors.name) {
                          setValidationErrors(prev => ({...prev, name: ""}));
                        }
                      }}
                      className={`bg-background/50 border-border text-foreground ${
                        validationErrors.name ? 'border-destructive' : ''
                      }`}
                    />
                    {validationErrors.name && (
                      <p className="text-xs text-destructive">{validationErrors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => {
                        setProfile({...profile, email: e.target.value});
                        if (validationErrors.email) {
                          setValidationErrors(prev => ({...prev, email: ""}));
                        }
                      }}
                      className={`bg-background/50 border-border text-foreground ${
                        validationErrors.email ? 'border-destructive' : ''
                      }`}
                    />
                    {validationErrors.email && (
                      <p className="text-xs text-destructive">{validationErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground">رقم الجوال</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => {
                        setProfile({...profile, phone: e.target.value});
                        if (validationErrors.phone) {
                          setValidationErrors(prev => ({...prev, phone: ""}));
                        }
                      }}
                      className={`text-left bg-background/50 border-border text-foreground ${
                        validationErrors.phone ? 'border-destructive' : ''
                      }`}
                      dir="ltr"
                      placeholder="+966xxxxxxxxx"
                    />
                    {validationErrors.phone && (
                      <p className="text-xs text-destructive">{validationErrors.phone}</p>
                    )}
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

                <Button 
                  onClick={handleChangePassword} 
                  variant="outline" 
                  className="border-border text-foreground hover:bg-accent/20"
                  disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                >
                  {passwordLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ml-2" />
                  ) : (
                    <Save className="w-4 h-4 ml-2" />
                  )}
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
                    onClick={() => navigate('/pricing-protected')}
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

          {/* Family Plan Tab */}
          <TabsContent value="family" className="space-y-6">
            <div className="space-y-6">
              {subscription?.plan === 'family' ? (
                <FamilyPlanManagement />
              ) : (
                <div className="space-y-6">
                  <AcceptFamilyInvite />
                  <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-foreground">
                        <Users className="w-5 h-5 text-accent" />
                        ترقية للخطة العائلية
                      </CardTitle>
                      <CardDescription>
                        احصل على الخطة العائلية لإدارة أعضاء عائلتك ومشاركة الميزات معهم
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(!subscription || subscription?.status === "expired") && (
                          <Button 
                            onClick={() => handleStartTrial('family')}
                            className="w-full"
                            disabled={loading}
                          >
                            {loading ? "جاري البدء..." : "بدء التجربة المجانية للخطة العائلية"}
                          </Button>
                        )}
                        <Button 
                          onClick={() => navigate('/pricing-protected')}
                          variant="outline"
                          className="w-full border-border text-foreground hover:bg-accent/20"
                        >
                          عرض جميع الباقات والأسعار
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
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
                      onValueChange={(value) => saveSettings({language: value})}
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

                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium text-foreground">العملة المفضلة</Label>
                      <p className="text-sm text-muted-foreground mb-3">
                        اختر العملة التي تريد استخدامها في التطبيق
                      </p>
                      <div className="flex gap-2">
                        <CurrencySelector
                          currencies={currencies}
                          value={settings.currency}
                          onValueChange={(currency) => saveSettings({ currency })}
                          placeholder="اختر العملة المفضلة..."
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={updateExchangeRates}
                          disabled={currencyLoading}
                          className="px-3"
                          title="تحديث أسعار الصرف"
                        >
                          {currencyLoading ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      
                      {settings.currency && (
                        <div className="mt-3 p-3 bg-muted/30 border border-border/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            {currencies.find(c => c.code === settings.currency)?.flag_emoji && (
                              <span className="text-lg">
                                {currencies.find(c => c.code === settings.currency)?.flag_emoji}
                              </span>
                            )}
                            <span className="font-bold text-lg">
                              {currencies.find(c => c.code === settings.currency)?.symbol}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              العملة المحددة: {currencies.find(c => c.code === settings.currency)?.name}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <p className="text-sm text-muted-foreground mt-2">
                        ستظهر جميع المبالغ محولة إلى العملة المفضلة
                      </p>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => saveSettings({})} 
                  variant="hero"
                  disabled={settingsLoading}
                >
                  {settingsLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ml-2" />
                  ) : (
                    <Save className="w-4 h-4 ml-2" />
                  )}
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
                      onCheckedChange={(checked) => saveSettings({emailNotifications: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">الإشعارات الفورية</p>
                      <p className="text-sm text-muted-foreground">إشعارات على الهاتف</p>
                    </div>
                    <Switch
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) => saveSettings({pushNotifications: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">تذكير المصاريف</p>
                      <p className="text-sm text-muted-foreground">تذكيرات لإدخال المصاريف</p>
                    </div>
                    <Switch
                      checked={settings.expenseReminders}
                      onCheckedChange={(checked) => saveSettings({expenseReminders: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">التقارير الأسبوعية</p>
                      <p className="text-sm text-muted-foreground">ملخص أسبوعي للمصاريف</p>
                    </div>
                    <Switch
                      checked={settings.weeklyReports}
                      onCheckedChange={(checked) => saveSettings({weeklyReports: checked})}
                    />
                  </div>
                </div>

                <Button 
                  onClick={() => saveSettings({})} 
                  variant="hero"
                  disabled={settingsLoading}
                >
                  {settingsLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ml-2" />
                  ) : (
                    <Save className="w-4 h-4 ml-2" />
                  )}
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
                      onCheckedChange={(checked) => saveSettings({twoFactorAuth: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">الوضع المظلم</p>
                      <p className="text-sm text-muted-foreground">تغيير مظهر التطبيق</p>
                    </div>
                    <Switch
                      checked={settings.darkMode}
                      onCheckedChange={(checked) => saveSettings({darkMode: checked})}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Button 
                    onClick={() => saveSettings({})} 
                    variant="hero"
                    disabled={settingsLoading}
                  >
                    {settingsLoading ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ml-2" />
                    ) : (
                      <Save className="w-4 h-4 ml-2" />
                    )}
                    حفظ الإعدادات
                  </Button>

                  <Button onClick={logout} variant="outline" className="w-full border-border text-foreground hover:bg-accent/20">
                    <LogOut className="w-4 h-4 ml-2" />
                    تسجيل الخروج
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <Trash2 className="w-4 h-4 ml-2" />
                        حذف الحساب
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>هل أنت متأكد من حذف الحساب؟</AlertDialogTitle>
                        <AlertDialogDescription>
                          هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع بياناتك نهائياً.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          حذف الحساب
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Tab */}
          {adminData?.isAdmin && (
            <TabsContent value="admin" className="space-y-6">
              <Card className="bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border border-primary/20 shadow-card rounded-2xl backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Shield className="w-5 h-5 text-primary" />
                    لوحة التحكم الإدارية
                  </CardTitle>
                  <CardDescription>
                    الوصول إلى أدوات الإدارة والإحصائيات المتقدمة للنظام
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-background/50 rounded-lg border border-border/30">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Crown className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground">صلاحيات المدير</h3>
                      <p className="text-sm text-muted-foreground">
                        يمكنك الوصول إلى لوحة التحكم لإدارة المستخدمين والمجموعات والإحصائيات
                      </p>
                    </div>
                    <Badge variant="outline" className="border-primary text-primary bg-primary/10">
                      <Shield className="w-3 h-3 ml-1" />
                      مدير النظام
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <p className="text-foreground flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          إدارة المستخدمين
                        </p>
                        <p className="text-foreground flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-primary" />
                          إدارة المجموعات
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-foreground flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          الإحصائيات المتقدمة
                        </p>
                         <p className="text-foreground flex items-center gap-2">
                           <Shield className="w-4 h-4 text-primary" />
                           إعدادات النظام
                         </p>
                      </div>
                    </div>

                    <Button 
                      onClick={() => navigate('/admin-dashboard')}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      size="lg"
                    >
                      <Shield className="w-5 h-5 ml-2" />
                      دخول لوحة التحكم الإدارية
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
      <div className="h-16 md:hidden" />
      <BottomNav />
    </div>
  );
};

export default Settings;