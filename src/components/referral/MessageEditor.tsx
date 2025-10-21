import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getDefaultMessage, type SocialPlatform, PLATFORM_CONFIGS } from '@/lib/socialShareConfig';
import { Copy, RotateCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface MessageEditorProps {
  referralCode: string;
  referralLink: string;
  onMessageChange?: (message: string) => void;
  selectedPlatform?: SocialPlatform;
}

export const MessageEditor = ({
  referralCode,
  referralLink,
  onMessageChange,
  selectedPlatform = 'whatsapp'
}: MessageEditorProps) => {
  const [message, setMessage] = useState(getDefaultMessage(referralCode, selectedPlatform));
  const [charCount, setCharCount] = useState(message.length);

  const handleMessageChange = (newMessage: string) => {
    setMessage(newMessage);
    setCharCount(newMessage.length);
    onMessageChange?.(newMessage);
  };

  const handleReset = () => {
    const defaultMsg = getDefaultMessage(referralCode, selectedPlatform);
    handleMessageChange(defaultMsg);
    toast({
      title: 'تم إعادة التعيين',
      description: 'تم استعادة الرسالة الافتراضية'
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${message}\n\n${referralLink}`);
      toast({
        title: 'تم النسخ',
        description: 'تم نسخ الرسالة والرابط'
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل نسخ الرسالة',
        variant: 'destructive'
      });
    }
  };

  const getCharLimitColor = () => {
    if (charCount > 500) return 'text-destructive';
    if (charCount > 400) return 'text-warning';
    return 'text-muted-foreground';
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="message">رسالة الإحالة المخصصة</Label>
          <span className={`text-sm ${getCharLimitColor()}`}>
            {charCount} / 500
          </span>
        </div>
        
        <Textarea
          id="message"
          value={message}
          onChange={(e) => handleMessageChange(e.target.value)}
          placeholder="اكتب رسالتك المخصصة هنا..."
          rows={6}
          maxLength={500}
          className="resize-none"
        />

        <div className="flex gap-2">
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <RotateCcw className="h-4 w-4 ml-2" />
            إعادة للافتراضي
          </Button>
          
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Copy className="h-4 w-4 ml-2" />
            نسخ الرسالة
          </Button>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
        <Label className="text-xs text-muted-foreground">معاينة الرسالة النهائية:</Label>
        <div className="text-sm whitespace-pre-wrap break-words">
          {message}
          <div className="text-primary font-medium mt-2">
            {referralLink}
          </div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>💡 نصائح لرسالة فعالة:</p>
        <ul className="list-disc list-inside mr-4 space-y-1">
          <li>اجعل الرسالة قصيرة ومباشرة</li>
          <li>اذكر الفوائد (مثل: 7 أيام مجانية)</li>
          <li>استخدم الإيموجي بشكل معتدل</li>
          <li>أضف كود الإحالة بوضوح</li>
        </ul>
      </div>
    </Card>
  );
};
