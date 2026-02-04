import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DiceResult, DualDiceResult } from "@/data/diceData";
import { Copy, MessageCircle, Twitter, X, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { shareNative, isNativePlatform } from "@/lib/native";
import { useAnalyticsEvents } from "@/hooks/useAnalyticsEvents";

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
  const { trackEvent } = useAnalyticsEvents();
  const isRTL = i18n.language === 'ar';
  const [copied, setCopied] = useState(false);
  const isNative = isNativePlatform();

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
      trackEvent('dice_shared', { platform: 'copy' });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
    trackEvent('dice_shared', { platform: 'whatsapp' });
  };

  const handleTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
    trackEvent('dice_shared', { platform: 'twitter' });
  };

  const handleNativeShare = async () => {
    const success = await shareNative({
      title: t('share.native_title'),
      text: shareText,
      url: 'https://diviso.app',
      dialogTitle: t('share.title')
    });
    
    if (success) {
      trackEvent('dice_shared', { platform: 'native' });
    }
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

      {/* Native Share Button (for mobile) */}
      {isNative && (
        <Button
          className="w-full gap-2"
          onClick={handleNativeShare}
        >
          <Share2 className="w-5 h-5" />
          {t('share.native_share')}
        </Button>
      )}

      {/* Share Buttons */}
      <div className={cn("grid gap-3", isNative ? "grid-cols-3" : "grid-cols-3")}>
        <Button
          variant="outline"
          className="flex-col h-auto py-4 gap-2 hover:bg-accent hover:border-accent"
          onClick={handleWhatsApp}
        >
          <MessageCircle className="w-6 h-6 text-[hsl(142,70%,45%)]" />
          <span className="text-xs">WhatsApp</span>
        </Button>
        
        <Button
          variant="outline"
          className="flex-col h-auto py-4 gap-2 hover:bg-accent hover:border-accent"
          onClick={handleTwitter}
        >
          <Twitter className="w-6 h-6 text-[hsl(203,89%,53%)]" />
          <span className="text-xs">Twitter</span>
        </Button>
        
        <Button
          variant="outline"
          className={cn(
            "flex-col h-auto py-4 gap-2",
            copied && "bg-accent border-accent"
          )}
          onClick={handleCopy}
        >
          <Copy className={cn("w-6 h-6", copied ? "text-[hsl(142,70%,45%)]" : "text-muted-foreground")} />
          <span className="text-xs">{copied ? t('share.copied_btn') : t('share.copy')}</span>
        </Button>
      </div>
    </div>
  );
}
