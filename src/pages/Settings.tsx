import { useState } from "react";
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
  LogOut
} from "lucide-react";
import { Header } from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Mock data
const mockProfile = {
  name: "أحمد محمد",
  email: "ahmed@example.com",
  phone: "05xxxxxxx12",
  avatar: "أ",
  joinDate: "2024-01-01",
  plan: "مجاني"
};

const mockPaymentMethods = [
  {
    id: 1,
    type: "visa",
    last4: "4242",
    expiryDate: "12/25",
    isDefault: true
  },
  {
    id: 2,
    type: "mastercard",
    last4: "8888",
    expiryDate: "08/26",
    isDefault: false
  }
];

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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

  const [profile, setProfile] = useState(mockProfile);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const saveProfile = () => {
    toast({
      title: "تم حفظ البيانات!",
      description: "تم تحديث معلومات الملف الشخصي بنجاح",
    });
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

  const logout = () => {
    toast({
      title: "تم تسجيل الخروج",
      description: "سيتم تحويلك للصفحة الرئيسية",
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-dark-background">
      <Header />
      
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">الملف الشخصي</TabsTrigger>
            <TabsTrigger value="payments">طرق الدفع</TabsTrigger>
            <TabsTrigger value="language">اللغة</TabsTrigger>
            <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
            <TabsTrigger value="privacy">الخصوصية</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-gradient-group border-0 shadow-group">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-group-card-foreground">
                  <User className="w-5 h-5" />
                  المعلومات الشخصية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      <AvatarFallback className="bg-gradient-primary text-white text-2xl font-bold">
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
                    <h3 className="text-xl font-semibold">{profile.name}</h3>
                    <p className="text-muted-foreground">{profile.email}</p>
                    <Badge variant="outline" className="mt-2">خطة {profile.plan}</Badge>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">الاسم الكامل</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الجوال</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      className="text-left"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>تاريخ الانضمام</Label>
                    <Input value={profile.joinDate} disabled />
                  </div>
                </div>

                <Button onClick={saveProfile} variant="hero">
                  <Save className="w-4 h-4 ml-2" />
                  حفظ التغييرات
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-expense border-0 shadow-expense">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-expense-light-foreground">
                  <Key className="w-5 h-5" />
                  تغيير كلمة المرور
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute left-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  />
                </div>

                <Button onClick={changePassword} variant="outline">
                  <Save className="w-4 h-4 ml-2" />
                  تغيير كلمة المرور
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card className="bg-gradient-total border-0 shadow-total">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-total-card-foreground">
                  <CreditCard className="w-5 h-5" />
                  طرق الدفع
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة بطاقة
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockPaymentMethods.map((method) => (
                  <Card key={method.id} className="bg-gradient-subtle border-0">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">**** **** **** {method.last4}</p>
                            <p className="text-sm text-muted-foreground">
                              {method.type.toUpperCase()} • ينتهي في {method.expiryDate}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {method.isDefault && (
                            <Badge variant="secondary">افتراضي</Badge>
                          )}
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Language & Currency Tab */}
          <TabsContent value="language" className="space-y-6">
            <Card className="bg-gradient-group border-0 shadow-group">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-group-card-foreground">
                  <Globe className="w-5 h-5" />
                  اللغة والعملة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>اللغة</Label>
                    <Select 
                      value={settings.language} 
                      onValueChange={(value) => setSettings({...settings, language: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>العملة الافتراضية</Label>
                    <Select 
                      value={settings.currency} 
                      onValueChange={(value) => setSettings({...settings, currency: value})}
                    >
                      <SelectTrigger>
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
            <Card className="bg-gradient-expense border-0 shadow-expense">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-expense-light-foreground">
                  <Bell className="w-5 h-5" />
                  إعدادات الإشعارات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">إشعارات البريد الإلكتروني</p>
                      <p className="text-sm text-muted-foreground">استقبال الإشعارات عبر البريد</p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">الإشعارات الفورية</p>
                      <p className="text-sm text-muted-foreground">إشعارات على الهاتف</p>
                    </div>
                    <Switch
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) => setSettings({...settings, pushNotifications: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">تذكير المصاريف</p>
                      <p className="text-sm text-muted-foreground">تذكيرات لإدخال المصاريف</p>
                    </div>
                    <Switch
                      checked={settings.expenseReminders}
                      onCheckedChange={(checked) => setSettings({...settings, expenseReminders: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">التقارير الأسبوعية</p>
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
            <Card className="bg-gradient-total border-0 shadow-total">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-total-card-foreground">
                  <Shield className="w-5 h-5" />
                  الخصوصية والأمان
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">المصادقة الثنائية</p>
                      <p className="text-sm text-muted-foreground">حماية إضافية لحسابك</p>
                    </div>
                    <Switch
                      checked={settings.twoFactorAuth}
                      onCheckedChange={(checked) => setSettings({...settings, twoFactorAuth: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">الوضع المظلم</p>
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

                  <Button onClick={logout} variant="outline" className="w-full">
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
    </div>
  );
};

export default Settings;