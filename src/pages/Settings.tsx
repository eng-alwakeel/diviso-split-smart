import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, ArrowLeft, User, CreditCard, Users, Globe, Bell, Shield, Save, RefreshCw } from "lucide-react";
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
import { UnifiedAdLayout } from "@/components/ads/UnifiedAdLayout";
import { FixedStatsAdBanner } from "@/components/ads/FixedStatsAdBanner";
import { DevSubscriptionTester } from "@/components/settings/DevSubscriptionTester";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";




const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, i18n } = useTranslation(['common', 'settings']);
  const { changeLanguage, isRTL } = useLanguage();
  
  // Language change with countdown
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [isLanguageChanging, setIsLanguageChanging] = useState(false);
  const [languageCountdown, setLanguageCountdown] = useState(0);
  const { subscription, isTrialActive, daysLeft, totalDaysLeft, remainingTrialDays, canStartTrial, canSwitchPlan, freeDaysFromReferrals, loading, refresh, startTrial, switchPlan, cancelSubscription } = useSubscription();
  const { settings, saveSettings, loading: settingsLoading } = useUserSettings();
  const { changePassword, loading: passwordLoading } = usePasswordChange();
  const { uploadProfileImage, uploading } = useProfileImage();
  const { currencies, updateExchangeRates, loading: currencyLoading } = useCurrencies();
  const { getPlanBadgeConfig, currentPlan } = usePlanBadge();
  const { data: adminData, isLoading: adminLoading } = useAdminAuth();
  
  const [activeTab, setActiveTab] = useState("profile");
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  // Helper functions for plan and status display names
  const getPlanDisplayName = (plan: string) => {
    switch (plan) {
      case 'personal':
        return t('settings:plans.personal');
      case 'family':
        return t('settings:plans.family');
      default:
        return t('settings:plans.free');
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'trialing':
        return t('settings:status.trialing');
      case 'active':
        return t('settings:status.active');
      case 'expired':
        return t('settings:status.expired');
      case 'canceled':
        return t('settings:status.canceled');
      default:
        return t('settings:status.unknown');
    }
  };
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "",
    avatarUrl: "",
    joinDate: "",
    plan: t('settings:plans.free')
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
            avatar: profileData.name?.charAt(0) || profileData.display_name?.charAt(0) || user.email?.charAt(0) || t('common:user.default_initial'),
            avatarUrl: profileData.avatar_url || "",
            joinDate: new Date(user.created_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US'),
            plan: getPlanDisplayName(subscription?.plan || 'free')
          });
        }
      }
    };
    
    loadProfile();
  }, [subscription, i18n.language]);

  const validateProfile = () => {
    const errors: Record<string, string> = {};
    
    if (!profile.name.trim()) {
      errors.name = t('settings:validation.name_required');
    }
    
    if (!profile.email.trim()) {
      errors.email = t('settings:validation.email_required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      errors.email = t('settings:validation.email_invalid');
    }
    
    if (profile.phone && !/^[+]?[0-9\s-()]{10,}$/.test(profile.phone)) {
      errors.phone = t('settings:validation.phone_invalid');
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
          title: t('common:toast.save_success'),
          description: t('common:toast.settings_saved_description'),
        });
      }
    } catch (error) {
      toast({
        title: t('common:error'),
        description: t('common:toast.settings_error'),
        variant: "destructive"
      });
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: t('common:error'),
        description: t('settings:validation.password_mismatch'),
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
        title: t('settings:toast.account_deleted'),
        description: t('settings:toast.account_deleted_desc'),
        variant: "destructive"
      });
      
      // Sign out and redirect
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      const errorMessage = error.message || t('settings:toast.cancel_error');
      toast({
        title: t('settings:toast.delete_error'),
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('supabase.auth.token');
      localStorage.clear();
      
      toast({
        title: t('settings:toast.logout_success'),
        description: t('settings:toast.logout_redirect'),
      });
      
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: t('settings:toast.logout_error'),
        description: t('settings:toast.logout_error_desc'),
        variant: "destructive"
      });
    }
  };

  const handleStartTrial = async (plan: 'personal' | 'family') => {
    const result = await startTrial(plan);
    if (result.error) {
      if (result.error === 'trial_exists') {
        toast({
          title: t('settings:errors.trial_exists'),
          description: t('settings:errors.trial_exists_description'),
          variant: "destructive"
        });
      } else if (result.error === 'trial_expired') {
        toast({
          title: t('settings:errors.trial_expired'),
          description: t('settings:errors.trial_expired_description'),
          variant: "destructive"
        });
      } else {
        toast({
          title: t('common:error'),
          description: t('settings:errors.start_trial_error'),
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: t('settings:success.trial_started'),
        description: t('settings:success.trial_started_description', { plan: getPlanDisplayName(plan) }),
      });
      await refresh();
    }
  };

  const handleSwitchPlan = async (plan: 'personal' | 'family') => {
    const result = await switchPlan(plan);
    if (result.error) {
      if (result.error === 'trial_expired') {
        toast({
          title: t('settings:errors.trial_expired'),
          description: t('settings:errors.trial_expired_description'),
          variant: "destructive"
        });
      } else {
        toast({
          title: t('common:error'),
          description: t('settings:errors.switch_plan_error'),
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: t('settings:success.plan_switched'),
        description: t('settings:success.plan_switched_description', { plan: getPlanDisplayName(plan) }),
      });
      await refresh();
    }
  };

  const handleCancelSubscription = async () => {
    const result = await cancelSubscription();
    if (result.error) {
      toast({
        title: t('common:error'),
        description: t('settings:errors.cancel_error'),
        variant: "destructive"
      });
    } else {
      toast({
        title: t('settings:success.subscription_canceled'),
        description: t('settings:success.subscription_canceled_description'),
      });
      await refresh();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <UnifiedAdLayout 
        placement="settings"
        showTopBanner={false}
        showSidebar={false}
        showBottomBanner={false}
      >
        <div className="page-container space-y-6">
          {/* Header */}
          <div>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="mb-4"
            >
              <BackArrow className="w-4 h-4 me-2" />
              {t('settings:back_to_dashboard')}
            </Button>
            <h1 className="text-3xl font-bold mb-2">{t('settings:title')}</h1>
            <p className="text-muted-foreground">{t('settings:description')}</p>
          </div>

          {/* Dev Tools - Only in Development */}
          {import.meta.env.DEV && (
            <DevSubscriptionTester />
          )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{t('settings:tabs.profile')}</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">{t('settings:tabs.subscription')}</span>
            </TabsTrigger>
            <TabsTrigger value="family" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">{t('settings:tabs.family')}</span>
            </TabsTrigger>
            <TabsTrigger value="language" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">{t('settings:tabs.language')}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">{t('settings:tabs.notifications')}</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">{t('settings:tabs.privacy')}</span>
            </TabsTrigger>
            {adminData?.isAdmin && (
              <TabsTrigger value="admin" className="flex items-center gap-2 text-primary">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">{t('settings:tabs.admin')}</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Fixed Ad Banner After Tabs */}
          <FixedStatsAdBanner placement="settings_tabs" />

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
              handleCancelSubscription={handleCancelSubscription}
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
                        {t('settings:family.upgrade_title')}
                      </CardTitle>
                      <CardDescription>
                        {t('settings:family.upgrade_description')}
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
                            {loading ? t('settings:family.starting_trial') : t('settings:family.start_trial')}
                          </Button>
                        )}
                        <Button 
                          variant="outline"
                          onClick={() => navigate('/pricing')}
                          className="w-full"
                        >
                          {t('settings:family.view_plans')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Language Tab */}
          <TabsContent value="language" className="space-y-6">
            <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Globe className="w-5 h-5 text-accent" />
                  {t('settings:language_currency.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-foreground">{t('settings:language_currency.language_label')}</Label>
                  <Select 
                    value={selectedLanguage} 
                    onValueChange={(value) => setSelectedLanguage(value)}
                    disabled={isLanguageChanging}
                  >
                    <SelectTrigger className="bg-background/50 border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    onClick={() => {
                      setIsLanguageChanging(true);
                      setLanguageCountdown(5);
                      
                      const timer = setInterval(() => {
                        setLanguageCountdown(prev => {
                          if (prev <= 1) {
                            clearInterval(timer);
                            changeLanguage(selectedLanguage);
                            setIsLanguageChanging(false);
                            toast({
                              title: t('settings:language_currency.language_changed'),
                              description: t('settings:language_currency.language_changed_desc'),
                            });
                            return 0;
                          }
                          return prev - 1;
                        });
                      }, 1000);
                    }}
                    disabled={selectedLanguage === i18n.language || isLanguageChanging}
                    className="w-full"
                  >
                    {isLanguageChanging ? (
                      <>
                        {t('settings:language_currency.changing_language')} ({languageCountdown})
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 me-2" />
                        {t('settings:language_currency.save_language')}
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">{t('settings:language_currency.currency_label')}</Label>
                  <p className="text-sm text-muted-foreground">{t('settings:language_currency.currency_description')}</p>
                  <CurrencySelector
                    value={settings?.currency || 'SAR'}
                    onValueChange={(value) => saveSettings({ currency: value })}
                    currencies={currencies}
                    placeholder={t('settings:language_currency.currency_placeholder')}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{t('settings:language_currency.currency_note')}</p>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={updateExchangeRates}
                    disabled={currencyLoading}
                  >
                    <RefreshCw className={`w-4 h-4 me-2 ${currencyLoading ? 'animate-spin' : ''}`} />
                    {t('settings:language_currency.refresh_rates')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Bell className="w-5 h-5 text-accent" />
                  {t('settings:notifications.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-foreground">{t('settings:notifications.email.title')}</Label>
                    <p className="text-sm text-muted-foreground">{t('settings:notifications.email.description')}</p>
                  </div>
                  <Switch
                    checked={settings?.emailNotifications ?? true}
                    onCheckedChange={(checked) => saveSettings({ emailNotifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-foreground">{t('settings:notifications.push.title')}</Label>
                    <p className="text-sm text-muted-foreground">{t('settings:notifications.push.description')}</p>
                  </div>
                  <Switch
                    checked={settings?.pushNotifications ?? true}
                    onCheckedChange={(checked) => saveSettings({ pushNotifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-foreground">{t('settings:notifications.expense_reminders.title')}</Label>
                    <p className="text-sm text-muted-foreground">{t('settings:notifications.expense_reminders.description')}</p>
                  </div>
                  <Switch
                    checked={settings?.expenseReminders ?? true}
                    onCheckedChange={(checked) => saveSettings({ expenseReminders: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-foreground">{t('settings:notifications.weekly_reports.title')}</Label>
                    <p className="text-sm text-muted-foreground">{t('settings:notifications.weekly_reports.description')}</p>
                  </div>
                  <Switch
                    checked={settings?.weeklyReports ?? true}
                    onCheckedChange={(checked) => saveSettings({ weeklyReports: checked })}
                  />
                </div>
              </CardContent>
            </Card>
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
              <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Shield className="w-5 h-5 text-primary" />
                    {t('settings:admin.title')}
                  </CardTitle>
                  <CardDescription>{t('settings:admin.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate('/admin')}>
                    {t('settings:admin.enter_dashboard')}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Bottom spacing for mobile */}
        <div className="h-24 lg:hidden" />
        </div>
      </UnifiedAdLayout>
      
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Settings;
