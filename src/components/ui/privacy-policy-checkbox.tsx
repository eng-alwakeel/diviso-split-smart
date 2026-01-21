import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";

interface PrivacyPolicyCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export const PrivacyPolicyCheckbox = ({ 
  checked, 
  onCheckedChange,
  className = "" 
}: PrivacyPolicyCheckboxProps) => {
  const { t } = useTranslation('auth');
  const { isRTL } = useLanguage();

  const handlePrivacyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open('/privacy-policy', '_blank');
  };

  const handleTermsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open('/terms', '_blank');
  };

  return (
    <div className={`flex items-start space-x-2 ${className}`}>
      <Checkbox
        id="privacy-policy"
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="mt-1"
      />
      <Label 
        htmlFor="privacy-policy" 
        className="text-sm leading-relaxed cursor-pointer flex-1"
      >
        {isRTL ? (
          <>
            أوافق على{" "}
            <button
              onClick={handlePrivacyClick}
              className="text-primary hover:text-primary/80 underline underline-offset-4 inline-flex items-center gap-1"
              type="button"
            >
              سياسة الخصوصية
              <ExternalLink className="h-3 w-3" />
            </button>
            {" "}و{" "}
            <button
              onClick={handleTermsClick}
              className="text-primary hover:text-primary/80 underline underline-offset-4 inline-flex items-center gap-1"
              type="button"
            >
              الشروط والأحكام
              <ExternalLink className="h-3 w-3" />
            </button>
          </>
        ) : (
          <>
            I agree to the{" "}
            <button
              onClick={handlePrivacyClick}
              className="text-primary hover:text-primary/80 underline underline-offset-4 inline-flex items-center gap-1"
              type="button"
            >
              Privacy Policy
              <ExternalLink className="h-3 w-3" />
            </button>
            {" "}and{" "}
            <button
              onClick={handleTermsClick}
              className="text-primary hover:text-primary/80 underline underline-offset-4 inline-flex items-center gap-1"
              type="button"
            >
              Terms & Conditions
              <ExternalLink className="h-3 w-3" />
            </button>
          </>
        )}
      </Label>
    </div>
  );
};
