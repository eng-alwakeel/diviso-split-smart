import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Camera, Save, User, Crown, LogOut, Shield, Mail, Pencil, X, Check, CheckCircle2, Clock, Bell, BellOff, Star } from "lucide-react";
import { PhoneVerificationDialog } from "./PhoneVerificationDialog";
import { PhoneInputWithCountry } from "@/components/ui/phone-input-with-country";
import { EmailVerificationDialog } from "./EmailVerificationDialog";
import { ImageCropDialog } from "./ImageCropDialog";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useFoundingUser } from "@/hooks/useFoundingUser";
import { FoundingBadge } from "@/components/ui/founding-badge";
import { UserNumberBadge } from "@/components/ui/user-number-badge";
import { 
  isBrowserNotificationSupported, 
  getNotificationPermission, 
  requestNotificationPermission,
  saveNotificationPreference,
  getNotificationPreference 
} from "@/lib/browserNotifications";

interface ProfileTabProps {
  profile: {
    name: string;
    email: string;
    phone: string;
    avatar: string;
    avatarUrl: string;
    joinDate: string;
    city?: string;
    bio?: string;
  };
  setProfile: (profile: any) => void;
  validationErrors: Record<string, string>;
  setValidationErrors: (errors: any) => void;
  saveProfile: () => void;
  onPhoneChange: (phone: string) => void;
  handleImageUpload: (file: File) => void;
  uploading: boolean;
  isAdmin?: boolean;
  logout: () => void;
  originalEmail?: string;
}

