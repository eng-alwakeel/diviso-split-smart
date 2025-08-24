import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ExternalLink } from "lucide-react";

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
  const handleLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open('/privacy-policy', '_blank');
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
        أوافق على{" "}
        <button
          onClick={handleLinkClick}
          className="text-primary hover:text-primary/80 underline underline-offset-4 inline-flex items-center gap-1"
          type="button"
        >
          سياسة الخصوصية
          <ExternalLink className="h-3 w-3" />
        </button>
        {" "}وشروط الاستخدام
      </Label>
    </div>
  );
};