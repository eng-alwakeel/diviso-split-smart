import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, TrendingUp, TrendingDown, Users, Receipt, Coins, MessageCircle, Twitter, Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MonthlyStats } from '@/hooks/useAchievements';
import { cn } from '@/lib/utils';

interface MonthlyWrapCardProps {
  stats: MonthlyStats | null;
  onShare?: () => void;
}

const MONTH_NAMES_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MonthlyWrapCard: React.FC<MonthlyWrapCardProps> = ({ stats, onShare }) => {
  const { t, i18n } = useTranslation('dashboard');
  const isRTL = i18n.language === 'ar';
  const [copied, setCopied] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  if (!stats || !stats.success) return null;

  const monthName = isRTL 
    ? MONTH_NAMES_AR[stats.month - 1] 
    : MONTH_NAMES_EN[stats.month - 1];

  const hasSavings = stats.savings > 0;

  const getShareText = () => {
    return isRTL
      ? `📊 ملخصي لشهر ${monthName} ${stats.year} في Diviso!\n\n💰 إجمالي المصاريف: ${stats.total_expenses.toLocaleString()} ريال\n📈 أكثر فئة: ${stats.top_category}\n${hasSavings ? `📉 وفرت: ${stats.savings.toLocaleString()} ريال` : ''}\n👥 المجموعات النشطة: ${stats.groups_count}\n\nجرب التطبيق: https://diviso.app`
      : `📊 My ${monthName} ${stats.year} wrap in Diviso!\n\n💰 Total expenses: ${stats.total_expenses.toLocaleString()} SAR\n📈 Top category: ${stats.top_category}\n${hasSavings ? `📉 Saved: ${stats.savings.toLocaleString()} SAR` : ''}\n👥 Active groups: ${stats.groups_count}\n\nTry the app: https://diviso.app`;
  };

  const handleShare = async (platform: string) => {
    const shareText = getShareText();
    
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
    } else if (platform === 'copy') {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    
    onShare?.();
    setShowShareOptions(false);
  };

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader className="pb-2">
        <CardTitle className={cn("flex items-center gap-2 text-lg", isRTL && "flex-row-reverse")}>
          <span className="text-2xl">📊</span>
          {isRTL ? `ملخصك لشهر ${monthName} ${stats.year}` : `Your ${monthName} ${stats.year} Wrap`}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className={cn("flex items-center gap-2 bg-background/50 rounded-lg p-3", isRTL && "flex-row-reverse")}>
            <Receipt className="w-5 h-5 text-primary" />
            <div className={cn(isRTL && "text-right")}>
              <p className="text-xs text-muted-foreground">
                {isRTL ? 'إجمالي المصاريف' : 'Total Expenses'}
              </p>
              <p className="font-bold text-lg">
                {stats.total_expenses.toLocaleString()} {isRTL ? 'ريال' : 'SAR'}
              </p>
            </div>
          </div>
          
          <div className={cn("flex items-center gap-2 bg-background/50 rounded-lg p-3", isRTL && "flex-row-reverse")}>
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <div className={cn(isRTL && "text-right")}>
              <p className="text-xs text-muted-foreground">
                {isRTL ? 'أكثر فئة' : 'Top Category'}
              </p>
              <p className="font-bold text-sm truncate">
                {stats.top_category}
              </p>
            </div>
          </div>
          
          {hasSavings && (
            <div className={cn("flex items-center gap-2 bg-green-50 dark:bg-green-950/30 rounded-lg p-3", isRTL && "flex-row-reverse")}>
              <TrendingDown className="w-5 h-5 text-green-600" />
              <div className={cn(isRTL && "text-right")}>
                <p className="text-xs text-muted-foreground">
                  {isRTL ? 'وفرت' : 'Saved'}
                </p>
                <p className="font-bold text-lg text-green-600">
                  {stats.savings.toLocaleString()} {isRTL ? 'ريال' : 'SAR'}
                </p>
              </div>
            </div>
          )}
          
          <div className={cn("flex items-center gap-2 bg-background/50 rounded-lg p-3", isRTL && "flex-row-reverse")}>
            <Users className="w-5 h-5 text-blue-500" />
            <div className={cn(isRTL && "text-right")}>
              <p className="text-xs text-muted-foreground">
                {isRTL ? 'المجموعات النشطة' : 'Active Groups'}
              </p>
              <p className="font-bold text-lg">{stats.groups_count}</p>
            </div>
          </div>
        </div>
        
        {!showShareOptions ? (
          <Button 
            className="w-full gap-2" 
            onClick={() => setShowShareOptions(true)}
          >
            <Share2 className="w-4 h-4" />
            <Coins className="w-4 h-4" />
            {isRTL ? 'شارك ملخصك واحصل على 30 عملة!' : 'Share your wrap & get 30 coins!'}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-1 text-green-600 border-green-200 hover:bg-green-50"
              onClick={() => handleShare('whatsapp')}
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Button>
            
            <Button
              variant="outline"
              className="flex-1 gap-1 text-blue-500 border-blue-200 hover:bg-blue-50"
              onClick={() => handleShare('twitter')}
            >
              <Twitter className="w-4 h-4" />
              Twitter
            </Button>
            
            <Button
              variant="outline"
              className="flex-1 gap-1"
              onClick={() => handleShare('copy')}
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? '✓' : (isRTL ? 'نسخ' : 'Copy')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
