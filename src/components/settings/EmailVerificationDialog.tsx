import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { Mail, RefreshCw, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface EmailVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  userName?: string;
  onSuccess: () => void;
  onResend: () => Promise<void>;
}

export function EmailVerificationDialog({
  open,
  onOpenChange,
  email,
  userName,
  onSuccess,
  onResend,
}: EmailVerificationDialogProps) {
  const { t } = useTranslation(["settings"]);
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setCode(["", "", "", "", "", ""]);
      setTimeLeft(600);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [open]);

  // Countdown timer
  useEffect(() => {
    if (!open || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [open, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleInputChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData.length === 6) {
      const newCode = pastedData.split("");
      setCode(newCode);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      toast.error(t("settings:email_verification.enter_code"));
      return;
    }

    setVerifying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("verify-email-code", {
        body: { code: fullCode, email },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Verification failed");
      }

      if (response.data?.error) {
        toast.error(response.data.message || t("settings:email_verification.invalid_code"));
        return;
      }

      toast.success(t("settings:email_verification.success"));
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Verification error:", error);
      toast.error(error.message || t("settings:email_verification.error"));
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await onResend();
      setTimeLeft(600);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      toast.success(t("settings:email_verification.resent"));
    } catch (error) {
      toast.error(t("settings:email_verification.resend_error"));
    } finally {
      setResending(false);
    }
  };

  const isCodeComplete = code.every((digit) => digit !== "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">
            {t("settings:email_verification.title")}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t("settings:email_verification.description")}
            <br />
            <span className="font-medium text-foreground" dir="ltr">
              {email}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* OTP Input */}
          <div className="flex justify-center gap-2" dir="ltr">
            {code.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="h-12 w-12 text-center text-xl font-bold"
              />
            ))}
          </div>

          {/* Timer */}
          <div className="text-center">
            {timeLeft > 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("settings:email_verification.expires_in")}{" "}
                <span className="font-mono font-medium text-foreground">
                  {formatTime(timeLeft)}
                </span>
              </p>
            ) : (
              <p className="text-sm text-destructive">
                {t("settings:email_verification.expired")}
              </p>
            )}
          </div>

          {/* Verify Button */}
          <Button
            onClick={handleVerify}
            disabled={!isCodeComplete || verifying || timeLeft <= 0}
            className="w-full gap-2"
          >
            {verifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("settings:email_verification.verifying")}
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                {t("settings:email_verification.verify")}
              </>
            )}
          </Button>

          {/* Resend Button */}
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResend}
              disabled={resending}
              className="gap-2"
            >
              {resending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("settings:email_verification.resending")}
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  {t("settings:email_verification.resend")}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
