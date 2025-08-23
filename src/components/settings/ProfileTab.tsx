import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Camera, Save, User, Crown, LogOut, Shield } from "lucide-react";
import { PlanBadge } from "@/components/ui/plan-badge";
import { PhoneVerificationDialog } from "./PhoneVerificationDialog";

interface ProfileTabProps {
  profile: {
    name: string;
    email: string;
    phone: string;
    avatar: string;
    avatarUrl: string;
    joinDate: string;
  };
  setProfile: (profile: any) => void;
  validationErrors: Record<string, string>;
  setValidationErrors: (errors: any) => void;
  saveProfile: () => void;
  onPhoneChange: (phone: string) => void;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
  isAdmin?: boolean;
  planBadgeConfig: any;
  isTrialActive?: boolean;
  daysLeft?: number;
  logout: () => void;
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
  planBadgeConfig,
  isTrialActive,
  daysLeft,
  logout
}: ProfileTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [pendingPhone, setPendingPhone] = useState("");
  const [originalPhone, setOriginalPhone] = useState(profile.phone);

  return (
    <div className="space-y-6">
      <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <User className="w-5 h-5 text-accent" />
            المعلومات الشخصية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
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
            <div className="text-center sm:text-right">
              <h3 className="text-xl font-semibold text-foreground flex items-center gap-2 justify-center sm:justify-start">
                {profile.name || "مستخدم"}
                {isAdmin && (
                  <Badge variant="outline" className="border-primary text-primary bg-primary/10">
                    <Crown className="w-3 h-3 ml-1" />
                    مدير
                  </Badge>
                )}
              </h3>
              <p className="text-muted-foreground">{profile.email}</p>
              <div className="flex gap-2 mt-2 justify-center sm:justify-start">
                <PlanBadge 
                  config={planBadgeConfig} 
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
              <Label htmlFor="phone" className="text-foreground flex items-center gap-2">
                رقم الجوال
                <Shield className="w-3 h-3 text-muted-foreground" />
              </Label>
              <div className="relative">
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => {
                    const newPhone = e.target.value;
                    setProfile({...profile, phone: newPhone});
                    
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
              </div>
              {validationErrors.phone && (
                <p className="text-xs text-destructive">{validationErrors.phone}</p>
              )}
              {profile.phone !== originalPhone && profile.phone.trim() && (
                <div className="flex items-center gap-2 p-2 bg-accent/10 border border-accent/20 rounded-md">
                  <Shield className="w-4 h-4 text-accent flex-shrink-0" />
                  <span className="text-xs text-accent">
                    سيتم طلب التحقق من رقم الجوال الجديد عند الحفظ
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">تاريخ الانضمام</Label>
              <Input value={profile.joinDate} disabled className="bg-background/30 border-border text-muted-foreground" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <LogOut className="w-4 h-4" />
                  تسجيل الخروج
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>تأكيد تسجيل الخروج</AlertDialogTitle>
                  <AlertDialogDescription>
                    هل أنت متأكد من أنك تريد تسجيل الخروج من حسابك؟
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={logout}>
                    تسجيل الخروج
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button 
              onClick={() => {
                // التحقق من تغيير رقم الهاتف
                if (profile.phone !== originalPhone && profile.phone.trim()) {
                  setPendingPhone(profile.phone);
                  setShowPhoneVerification(true);
                } else {
                  saveProfile();
                }
              }} 
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              حفظ التغييرات
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* نافذة التحقق من الهاتف */}
      <PhoneVerificationDialog
        open={showPhoneVerification}
        onOpenChange={setShowPhoneVerification}
        phoneNumber={pendingPhone}
        onSuccess={(verifiedPhone) => {
          setOriginalPhone(verifiedPhone);
          onPhoneChange(verifiedPhone);
          setShowPhoneVerification(false);
          saveProfile();
        }}
        onCancel={() => {
          // العودة للرقم الأصلي
          setProfile({...profile, phone: originalPhone});
          setPendingPhone("");
          setShowPhoneVerification(false);
        }}
      />
    </div>
  );
}