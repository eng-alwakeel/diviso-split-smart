import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Key, Trash2, Mail, Phone, CheckCircle, Loader2, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSecurePasswordChange, VerificationMethod } from "@/hooks/useSecurePasswordChange";
import { NewPasswordDialog } from "./NewPasswordDialog";
import { PhonePasswordResetDialog } from "./PhonePasswordResetDialog";

interface SecurityTabProps {
  passwordData?: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  setPasswordData?: (data: any) => void;
  handleChangePassword?: () => Promise<void>;
  passwordLoading?: boolean;
  deleteAccount: () => Promise<void>;
}

export function SecurityTab({
  deleteAccount
}: SecurityTabProps) {
  const { t } = useTranslation(['settings', 'common']);
  const {
    loading,
    step,
    verificationMethod,
    resendCountdown,
    getUserVerificationInfo,
    initiatePasswordChange,
    verifyOtpAndSetPassword,
    setNewPassword,
    resendOtp,
    resetState,
    maskEmail,
    maskPhone
  } = useSecurePasswordChange();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [availableMethod, setAvailableMethod] = useState<VerificationMethod>('none');
  const [showNewPasswordDialog, setShowNewPasswordDialog] = useState(false);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [destination, setDestination] = useState("");

  // Load user verification info
  useEffect(() => {
    const loadVerificationInfo = async () => {
      const info = await getUserVerificationInfo();
      setUserEmail(info.email);
      setUserPhone(info.phone);
      setAvailableMethod(info.method);
    };
    loadVerificationInfo();
  }, [getUserVerificationInfo]);

  // Handle URL params for email redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'reset') {
      setShowNewPasswordDialog(true);
      // Clean URL
      const newUrl = window.location.pathname + '?tab=privacy';
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  // Open phone dialog when step changes to verify
  useEffect(() => {
    if (step === 'verify' && verificationMethod === 'phone') {
      setShowPhoneDialog(true);
    }
  }, [step, verificationMethod]);

  const handleInitiateChange = async () => {
    const result = await initiatePasswordChange();
    if (result.success) {
      setDestination(result.destination || "");
      
      if (result.method === 'phone') {
        setShowPhoneDialog(true);
      }
      // For email, user will receive a link and come back
    }
  };

  const handlePhoneSubmit = async (otp: string, newPassword: string): Promise<boolean> => {
    return await verifyOtpAndSetPassword(otp, newPassword);
  };

  const handleEmailPasswordSubmit = async (password: string): Promise<boolean> => {
    return await setNewPassword(password);
  };

  const handlePhoneDialogClose = () => {
    setShowPhoneDialog(false);
    resetState();
  };

  return (
    <div className="space-y-6">
      {/* Change Password - New Secure Method */}
      <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Key className="w-5 h-5 text-accent" />
            {t('settings:security.title')}
          </CardTitle>
          <CardDescription>
            {t('settings:security.secure_change_description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Show available verification method */}
          {availableMethod !== 'none' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                {availableMethod === 'email' ? (
                  <>
                    <Mail className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {t('settings:security.verify_via_email')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {userEmail && maskEmail(userEmail)}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Phone className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {t('settings:security.verify_via_phone')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {userPhone && maskPhone(userPhone)}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Status messages */}
              {step === 'sent' && verificationMethod === 'email' && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-primary">
                  <CheckCircle className="h-5 w-5" />
                  <p className="text-sm">{t('settings:security.email_sent_check_inbox')}</p>
                </div>
              )}

              <Button 
                onClick={handleInitiateChange} 
                disabled={loading || step === 'sent'}
                className="w-full gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                {step === 'sent' 
                  ? t('settings:security.verification_sent')
                  : t('settings:security.request_password_change')
                }
              </Button>

              {step === 'sent' && verificationMethod === 'email' && (
                <p className="text-xs text-muted-foreground text-center">
                  {t('settings:security.didnt_receive_email')}
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="px-1 h-auto"
                    onClick={() => resetState()}
                  >
                    {t('settings:security.try_again')}
                  </Button>
                </p>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">
                {t('settings:security.no_verification_method_available')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('settings:security.add_email_or_phone_first')}
              </p>
            </div>
          )}
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

      {/* Phone Password Reset Dialog */}
      <PhonePasswordResetDialog
        open={showPhoneDialog}
        onOpenChange={handlePhoneDialogClose}
        phone={userPhone || ""}
        maskedPhone={userPhone ? maskPhone(userPhone) : ""}
        onSubmit={handlePhoneSubmit}
        onResend={resendOtp}
        resendCountdown={resendCountdown}
        loading={loading}
      />

      {/* Email Password Reset Dialog (after redirect) */}
      <NewPasswordDialog
        open={showNewPasswordDialog}
        onOpenChange={setShowNewPasswordDialog}
        onSubmit={handleEmailPasswordSubmit}
        loading={loading}
      />
    </div>
  );
}
