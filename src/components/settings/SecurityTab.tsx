import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Key, Eye, EyeOff, Save, Trash2 } from "lucide-react";
import { useSecureValidation } from "@/hooks/useSecureValidation";
import { useSecurityAudit } from "@/hooks/useSecurityAudit";

import { useTranslation } from "react-i18next";

interface SecurityTabProps {
  passwordData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  setPasswordData: (data: any) => void;
  handleChangePassword: () => Promise<void>;
  passwordLoading: boolean;
  deleteAccount: () => Promise<void>;
}

export function SecurityTab({
  passwordData,
  setPasswordData,
  handleChangePassword,
  passwordLoading,
  deleteAccount
}: SecurityTabProps) {
  const { t } = useTranslation(['settings']);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const { validateField, errors } = useSecureValidation();
  const { logSecurityEvent, validateInput } = useSecurityAudit();
  
  const handleSecurePasswordChange = async () => {
    // Log password change attempt
    await logSecurityEvent('password_change_attempt', 'profiles');
    
    // Validate inputs
    if (!validateInput(passwordData.currentPassword) || 
        !validateInput(passwordData.newPassword) || 
        !validateInput(passwordData.confirmPassword)) {
      return;
    }
    
    await handleChangePassword();
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Key className="w-5 h-5 text-accent" />
            {t('settings:security.title')}
          </CardTitle>
          <CardDescription>{t('settings:security.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-foreground">{t('settings:security.current_password')}</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPasswords.current ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                className="bg-background/50 border-border text-foreground pe-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute end-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowPasswords(prev => ({...prev, current: !prev.current}))}
              >
                {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-foreground">{t('settings:security.new_password')}</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPasswords.new ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                className="bg-background/50 border-border text-foreground pe-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute end-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowPasswords(prev => ({...prev, new: !prev.new}))}
              >
                {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-foreground">{t('settings:security.confirm_password')}</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPasswords.confirm ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                className="bg-background/50 border-border text-foreground pe-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute end-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowPasswords(prev => ({...prev, confirm: !prev.confirm}))}
              >
                {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSecurePasswordChange} disabled={passwordLoading} className="gap-2">
              {passwordLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {t('settings:security.save_password')}
            </Button>
          </div>
        </CardContent>
      </Card>


      {/* Account Actions */}
      <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-foreground">{t('settings:security.account_management')}</CardTitle>
          <CardDescription>{t('settings:security.account_options')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2 w-full">
                <Trash2 className="w-4 h-4" />
                {t('settings:security.delete_account')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('settings:security.delete_confirm_title')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('settings:security.delete_confirm_desc')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('settings:security.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={deleteAccount} className="bg-destructive text-destructive-foreground">
                  {t('settings:security.delete_permanent')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
