import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, User, CreditCard, Users, Globe, Bell, Shield, Save, RefreshCw, Tv } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserSettings } from "@/hooks/useUserSettings";
import { usePasswordChange } from "@/hooks/usePasswordChange";
import { useProfileImage } from "@/hooks/useProfileImage";
import { useCurrencies } from "@/hooks/useCurrencies";
import { FamilyPlanManagement } from "@/components/family/FamilyPlanManagement";
import { AcceptFamilyInvite } from "@/components/family/AcceptFamilyInvite";
import { CurrencySelector } from "@/components/ui/currency-selector";
import { supabase } from "@/integrations/supabase/client";
import { usePlanBadge } from "@/hooks/usePlanBadge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { ProfileTab } from "@/components/settings/ProfileTab";
import { SubscriptionTab } from "@/components/settings/SubscriptionTab";
import { SecurityTab } from "@/components/settings/SecurityTab";
import { SubscriptionAwareAdSettings } from "@/components/settings/SubscriptionAwareAdSettings";

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
  const { subscription, isTrialActive, daysLeft, totalDaysLeft, remainingTrialDays, canStartTrial, canSwitchPlan, freeDaysFromReferrals, loading, refresh, startTrial, switchPlan } = useSubscription();
  const { settings, saveSettings, loading: settingsLoading } = useUserSettings();
  const { changePassword, loading: passwordLoading } = usePasswordChange();
  const { uploadProfileImage, uploading } = useProfileImage();
  const { currencies, updateExchangeRates, loading: currencyLoading } = useCurrencies();
  const { getPlanBadgeConfig, currentPlan } = usePlanBadge();
  const { data: adminData, isLoading: adminLoading } = useAdminAuth();
  
  const [activeTab, setActiveTab] = useState("profile");
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

  const handlePhoneChange = (phone: string) => {
    setProfile(prev => ({...prev, phone}));
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
      } else if (result.error === 'trial_expired') {
        toast({
          title: "انتهت فترة التجربة",
          description: "لقد استنفدت فترة التجربة المجانية المتاحة (7 أيام)",
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
        description: `تم تفعيل باقة ${getPlanDisplayName(plan)} لمدة 7 أيام`,
      });
      await refresh();
    }
  };

  const handleSwitchPlan = async (plan: 'personal' | 'family') => {
    const result = await switchPlan(plan);
    if (result.error) {
      if (result.error === 'trial_expired') {
        toast({
          title: "انتهت فترة التجربة",
          description: "لقد استنفدت فترة التجربة المجانية المتاحة (7 أيام)",
          variant: "destructive"
        });
      } else {
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء تبديل الباقة",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "تم تبديل الباقة!",
        description: `تم التبديل إلى باقة ${getPlanDisplayName(plan)} بنجاح`,
      });
      await refresh();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="form-container">
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
          <TabsList className="w-full">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">الملف الشخصي</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">الاشتراك</span>
            </TabsTrigger>
            <TabsTrigger value="family" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">العائلة</span>
            </TabsTrigger>
            <TabsTrigger value="language" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">اللغة</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">الإشعارات</span>
            </TabsTrigger>
            <TabsTrigger value="ads" className="flex items-center gap-2">
              <Tv className="w-4 h-4" />
              <span className="hidden sm:inline">الإعلانات</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">الأمان</span>
            </TabsTrigger>
            {adminData?.isAdmin && (
              <TabsTrigger value="admin" className="flex items-center gap-2 text-primary">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">الإدارة</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <ProfileTab
              profile={profile}
              setProfile={setProfile}
              validationErrors={validationErrors}
              setValidationErrors={setValidationErrors}
              saveProfile={saveProfile}
              onPhoneChange={handlePhoneChange}
              handleImageUpload={handleImageUpload}
              uploading={uploading}
              isAdmin={adminData?.isAdmin}
              planBadgeConfig={getPlanBadgeConfig(currentPlan)}
              isTrialActive={isTrialActive}
              daysLeft={daysLeft}
              logout={logout}
            />
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            <SubscriptionTab
              subscription={subscription}
              isTrialActive={isTrialActive}
              daysLeft={daysLeft}
              totalDaysLeft={totalDaysLeft}
              remainingTrialDays={remainingTrialDays}
              canStartTrial={canStartTrial}
              canSwitchPlan={canSwitchPlan}
              freeDaysFromReferrals={freeDaysFromReferrals}
              loading={loading}
              handleStartTrial={handleStartTrial}
              handleSwitchPlan={handleSwitchPlan}
              getPlanDisplayName={getPlanDisplayName}
              getStatusDisplayName={getStatusDisplayName}
            />
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
                  variant="default"
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
                  variant="default"
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

          {/* Ads Tab */}
          <TabsContent value="ads" className="space-y-6">
            <SubscriptionAwareAdSettings />
          </TabsContent>

          {/* Privacy/Security Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <SecurityTab
              passwordData={passwordData}
              setPasswordData={setPasswordData}
              handleChangePassword={handleChangePassword}
              passwordLoading={passwordLoading}
              deleteAccount={deleteAccount}
            />
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
                  <Button 
                    onClick={() => navigate('/admin-dashboard')}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    size="lg"
                  >
                    <Shield className="w-5 h-5 ml-2" />
                    دخول لوحة التحكم الإدارية
                  </Button>
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