export function ProfileTab({
  profile,
  setProfile,
  validationErrors,
  setValidationErrors,
  saveProfile,
  onPhoneChange,
  handleImageUpload,
  uploading,
  isAdmin,
  logout,
  originalEmail = ""
}: ProfileTabProps) {
  const { t } = useTranslation(['settings', 'auth']);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get current user ID
  const { data: userId } = useQuery({
    queryKey: ['current-user-for-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    },
    staleTime: 5 * 60 * 1000,
  });
  
  const { userNumber, isFoundingUser, lastActiveAt } = useFoundingUser(userId ?? undefined);
  
  // حالات الوضع
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalProfile, setOriginalProfile] = useState(profile);
  
  // حالات التحقق
  const [phoneVerified, setPhoneVerified] = useState(true);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [sendingEmailVerification, setSendingEmailVerification] = useState(false);
  
  // نوافذ التحقق
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [pendingPhone, setPendingPhone] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  
  // قص الصورة
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // إشعارات المتصفح
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');

  // تحميل حالة إشعارات المتصفح
  useEffect(() => {
    setBrowserNotificationsEnabled(getNotificationPreference());
    setNotificationPermission(getNotificationPermission());
  }, []);

  // تحديث الحالة الأصلية عند تغيير البروفايل من الخارج
  useEffect(() => {
    if (!isEditMode) {
      setOriginalProfile(profile);
    }
  }, [profile, isEditMode]);

  // التحقق من تغيير البيانات
  const hasEmailChanged = profile.email !== originalProfile.email && profile.email.trim() !== "";
  const hasPhoneChanged = profile.phone !== originalProfile.phone && profile.phone.trim() !== "";
  const hasNameChanged = profile.name !== originalProfile.name;

  // هل يمكن الحفظ؟
  const canSave = () => {
    // إذا تغير الإيميل يجب إرسال التأكيد
    if (hasEmailChanged && !emailVerificationSent) return false;
    // إذا تغير الجوال يجب التحقق منه
    if (hasPhoneChanged && !phoneVerified) return false;
    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setCropDialogOpen(true);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    const file = new File([croppedBlob], 'avatar.png', { type: 'image/png' });
    handleImageUpload(file);
    setSelectedImage(null);
  };

  const handleEnterEditMode = () => {
    setOriginalProfile({ ...profile });
    setIsEditMode(true);
    setPhoneVerified(true);
    setEmailVerificationSent(false);
  };

  const handleCancelEdit = () => {
    setProfile({ ...originalProfile });
    setIsEditMode(false);
    setPhoneVerified(true);
    setEmailVerificationSent(false);
    setValidationErrors({});
  };

  // تفعيل إشعارات المتصفح
  const handleEnableBrowserNotifications = async () => {
    if (!isBrowserNotificationSupported()) {
      toast.error(t('settings:profile.notifications_not_supported'));
      return;
    }

    const granted = await requestNotificationPermission();
    setNotificationPermission(getNotificationPermission());
    
    if (granted) {
      setBrowserNotificationsEnabled(true);
      saveNotificationPreference(true);
      toast.success(t('settings:profile.notifications_enabled'));
    } else {
      toast.error(t('settings:profile.notifications_denied'));
    }
  };

  // إيقاف إشعارات المتصفح
  const handleDisableBrowserNotifications = () => {
    setBrowserNotificationsEnabled(false);
    saveNotificationPreference(false);
    toast.success(t('settings:profile.notifications_disabled'));
  };

  const sendVerificationEmail = async () => {
    // استخدام Supabase المدمج لتغيير البريد الإلكتروني
    const { error } = await supabase.auth.updateUser({
      email: profile.email,
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const handleSendEmailVerification = async () => {
    if (!profile.email.trim()) return;
    
    setSendingEmailVerification(true);
    try {
      await sendVerificationEmail();
      
      setPendingEmail(profile.email);
      setEmailVerificationSent(true);
      setShowEmailVerification(true);
      toast.success(t('settings:toast.email_verification_sent'));
    } catch (error: any) {
      toast.error(error.message || t('settings:errors.email_verification_failed'));
    } finally {
      setSendingEmailVerification(false);
    }
  };

  const handleVerifyPhone = () => {
    setPendingPhone(profile.phone);
    setShowPhoneVerification(true);
  };

  const handleSave = () => {
    if (!canSave()) return;
    
    saveProfile();
    setIsEditMode(false);
    setOriginalProfile({ ...profile });
    setPhoneVerified(true);
    setEmailVerificationSent(false);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-foreground">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-accent" />
              {t('settings:profile.title')}
            </div>
            {!isEditMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEnterEditMode}
                className="gap-2"
              >
                <Pencil className="w-4 h-4" />
                {t('settings:profile.edit_request')}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* قسم الصورة والمعلومات الأساسية */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                {profile.avatarUrl ? (
                  <AvatarImage src={profile.avatarUrl} alt={t('settings:profile.avatar_alt')} />
                ) : (
                  <AvatarFallback className="bg-accent text-background text-2xl font-bold">
                    {profile.avatar}
                  </AvatarFallback>
                )}
              </Avatar>
              {isEditMode && (
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
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <ImageCropDialog
              open={cropDialogOpen}
              onOpenChange={setCropDialogOpen}
              imageSrc={selectedImage}
              onCropComplete={handleCropComplete}
            />
            
            <div className="text-center sm:text-start">
              <h3 className="text-xl font-semibold text-foreground flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                {profile.name || t('settings:profile.default_user')}
                {userNumber && (
                  <UserNumberBadge 
                    userNumber={userNumber} 
                    isFoundingUser={isFoundingUser} 
                    size="sm"
                  />
                )}
                {isAdmin && (
                  <Badge variant="outline" className="border-primary text-primary bg-primary/10">
                    <Crown className="w-3 h-3 me-1" />
                    {t('settings:profile.admin_badge')}
                  </Badge>
                )}
              </h3>
              <p className="text-muted-foreground">{originalProfile.email}</p>
            </div>
          </div>

          <Separator />

          {/* الحقول */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* الاسم */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">{t('settings:profile.full_name')}</Label>
              {isEditMode ? (
                <>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => {
                      setProfile({...profile, name: e.target.value});
                      if (validationErrors.name) {
                        setValidationErrors((prev: Record<string, string>) => ({...prev, name: ""}));
                      }
                    }}
                    className={`bg-background/50 border-border text-foreground ${
                      validationErrors.name ? 'border-destructive' : ''
                    }`}
                  />
                  {validationErrors.name && (
                    <p className="text-xs text-destructive">{validationErrors.name}</p>
                  )}
                </>
              ) : (
                <div className="p-3 bg-background/30 border border-border rounded-md text-foreground">
                  {profile.name || '-'}
                </div>
              )}
            </div>

            {/* الإيميل */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground flex items-center gap-2">
                {t('settings:profile.email')}
              {!hasEmailChanged && profile.email && profile.email.trim() !== '' && (
                  <Badge variant="outline" className="border-green-500/50 text-green-600 bg-green-500/10 text-xs">
                    <CheckCircle2 className="w-3 h-3 me-1" />
                    {t('settings:profile.verified')}
                  </Badge>
                )}
              </Label>
              {isEditMode ? (
                <>
                  <div className="flex gap-2">
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => {
                        setProfile({...profile, email: e.target.value});
                        setEmailVerificationSent(false);
                        if (validationErrors.email) {
                          setValidationErrors((prev: Record<string, string>) => ({...prev, email: ""}));
                        }
                      }}
                      className={`bg-background/50 border-border text-foreground flex-1 ${
                        validationErrors.email ? 'border-destructive' : ''
                      }`}
                    />
                    {hasEmailChanged && (
                      <Button
                        variant={emailVerificationSent ? "outline" : "secondary"}
                        size="sm"
                        onClick={handleSendEmailVerification}
                        disabled={sendingEmailVerification || emailVerificationSent}
                        className="shrink-0"
                      >
                        {sendingEmailVerification ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : emailVerificationSent ? (
                          <>
                            <Check className="w-4 h-4 me-1" />
                            {t('settings:profile.sent')}
                          </>
                        ) : (
                          <>
                            <Mail className="w-4 h-4 me-1" />
                            {t('settings:profile.verify_email')}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  {validationErrors.email && (
                    <p className="text-xs text-destructive">{validationErrors.email}</p>
                  )}
                  {hasEmailChanged && emailVerificationSent && (
                    <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded-md">
                      <Clock className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-xs text-green-600">
                        {t('settings:profile.email_pending')}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-3 bg-background/30 border border-border rounded-md text-foreground">
                  {profile.email || '-'}
                </div>
              )}
            </div>

            {/* الجوال */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-foreground flex items-center gap-2">
                {t('settings:profile.phone')}
                {!hasPhoneChanged && profile.phone && (
                  <Badge variant="outline" className="border-green-500/50 text-green-600 bg-green-500/10 text-xs">
                    <CheckCircle2 className="w-3 h-3 me-1" />
                    {t('settings:profile.verified')}
                  </Badge>
                )}
              </Label>
              {isEditMode ? (
                <>
                  <PhoneInputWithCountry
                    value={profile.phone}
                    onChange={(newPhone) => {
                      setProfile({...profile, phone: newPhone});
                      setPhoneVerified(false);
                      if (validationErrors.phone) {
                        setValidationErrors((prev: Record<string, string>) => ({...prev, phone: ""}));
                      }
                    }}
                    placeholder="501234567"
                    disabled={!isEditMode}
                  />
                  {hasPhoneChanged && (
                    <Button
                      variant={phoneVerified ? "outline" : "secondary"}
                      size="sm"
                      onClick={handleVerifyPhone}
                      disabled={phoneVerified}
                      className="w-full"
                    >
                      {phoneVerified ? (
                        <>
                          <Check className="w-4 h-4 me-1" />
                          {t('settings:profile.verified')}
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 me-1" />
                          {t('settings:profile.verify_phone')}
                        </>
                      )}
                    </Button>
                  )}
                  {validationErrors.phone && (
                    <p className="text-xs text-destructive">{validationErrors.phone}</p>
                  )}
                  {hasPhoneChanged && phoneVerified && (
                    <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded-md">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-xs text-green-600">
                        {t('settings:profile.phone_verified_success')}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-3 bg-background/30 border border-border rounded-md text-foreground" dir="ltr">
                  {profile.phone || '-'}
                </div>
              )}
            </div>

            {/* المدينة */}
            <div className="space-y-2">
              <Label htmlFor="city" className="text-foreground">
                {t('settings:profile.city', 'المدينة')}
                <span className="text-muted-foreground text-xs ms-1">({t('settings:profile.optional', 'اختياري')})</span>
              </Label>
              {isEditMode ? (
                <Input
                  id="city"
                  value={profile.city || ''}
                  onChange={(e) => setProfile({...profile, city: e.target.value})}
                  placeholder={t('settings:profile.city_placeholder', 'مثال: الرياض')}
                  className="bg-background/50 border-border text-foreground"
                />
              ) : (
                <div className="p-3 bg-background/30 border border-border rounded-md text-foreground">
                  {profile.city || '-'}
                </div>
              )}
            </div>

            {/* النبذة */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="bio" className="text-foreground flex items-center justify-between">
                <span>
                  {t('settings:profile.bio', 'نبذة قصيرة')}
                  <span className="text-muted-foreground text-xs ms-1">({t('settings:profile.optional', 'اختياري')})</span>
                </span>
                {isEditMode && (
                  <span className="text-xs text-muted-foreground">
                    {(profile.bio?.length || 0)}/120
                  </span>
                )}
              </Label>
              {isEditMode ? (
                <Textarea
                  id="bio"
                  value={profile.bio || ''}
                  onChange={(e) => {
                    if (e.target.value.length <= 120) {
                      setProfile({...profile, bio: e.target.value});
                    }
                  }}
                  placeholder={t('settings:profile.bio_placeholder', 'اكتب نبذة قصيرة عنك...')}
                  className="bg-background/50 border-border text-foreground resize-none"
                  rows={2}
                  maxLength={120}
                />
              ) : (
                <div className="p-3 bg-background/30 border border-border rounded-md text-foreground min-h-[60px]">
                  {profile.bio || '-'}
                </div>
              )}
            </div>

            {/* تاريخ الانضمام */}
            <div className="space-y-2">
              <Label className="text-foreground">{t('settings:profile.join_date')}</Label>
              <div className="p-3 bg-background/30 border border-border rounded-md text-muted-foreground">
                {profile.joinDate}
              </div>
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
            {isEditMode ? (
              <>
                <Button 
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  {t('settings:profile.cancel')}
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={!canSave()}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  {t('settings:profile.save')}
                </Button>
              </>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <LogOut className="w-4 h-4" />
                    {t('settings:profile.logout')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('settings:profile.logout_confirm_title')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('settings:profile.logout_confirm_description')}
                      <br />
                      {t('settings:profile.logout_confirm_description_detail')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('settings:profile.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={logout} className="bg-destructive hover:bg-destructive/90">
                      {t('settings:profile.logout')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* قسم إشعارات المتصفح */}
      <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Bell className="w-5 h-5 text-accent" />
            {t('settings:profile.browser_notifications')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('settings:profile.browser_notifications_desc')}
          </p>
          
          {notificationPermission === 'unsupported' ? (
            <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              {t('settings:profile.notifications_not_supported')}
            </div>
          ) : notificationPermission === 'denied' ? (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              {t('settings:profile.notifications_blocked')}
            </div>
          ) : browserNotificationsEnabled ? (
            <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">{t('settings:profile.notifications_active')}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisableBrowserNotifications}
                className="gap-2"
              >
                <BellOff className="w-4 h-4" />
                {t('settings:profile.disable_notifications')}
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleEnableBrowserNotifications}
              className="gap-2 w-full sm:w-auto"
            >
              <Bell className="w-4 h-4" />
              {t('settings:profile.enable_notifications')}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Founding User Section */}
      {isFoundingUser && userNumber && (
        <Card className="bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-orange-500/10 border border-amber-400/30 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              {t('auth:founding_program.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* رقم المستخدم */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('auth:founding_program.you_are_user')}</span>
              <span className="text-2xl font-bold text-foreground">#{userNumber}</span>
            </div>
            
            {/* الشارة */}
            <div className="flex justify-center">
              <FoundingBadge userNumber={userNumber} size="lg" />
            </div>
            
            {/* النقاط الشهرية */}
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">{t('auth:founding_program.monthly_credits_section')}</h4>
              <p className="text-sm text-muted-foreground">{t('auth:founding_program.monthly_credits_desc')}</p>
              <p className="text-xs text-muted-foreground">{t('auth:founding_program.activity_requirement')}</p>
              {lastActiveAt && (
                <p className="text-xs text-muted-foreground mt-2">
                  {t('auth:founding_program.last_activity')}: {new Date(lastActiveAt).toLocaleDateString('ar-SA')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* نافذة التحقق من الهاتف */}
      <PhoneVerificationDialog
        open={showPhoneVerification}
        onOpenChange={setShowPhoneVerification}
        phoneNumber={pendingPhone}
        onSuccess={(verifiedPhone) => {
          setPhoneVerified(true);
          onPhoneChange(verifiedPhone);
          setShowPhoneVerification(false);
        }}
        onCancel={() => {
          setPendingPhone("");
          setShowPhoneVerification(false);
        }}
      />

      {/* نافذة التحقق من البريد */}
      <EmailVerificationDialog
        open={showEmailVerification}
        onOpenChange={setShowEmailVerification}
        email={pendingEmail}
        userName={profile.name}
        onSuccess={() => {
          setEmailVerificationSent(false);
          setShowEmailVerification(false);
          toast.success(t('settings:email_verification.success'));
        }}
        onResend={sendVerificationEmail}
      />
    </div>
  );
}
