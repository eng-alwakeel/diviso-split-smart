import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DiceResult, DualDiceResult } from "@/data/diceData";
import { Copy, MessageCircle, Twitter, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareDiceResultProps {
  result: DiceResult | null;
  dualResult: DualDiceResult | null;
  onClose: () => void;
  className?: string;
}

export function ShareDiceResult({
  result,
  dualResult,
  onClose,
  className
}: ShareDiceResultProps) {
  const { t, i18n } = useTranslation('dice');
  const { toast } = useToast();
  const isRTL = i18n.language === 'ar';
  const [copied, setCopied] = useState(false);

  const getShareText = () => {
    const appUrl = "https://diviso.app";
    
    if (dualResult) {
      const activityLabel = isRTL 
        ? dualResult.activity.face.labelAr 
        : dualResult.activity.face.labelEn;
      const foodLabel = isRTL 
        ? dualResult.food.face.labelAr 
        : dualResult.food.face.labelEn;
      
      return isRTL
        ? `🎲 النرد قرر:\n🎯 ${dualResult.activity.face.emoji} ${activityLabel}\n🍽️ ${dualResult.food.face.emoji} ${foodLabel}\n\nخلّ النرد يقرر عنكم في Diviso\n${appUrl}`
        : `🎲 The dice decided:\n🎯 ${dualResult.activity.face.emoji} ${activityLabel}\n🍽️ ${dualResult.food.face.emoji} ${foodLabel}\n\nLet the dice decide in Diviso\n${appUrl}`;
    }
    
    if (result) {
      const label = isRTL ? result.face.labelAr : result.face.labelEn;
      
      return isRTL
        ? `🎲 النرد قرر: ${result.face.emoji} ${label}!\n\nخلّ النرد يقرر عنكم في Diviso\n${appUrl}`
        : `🎲 The dice decided: ${result.face.emoji} ${label}!\n\nLet the dice decide in Diviso\n${appUrl}`;
    }
    
    return "";
  };

  const shareText = getShareText();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast({
        title: t('share.copied'),
        duration: 2000
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('share.title')}</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Preview */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <pre className="text-sm whitespace-pre-wrap font-sans text-foreground">
            {shareText}
          </pre>
        </CardContent>
      </Card>

      {/* Share Buttons */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          variant="outline"
          className="flex-col h-auto py-4 gap-2 hover:bg-green-500/10 hover:border-green-500/50"
          onClick={handleWhatsApp}
        >
          <MessageCircle className="w-6 h-6 text-green-500" />
          <span className="text-xs">WhatsApp</span>
        </Button>
        
        <Button
          variant="outline"
          className="flex-col h-auto py-4 gap-2 hover:bg-blue-500/10 hover:border-blue-500/50"
          onClick={handleTwitter}
        >
          <Twitter className="w-6 h-6 text-blue-500" />
          <span className="text-xs">Twitter</span>
        </Button>
        
        <Button
          variant="outline"
          className={cn(
            "flex-col h-auto py-4 gap-2",
            copied && "bg-green-500/10 border-green-500/50"
          )}
          onClick={handleCopy}
        >
          <Copy className={cn("w-6 h-6", copied ? "text-green-500" : "text-muted-foreground")} />
          <span className="text-xs">{copied ? t('share.copied_btn') : t('share.copy')}</span>
        </Button>
      </div>
    </div>
  );
}
