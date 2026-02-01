import { Info, Handshake } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/safe-tooltip";
import { Badge } from "@/components/ui/badge";

interface PartnerBadgeProps {
  className?: string;
}

export function PartnerBadge({ className }: PartnerBadgeProps) {
  const { t } = useTranslation("recommendations");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant="secondary" 
          className={`gap-1 bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 cursor-help ${className}`}
        >
          <Handshake className="h-3 w-3" />
          <span className="text-xs">{t("partner_badge")}</span>
          <Info className="h-3 w-3 opacity-70" />
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="text-sm">{t("partner_disclosure")}</p>
      </TooltipContent>
    </Tooltip>
  );
}
